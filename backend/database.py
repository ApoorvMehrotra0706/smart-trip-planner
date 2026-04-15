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
    """)


def make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:6]}" if base else uuid.uuid4().hex[:6]


async def save_trip(name: str, places: list, days: int, style: str, itinerary: str) -> str:
    slug    = make_slug(name or "trip")
    trip_id = str(uuid.uuid4())
    now     = datetime.utcnow().isoformat()
    await _turso(
        "INSERT INTO trips (id, slug, name, places, days, style, itinerary, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [trip_id, slug, name, json.dumps(places), days, style, itinerary, now],
    )
    return slug


async def list_trips() -> list:
    result = await _turso(
        "SELECT slug, name, days, style, created_at, places "
        "FROM trips ORDER BY created_at DESC LIMIT 50"
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
    result = await _turso("SELECT * FROM trips WHERE slug = ?", [slug])
    rows   = _rows(result)
    if not rows:
        return None
    r = rows[0]
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


async def delete_trip(slug: str) -> bool:
    result = await _turso("DELETE FROM trips WHERE slug = ?", [slug])
    return (result.get("affected_row_count") or 0) > 0
