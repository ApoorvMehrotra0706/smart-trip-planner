from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx
import json
import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from database import (
    init_db, save_trip, get_trip, list_trips, delete_trip,
    create_user, get_user_by_email, get_user_by_google_id, link_google_id,
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

_bearer = HTTPBearer(auto_error=False)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def make_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict | None:
    if not credentials:
        return None
    return decode_token(credentials.credentials)


async def require_user(
    user: dict | None = Depends(get_current_user),
) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


# ── Lifespan / app setup ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Smart Trip Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response models ─────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    google_id: str
    email: str
    name: str


class ItineraryRequest(BaseModel):
    cities: list   # [{"name": str, "days": int, "styles": list[str]}]


class SaveTripRequest(BaseModel):
    name: str
    places: list
    days: int
    style: str
    itinerary: str


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/signup")
async def signup(req: SignupRequest):
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user = await create_user(req.email, req.name, password_hash=password_hash)
    token = make_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.post("/auth/login")
async def login(req: LoginRequest):
    user = await get_user_by_email(req.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = make_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.post("/auth/google")
async def google_auth(req: GoogleAuthRequest):
    # Try to find by google_id first, then by email
    user = await get_user_by_google_id(req.google_id)
    if not user:
        user = await get_user_by_email(req.email)
        if user:
            # Existing email account — link the google_id
            await link_google_id(user["id"], req.google_id)
        else:
            # Brand-new user via Google
            user = await create_user(req.email, req.name, google_id=req.google_id)
    token = make_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.get("/auth/me")
async def me(user: dict = Depends(require_user)):
    return {"id": user["sub"], "email": user["email"]}


# ── AI helpers ────────────────────────────────────────────────────────────────

def build_prompt(cities: list) -> str:
    style_descriptions = {
        "adventure": "action-packed with outdoor activities, hiking, and thrilling experiences",
        "relaxed": "leisurely with plenty of rest, scenic walks, and comfortable dining",
        "cultural": "rich in museums, historical sites, local traditions, and authentic cuisine",
        "budget": "cost-effective with free attractions, street food, and affordable accommodation tips",
    }

    city_lines = []
    for c in cities:
        city_styles = c.get("styles", ["relaxed"])
        style_label = " + ".join(s.capitalize() for s in city_styles)
        style_desc = " and ".join(
            style_descriptions.get(s, "balanced and enjoyable") for s in city_styles
        )
        days = c["days"]
        hotel = c.get("hotel", "").strip()
        hotel_note = f", staying at {hotel}" if hotel else ""
        city_lines.append(
            f"  - {c['name']}: {days} day{'s' if days > 1 else ''} ({style_label} — {style_desc}){hotel_note}"
        )
    city_schedule = "\n".join(city_lines)
    total_days = sum(c["days"] for c in cities)

    any_hotel = any(c.get("hotel", "").strip() for c in cities)
    example_lines = []
    day_num = 1
    for c in cities:
        hotel = c.get("hotel", "").strip()
        travel_example = (
            f"\nTravel: From {hotel}, take [metro/bus/taxi] to [first attraction] — ~[X] min, ~[local currency + cost]"
            if hotel else ""
        )
        for _ in range(c["days"]):
            example_lines.append(
                f"Day {day_num} - {c['name']}\n"
                f"Morning: [activity]\nAfternoon: [activity]\nEvening: [activity]\n"
                f"Tip: [practical tip]{travel_example}\n"
                f"Precautions: [safety tips, dress codes, scam warnings, health or weather precautions relevant to today's activities]"
            )
            day_num += 1
    example_format = "\n\n".join(example_lines)

    travel_rule = (
        "\n- Every day MUST include a Travel line (after Tip) showing how to get from the accommodation to that day's first attraction, including transport mode, estimated time, and estimated cost in local currency."
        if any_hotel else ""
    )

    return f"""You are an expert travel planner. Create a detailed multi-city trip itinerary.

Each city has its own travel style — follow it closely for that city's days.

Cities, durations, and styles:
{city_schedule}

STRICT FORMAT — follow exactly for all {total_days} days:
{example_format}

Rules:
- The Day line contains ONLY "Day N - CityName". Nothing else on that line.
- Every day MUST have Morning, Afternoon, Evening, and Tip — each on its own line with the label.
- Do NOT skip any label. Do NOT put activity text on the Day line.
- Number days consecutively across all cities (Day 1, Day 2, ..., Day {total_days}).
- Be specific with real place names and attractions for each city.
- Match each city's activities to its assigned travel style.{travel_rule}
- Every day MUST include a Precautions line with safety tips, scam warnings, dress codes, health or weather advice relevant to that day's specific activities and locations."""


async def stream_groq(prompt: str):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2048,
        "temperature": 0.7,
        "stream": True,
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("POST", GROQ_API_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error = await response.aread()
                    yield f"data: ⚠️ Groq error {response.status_code}: {error.decode()}\n\n"
                    yield "data: [DONE]\n\n"
                    return
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    raw = line[5:].strip()
                    if raw == "[DONE]":
                        yield "data: [DONE]\n\n"
                        return
                    try:
                        data = json.loads(raw)
                        token = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if token:
                            yield f"data: {token}\n\n"
                    except (json.JSONDecodeError, IndexError):
                        continue
    except Exception as e:
        yield f"data: ⚠️ Generation failed: {str(e)}\n\n"
        yield "data: [DONE]\n\n"


async def stream_ollama(prompt: str):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST", OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
        ) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    token = data.get("response", "")
                    if token:
                        yield f"data: {token}\n\n"
                    if data.get("done"):
                        yield "data: [DONE]\n\n"
                        break
                except json.JSONDecodeError:
                    continue


def get_stream(prompt: str):
    if GROQ_API_KEY:
        return stream_groq(prompt)
    return stream_ollama(prompt)


# ── Public endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    mode = "groq" if GROQ_API_KEY else "ollama"
    return {"status": "ok", "ai_mode": mode, "model": GROQ_MODEL if GROQ_API_KEY else OLLAMA_MODEL}


@app.post("/api/itinerary")
async def generate_itinerary(req: ItineraryRequest):
    prompt = build_prompt(req.cities)
    return StreamingResponse(
        get_stream(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/trips/{slug}")
async def fetch_trip(slug: str):
    trip = await get_trip(slug)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


# ── Protected trip endpoints ──────────────────────────────────────────────────

@app.post("/api/trips")
async def create_trip(req: SaveTripRequest, user: dict = Depends(require_user)):
    slug = await save_trip(req.name, req.places, req.days, req.style, req.itinerary, user_id=user["sub"])
    return {"slug": slug, "url": f"/trip/{slug}"}


@app.get("/api/trips")
async def get_all_trips(user: dict = Depends(require_user)):
    return await list_trips(user["sub"])


@app.delete("/api/trips/{slug}")
async def remove_trip(slug: str, user: dict = Depends(require_user)):
    deleted = await delete_trip(slug, user["sub"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found or not yours")
    return {"deleted": slug}
