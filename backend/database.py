import httpx
import json
import uuid
import re
import os
from datetime import datetime

_raw_url  = os.getenv("TURSO_URL", "").strip()
TURSO_URL = _raw_url.replace("libsql://", "https://") + "/v2/pipeline"
TURSO_TOKEN = os.getenv("TURSO_TOKEN", "").strip()


def _arg(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    return {"type": "text", "value": str(value)}


async def _turso(sql: str, args: list = None):
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
            TURSO_URL,
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


async def init_db():
    await _turso("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            name          TEXT,
            password_hash TEXT,
            google_id     TEXT,
            created_at    TEXT NOT NULL
        )
    """)
    await _turso("""
        CREATE TABLE IF NOT EXISTS trips (
            id         TEXT PRIMARY KEY,
            slug       TEXT UNIQUE NOT NULL,
            name       TEXT NOT NULL,
            places     TEXT NOT NULL,
            days       INTEGER NOT NULL,
            style      TEXT NOT NULL,
            itinerary  TEXT,
            created_at TEXT NOT NULL,
            user_id    TEXT
        )
    """)
    # Migrate existing trips table — add user_id if missing
    try:
        await _turso("ALTER TABLE trips ADD COLUMN user_id TEXT")
    except Exception:
        pass  # Column already exists


def make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:6]}" if base else uuid.uuid4().hex[:6]


# ── Auth ──────────────────────────────────────────────────────────────────────

async def create_user(email: str, name: str, password_hash: str | None = None, google_id: str | None = None) -> dict:
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    await _turso(
        "INSERT INTO users (id, email, name, password_hash, google_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, email, name, password_hash, google_id, now],
    )
    return {"id": user_id, "email": email, "name": name}


async def get_user_by_email(email: str) -> dict | None:
    result = await _turso("SELECT * FROM users WHERE email = ?", [email])
    rows = _rows(result)
    return rows[0] if rows else None


async def get_user_by_google_id(google_id: str) -> dict | None:
    result = await _turso("SELECT * FROM users WHERE google_id = ?", [google_id])
    rows = _rows(result)
    return rows[0] if rows else None


async def link_google_id(user_id: str, google_id: str) -> None:
    await _turso("UPDATE users SET google_id = ? WHERE id = ?", [google_id, user_id])


# ── Trips ─────────────────────────────────────────────────────────────────────

async def save_trip(name: str, places: list, days: int, style: str, itinerary: str, user_id: str | None = None) -> str:
    slug    = make_slug(name or "trip")
    trip_id = str(uuid.uuid4())
    now     = datetime.utcnow().isoformat()
    await _turso(
        "INSERT INTO trips (id, slug, name, places, days, style, itinerary, created_at, user_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [trip_id, slug, name, json.dumps(places), days, style, itinerary, now, user_id],
    )
    return slug


async def list_trips(user_id: str) -> list:
    result = await _turso(
        "SELECT slug, name, days, style, created_at, places "
        "FROM trips WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [user_id],
    )
    return [
        {
            "slug":        r["slug"],
            "name":        r["name"],
            "days":        r["days"],
            "style":       r["style"],
            "created_at":  r["created_at"],
            "place_count": len(json.loads(r["places"])),
        }
        for r in _rows(result)
    ]


async def get_trip(slug: str) -> dict | None:
    result = _rows(await _turso("SELECT * FROM trips WHERE slug = ?", [slug]))
    if not result:
        return None
    r = result[0]
    return {
        "id":         r["id"],
        "slug":       r["slug"],
        "name":       r["name"],
        "places":     json.loads(r["places"]),
        "days":       int(r["days"]),
        "style":      r["style"],
        "itinerary":  r["itinerary"],
        "created_at": r["created_at"],
    }


async def delete_trip(slug: str, user_id: str) -> bool:
    result = await _turso(
        "DELETE FROM trips WHERE slug = ? AND user_id = ?", [slug, user_id]
    )
    return (result.get("affected_row_count") or 0) > 0
