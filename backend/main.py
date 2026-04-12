from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx
import json
from database import init_db, save_trip, get_trip, list_trips, delete_trip

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Smart Trip Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3"


class ItineraryRequest(BaseModel):
    places: str
    days: int
    style: str
    model: str = DEFAULT_MODEL


class SaveTripRequest(BaseModel):
    name: str
    places: list
    days: int
    style: str
    itinerary: str


def build_prompt(places: str, days: int, style: str) -> str:
    style_descriptions = {
        "adventure": "action-packed with outdoor activities, hiking, and thrilling experiences",
        "relaxed": "leisurely with plenty of rest, scenic walks, and comfortable dining",
        "cultural": "rich in museums, historical sites, local traditions, and authentic cuisine",
        "budget": "cost-effective with free attractions, street food, and affordable accommodation tips",
    }
    desc = style_descriptions.get(style, "balanced and enjoyable")

    return f"""You are an expert travel planner. Create a detailed {days}-day {style} trip itinerary for the following places: {places}.

The trip should be {desc}.

Format the itinerary exactly like this:
Day 1 - [City/Place Name]
Morning: [activity]
Afternoon: [activity]
Evening: [activity]
Tip: [practical travel tip]

Day 2 - [City/Place Name]
...and so on for all {days} days.

Be specific with real place names, restaurants, and attractions. Keep it practical and exciting."""


async def stream_ollama(prompt: str, model: str):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            OLLAMA_URL,
            json={"model": model, "prompt": prompt, "stream": True},
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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/itinerary")
async def generate_itinerary(req: ItineraryRequest):
    prompt = build_prompt(req.places, req.days, req.style)
    return StreamingResponse(
        stream_ollama(prompt, req.model),
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
