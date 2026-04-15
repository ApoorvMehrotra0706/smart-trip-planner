import libsql_client
import json
import uuid
import re
import os
from datetime import datetime

TURSO_URL   = os.getenv("TURSO_URL",   "file:trips.db")
TURSO_TOKEN = os.getenv("TURSO_TOKEN", "")


def _client():
    kwargs = {"url": TURSO_URL}
    if TURSO_TOKEN:
        kwargs["auth_token"] = TURSO_TOKEN
    return libsql_client.create_client(**kwargs)


def _to_dict(columns, row):
    return dict(zip(columns, row))


async def init_db():
    async with _client() as db:
        await db.execute("""
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
    short_id = uuid.uuid4().hex[:6]
    return f"{base}-{short_id}" if base else short_id


async def save_trip(name: str, places: list, days: int, style: str, itinerary: str) -> str:
    slug     = make_slug(name or "trip")
    trip_id  = str(uuid.uuid4())
    now      = datetime.utcnow().isoformat()

    async with _client() as db:
        await db.execute(
            "INSERT INTO trips (id, slug, name, places, days, style, itinerary, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [trip_id, slug, name, json.dumps(places), days, style, itinerary, now],
        )
    return slug


async def list_trips() -> list:
    async with _client() as db:
        result = await db.execute(
            "SELECT slug, name, days, style, created_at, places "
            "FROM trips ORDER BY created_at DESC LIMIT 50"
        )
    cols = result.columns
    return [
        {
            "slug":        r[cols.index("slug")],
            "name":        r[cols.index("name")],
            "days":        r[cols.index("days")],
            "style":       r[cols.index("style")],
            "created_at":  r[cols.index("created_at")],
            "place_count": len(json.loads(r[cols.index("places")])),
        }
        for r in result.rows
    ]


async def get_trip(slug: str) -> dict | None:
    async with _client() as db:
        result = await db.execute(
            "SELECT * FROM trips WHERE slug = ?", [slug]
        )
    if not result.rows:
        return None
    cols = result.columns
    r    = result.rows[0]
    return {
        "id":         r[cols.index("id")],
        "slug":       r[cols.index("slug")],
        "name":       r[cols.index("name")],
        "places":     json.loads(r[cols.index("places")]),
        "days":       r[cols.index("days")],
        "style":      r[cols.index("style")],
        "itinerary":  r[cols.index("itinerary")],
        "created_at": r[cols.index("created_at")],
    }


async def delete_trip(slug: str) -> bool:
    async with _client() as db:
        result = await db.execute(
            "DELETE FROM trips WHERE slug = ?", [slug]
        )
    return (result.rows_affected or 0) > 0
