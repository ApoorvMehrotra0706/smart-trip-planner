import httpx
import json
import uuid
import re
import os
from datetime import datetime

# Turso HTTP API — works with just httpx, no native extensions needed
# TURSO_URL should be libsql://xxx.turso.io — we convert to https:// for HTTP API
_raw_url = os.getenv("TURSO_URL", "").strip()
TURSO_HTTP_URL = (
    _raw_url.replace("libsql://", "https://") + "/v2/pipeline"
    if _raw_url.startswith("libsql://")
    else None
)
TURSO_TOKEN = os.getenv("TURSO_TOKEN", "").strip()

# Fallback: local aiosqlite when no Turso configured
USE_TURSO = bool(TURSO_HTTP_URL and TURSO_TOKEN)

if not USE_TURSO:
    import aiosqlite
    DB_PATH = "trips.db"


# ── Turso HTTP helpers ────────────────────────────────────────────────────────

def _arg(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    return {"type": "text", "value": str(value)}


async def _turso(sql: str, args: list = None):
    """Execute a single SQL statement via Turso HTTP API."""
    payload = {
        "requests": [
            {"type": "execute", "stmt": {
                "sql": sql,
                "args": [_arg(a) for a in (args or [])],
            }},
            {"type": "close"},
        ]
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            TURSO_HTTP_URL,
            json=payload,
            headers={"Authorization": f"Bearer {TURSO_TOKEN}"},
        )
        resp.raise_for_status()
        data = resp.json()

    result = data["results"][0]
    if result["type"] == "error":
        raise Exception(f"Turso error: {result['error']['message']}")
    return result["response"]["result"]


def _rows(result) -> list[dict]:
    cols = [c["name"] for c in result["cols"]]
    return [dict(zip(cols, [cell.get("value") for cell in row])) for row in result["rows"]]


# ── public API ────────────────────────────────────────────────────────────────

async def init_db():
    ddl = """
        CREATE TABLE IF NOT EXISTS trips (
            id         TEXT PRIMARY KEY,
            slug       TEXT UNIQUE NOT NULL,
            name       TEXT NOT NULL,
            places     TEXT NOT NULL,
            days       INTEGER NOT NULL,
            style      TEXT NOT NULL,
            itinerary  TEXT,
            created_at TEXT NOT NULL
        )
    """
    if USE_TURSO:
        await _turso(ddl)
    else:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(ddl)
            await db.commit()


def make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:6]}" if base else uuid.uuid4().hex[:6]


async def save_trip(name: str, places: list, days: int, style: str, itinerary: str) -> str:
    slug    = make_slug(name or "trip")
    trip_id = str(uuid.uuid4())
    now     = datetime.utcnow().isoformat()
    sql     = ("INSERT INTO trips (id, slug, name, places, days, style, itinerary, created_at) "
               "VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    args    = [trip_id, slug, name, json.dumps(places), days, style, itinerary, now]

    if USE_TURSO:
        await _turso(sql, args)
    else:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(sql, args)
            await db.commit()
    return slug


async def list_trips() -> list:
    sql = ("SELECT slug, name, days, style, created_at, places "
           "FROM trips ORDER BY created_at DESC LIMIT 50")
    if USE_TURSO:
        rows = _rows(await _turso(sql))
    else:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(sql) as cur:
                rows = [dict(r) for r in await cur.fetchall()]

    return [
        {
            "slug":        r["slug"],
            "name":        r["name"],
            "days":        r["days"],
            "style":       r["style"],
            "created_at":  r["created_at"],
            "place_count": len(json.loads(r["places"])),
        }
        for r in rows
    ]


async def get_trip(slug: str) -> dict | None:
    sql = "SELECT * FROM trips WHERE slug = ?"
    if USE_TURSO:
        rows = _rows(await _turso(sql, [slug]))
    else:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(sql, (slug,)) as cur:
                row = await cur.fetchone()
                rows = [dict(row)] if row else []

    if not rows:
        return None
    r = rows[0]
    return {
        "id":         r["id"],
        "slug":       r["slug"],
        "name":       r["name"],
        "places":     json.loads(r["places"]),
        "days":       r["days"],
        "style":      r["style"],
        "itinerary":  r["itinerary"],
        "created_at": r["created_at"],
    }


async def delete_trip(slug: str) -> bool:
    sql = "DELETE FROM trips WHERE slug = ?"
    if USE_TURSO:
        result = await _turso(sql, [slug])
        return (result.get("affected_row_count") or 0) > 0
    else:
        async with aiosqlite.connect(DB_PATH) as db:
            cur = await db.execute(sql, (slug,))
            await db.commit()
            return cur.rowcount > 0
