"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import SearchBar from "./components/SearchBar";
import PlaceList from "./components/PlaceList";
import { Place } from "./lib/types";
import SaveTrip from "./components/SaveTrip";
import ExportPDF from "./components/ExportPDF";
import ItineraryView from "./components/ItineraryView";
import Link from "next/link";
import { API_URL } from "./lib/api";

const TripMap = dynamic(() => import("./components/Map"), { ssr: false });

const STYLES = [
  { value: "adventure", label: "Adventure", emoji: "🧗" },
  { value: "relaxed", label: "Relaxed", emoji: "🌴" },
  { value: "cultural", label: "Cultural", emoji: "🏛️" },
  { value: "budget", label: "Budget", emoji: "💰" },
] as const;

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [styles, setStyles] = useState<string[]>(["relaxed"]);
  const [tripName, setTripName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);

  const totalDays = places.reduce((s, p) => s + p.days, 0);
  const styleLabel = styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");

  function addPlace(place: Place) {
    setPlaces(prev =>
      prev.find(p => p.id === place.id) ? prev : [...prev, { ...place, days: 3 }]
    );
  }

  function removePlace(id: string) {
    setPlaces(prev => prev.filter(p => p.id !== id));
  }

  function changeDays(id: string, days: number) {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, days } : p));
  }

  function toggleStyle(value: string) {
    setStyles(prev =>
      prev.includes(value)
        ? prev.length > 1 ? prev.filter(s => s !== value) : prev  // keep at least 1
        : [...prev, value]
    );
  }

  async function generateItinerary() {
    if (places.length === 0) return;
    setGenerating(true);
    setItinerary(null);

    try {
      const res = await fetch(`${API_URL}/api/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cities: places.map(p => ({ name: p.name, days: p.days })),
          styles,
        }),
      });

      if (!res.body) throw new Error("No response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          text += data;
          setItinerary(text);
        }
      }
    } catch {
      setItinerary("⚠️ Backend not running. Start the FastAPI server (see README) to generate AI itineraries.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="text-2xl">🧭</span>
        <h1 className="text-lg font-bold text-slate-100">Smart Trip Planner</h1>
        <span className="text-xs bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded-full border border-violet-700">AI-powered · Open Source</span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/history" className="text-xs text-slate-400 hover:text-violet-400 transition-colors">
            🕓 History
          </Link>
          <input
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 w-48"
            placeholder="Trip name..."
            value={tripName}
            onChange={e => setTripName(e.target.value)}
          />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="w-80 flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto shrink-0">
          <div className="p-4 space-y-5">

            {/* Search */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Add Cities</label>
              <SearchBar onAdd={addPlace} />
            </div>

            {/* Place list with per-city duration */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Your Itinerary {places.length > 0 && <span className="text-violet-400">({places.length} {places.length === 1 ? "city" : "cities"})</span>}
              </label>
              <PlaceList places={places} onRemove={removePlace} onDaysChange={changeDays} />
            </div>

            {/* Style + generate */}
            {places.length > 0 && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Style <span className="text-slate-600 normal-case font-normal">(pick one or more)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => toggleStyle(s.value)}
                        className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                          styles.includes(s.value)
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateItinerary}
                  disabled={generating}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : "✨ Generate Itinerary"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: map + itinerary */}
        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className={`${itinerary ? "w-1/2" : "flex-1"} p-4 transition-all duration-300`}>
            <TripMap places={places} />
          </div>

          {/* Itinerary */}
          {itinerary && (
            <div className="w-1/2 border-l border-slate-800 overflow-y-auto p-6 bg-slate-900/50">
              <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                📅 {tripName || `${totalDays}-Day ${styleLabel} Trip`}
              </h2>
              <ItineraryView text={itinerary} streaming={generating} />
              {!generating && (
                <>
                  <SaveTrip
                    tripName={tripName}
                    places={places}
                    styles={styles}
                    itinerary={itinerary}
                  />
                  <ExportPDF
                    tripName={tripName}
                    places={places}
                    styles={styles}
                    itinerary={itinerary}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
