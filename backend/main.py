from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx
import json
import os
from database import init_db, save_trip, get_trip, list_trips, delete_trip

HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "qwen/qwen2.5-7b-instruct")
HF_API_URL = os.getenv("HF_API_URL", "https://router.huggingface.co/novita/v3/openai/chat/completions")

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
    cities: list   # [{"name": str, "days": int}]
    styles: list   # ["relaxed", "cultural", ...]


class SaveTripRequest(BaseModel):
    name: str
    places: list
    days: int
    style: str
    itinerary: str


def build_prompt(cities: list, styles: list) -> str:
    style_descriptions = {
        "adventure": "action-packed with outdoor activities, hiking, and thrilling experiences",
        "relaxed": "leisurely with plenty of rest, scenic walks, and comfortable dining",
        "cultural": "rich in museums, historical sites, local traditions, and authentic cuisine",
        "budget": "cost-effective with free attractions, street food, and affordable accommodation tips",
    }
    style_desc = " and ".join(
        style_descriptions.get(s, "balanced and enjoyable") for s in styles
    )
    style_label = " + ".join(s.capitalize() for s in styles)

    city_schedule = "\n".join(
        f"  - {c['name']}: {c['days']} day{'s' if c['days'] > 1 else ''}"
        for c in cities
    )
    total_days = sum(c["days"] for c in cities)

    # Build the example format showing day numbering across cities
    example_lines = []
    day_num = 1
    for c in cities:
        for _ in range(c["days"]):
            example_lines.append(
                f"Day {day_num} - {c['name']}\n"
                f"Morning: [activity]\nAfternoon: [activity]\nEvening: [activity]\nTip: [practical tip]"
            )
            day_num += 1
    example_format = "\n\n".join(example_lines)

    return f"""You are an expert travel planner. Create a detailed multi-city trip itinerary.

Trip style: {style_label} — {style_desc}.

Cities and durations:
{city_schedule}

STRICT FORMAT — follow exactly for all {total_days} days:
{example_format}

Rules:
- The Day line contains ONLY "Day N - CityName". Nothing else on that line.
- Every day MUST have Morning, Afternoon, Evening, and Tip — each on its own line with the label.
- Do NOT skip any label. Do NOT put activity text on the Day line.
- Number days consecutively across all cities (Day 1, Day 2, ..., Day {total_days}).
- Be specific with real place names and attractions for each city."""


async def stream_huggingface(prompt: str):
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": HF_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1200,
        "temperature": 0.7,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", HF_API_URL, headers=headers, json=payload) as response:
            if response.status_code != 200:
                error = await response.aread()
                raise Exception(f"HuggingFace error {response.status_code}: {error.decode()}")
            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                raw = line[5:].strip()
                if raw == "[DONE]":
                    yield "data: [DONE]\n\n"
                    break
                try:
                    data = json.loads(raw)
                    token = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if token:
                        yield f"data: {token}\n\n"
                except (json.JSONDecodeError, IndexError):
                    continue


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
    if HF_TOKEN:
        return stream_huggingface(prompt)
    return stream_ollama(prompt)


@app.get("/health")
async def health():
    mode = "huggingface" if HF_TOKEN else "ollama"
    return {"status": "ok", "ai_mode": mode, "model": HF_MODEL if HF_TOKEN else OLLAMA_MODEL}


@app.post("/api/itinerary")
async def generate_itinerary(req: ItineraryRequest):
    prompt = build_prompt(req.cities, req.styles)
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
