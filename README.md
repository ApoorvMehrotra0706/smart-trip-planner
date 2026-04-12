# 🧭 Smart Trip Planner

An AI-powered trip planner with interactive maps — fully open source, no API keys, no cloud required.

Search places, auto-generate day-by-day itineraries using a local LLM, visualize your route on a map, and share trips with a link.

![Smart Trip Planner](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20Ollama%20%7C%20Leaflet-7c3aed?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Open Source](https://img.shields.io/badge/Open%20Source-100%25-blue?style=flat-square)

---

## Features

- **Place search** — powered by Nominatim (OpenStreetMap), no API key needed
- **Interactive map** — Leaflet + OpenStreetMap with numbered markers and route lines
- **AI itinerary generation** — streams a day-by-day plan from a local Ollama model
- **Trip styles** — Adventure, Relaxed, Cultural, Budget
- **Save & share** — every trip gets a unique shareable URL (`/trip/abc123`)
- **Trip history** — browse all previously planned trips
- **Export to PDF** — download your itinerary as a PDF

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Maps | Leaflet + OpenStreetMap (free, no key) |
| Place search | Nominatim API (free, no key) |
| Backend | FastAPI (Python) |
| AI | Ollama — runs locally (no API key) |
| Database | SQLite |

---

## Getting Started

### 1. Install Ollama and pull a model

Download from [ollama.com](https://ollama.com), then:

```bash
ollama pull llama3
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

## Usage

1. **Search** for cities or places in the left panel
2. **Add** them to your trip — they appear on the map with a route line
3. Set your **duration** and **style** (Adventure / Relaxed / Cultural / Budget)
4. Click **Generate Itinerary** — streams from your local Ollama model
5. Click **Save & Share** to get a shareable link
6. Anyone with the link can view the trip at `/trip/your-slug`

---

## Built with

This project was built with the help of [Claude](https://claude.ai) by Anthropic.

---

## License

MIT
