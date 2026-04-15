# 🧭 Smart Trip Planner

An AI-powered multi-city trip planner with interactive maps — fully open source, no paid API keys required.

Search cities, set per-city duration and travel style, add your accommodation, and generate a detailed day-by-day itinerary powered by Groq AI. Visualize your route on a map, explore recommended places with Wikipedia info, and share trips with a permanent link.

![Smart Trip Planner](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20Groq%20%7C%20Leaflet-7c3aed?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Open Source](https://img.shields.io/badge/Open%20Source-100%25-blue?style=flat-square)

**Live demo:** https://smart-trip-planner-ruddy.vercel.app

---

## Features

- **Multi-city trips** — add as many cities as you want, reorder them with up/down controls
- **Per-city settings** — set duration (1–14 days), travel style, and accommodation address per city
- **Travel styles** — Adventure 🧗, Relaxed 🌴, Cultural 🏛️, Budget 💰 — mix multiple per city
- **AI itinerary generation** — streams a structured plan via Groq (fast, free tier)
- **Structured day cards** — Morning / Afternoon / Evening / Tip / Travel / Precautions segments
- **Travel cost estimates** — when you add a hotel, every day includes transport mode, time, and cost from your accommodation to the day's first attraction
- **Safety precautions** — each day includes warnings for dress codes, scams, health, and weather
- **Clickable place links** — detected place names expand inline with a Wikipedia summary and photo
- **Interactive map** — Leaflet + OpenStreetMap with numbered markers and route lines
- **Save & share** — every trip gets a permanent shareable URL (`/trip/abc123`), stored in Turso cloud
- **Trip history** — browse all previously saved trips
- **Export to PDF** — formatted print-ready layout with color-coded day/segment cards

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Maps | Leaflet + OpenStreetMap (free, no key) |
| Place search | Nominatim API (OpenStreetMap, free, no key) |
| Backend | FastAPI (Python) |
| AI | Groq API — `llama-3.1-8b-instant` (free tier) |
| Database | Turso (libSQL cloud) — persists across deploys |
| Place info | Wikipedia REST API (free, no key) |

---

## Getting Started (Local)

### 1. Clone the repo

```bash
git clone https://github.com/ApoorvMehrotra0706/smart-trip-planner.git
cd smart-trip-planner
```

### 2. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) — free, no credit card needed.

### 3. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
GROQ_API_KEY=your_key_here uvicorn main:app --port 8000
```

> Without `GROQ_API_KEY`, the backend falls back to a local **Ollama** model (`llama3.2`). Install Ollama from [ollama.com](https://ollama.com) and run `ollama pull llama3.2` first.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes (cloud) | Free key from console.groq.com |
| `GROQ_MODEL` | No | Model to use (default: `llama-3.1-8b-instant`) |
| `TURSO_URL` | Yes (cloud) | Turso database URL (`libsql://...`) |
| `TURSO_TOKEN` | Yes (cloud) | Turso auth token |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed frontend origins |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8000`) |

---

## Deployment

The live demo is deployed on:
- **Frontend** → [Vercel](https://vercel.com) (auto-deploys from `main`)
- **Backend** → [Render](https://render.com) free tier (see `render.yaml`)
- **Database** → [Turso](https://turso.tech) free tier (500 MB, persists forever)

Set `GROQ_API_KEY`, `TURSO_URL`, and `TURSO_TOKEN` as environment variables in your Render service.

---

## Usage

1. **Search** for cities in the left panel and add them to your trip
2. **Reorder** cities using the ▲ ▼ buttons
3. **Set duration** per city with the − / + controls
4. **Choose styles** per city: 🧗 Adventure, 🌴 Relaxed, 🏛️ Cultural, 💰 Budget
5. **Add accommodation** — click `+ Add accommodation` under any city to enter a hotel or address
6. Click **✨ Generate Itinerary** — streams your plan live
7. **Click place names** in the itinerary to expand Wikipedia info inline
8. Click **🔗 Save & Share** to get a permanent shareable link
9. Click **📄 Export as PDF** for a formatted print-ready version

---

## Built with

This project was built with the help of [Claude Code](https://claude.ai/code) by Anthropic.

---

## License

MIT
