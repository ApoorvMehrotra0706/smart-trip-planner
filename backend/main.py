from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx
import json
import os
from database import init_db, save_trip, get_trip, list_trips, delete_trip

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")


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


class ItineraryRequest(BaseModel):
    cities: list   # [{"name": str, "days": int, "styles": list[str]}]


class SaveTripRequest(BaseModel):
    name: str
    places: list
    days: int
    style: str
    itinerary: str


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

    # Build example format — include Travel line only when hotel is provided
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
                f"Tip: [practical tip]{travel_example}"
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
- Match each city's activities to its assigned travel style.{travel_rule}"""


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


@app.post("/api/trips")
async def create_trip(req: SaveTripRequest):
    slug = await save_trip(req.name, req.places, req.days, req.style, req.itinerary)
    return {"slug": slug, "url": f"/trip/{slug}"}


@app.get("/api/trips")
async def get_all_trips():
    return await list_trips()


@app.get("/api/trips/{slug}")
async def fetch_trip(slug: str):
    trip = await get_trip(slug)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@app.delete("/api/trips/{slug}")
async def remove_trip(slug: str):
    deleted = await delete_trip(slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"deleted": slug}
