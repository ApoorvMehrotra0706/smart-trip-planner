"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import SearchBar from "./components/SearchBar";
import PlaceList from "./components/PlaceList";
import { Place } from "./lib/types";
import SaveTrip from "./components/SaveTrip";
import ExportPDF from "./components/ExportPDF";
import ItineraryView from "./components/ItineraryView";
import { API_URL } from "./lib/api";
import AuthButton from "./components/AuthButton";

const TripMap = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [tripName, setTripName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);

  const totalDays = places.reduce((s, p) => s + (p.days ?? 3), 0);
  const allStyles = [...new Set(places.flatMap(p => p.styles ?? ["relaxed"]))];
  const styleLabel = allStyles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");

  function addPlace(place: Place) {
    setPlaces(prev =>
      prev.find(p => p.id === place.id) ? prev : [...prev, { ...place, days: 3, styles: ["relaxed"] }]
    );
  }

  function removePlace(id: string) {
    setPlaces(prev => prev.filter(p => p.id !== id));
  }

  function changeDays(id: string, days: number) {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, days } : p));
  }

  function changeHotel(id: string, hotel: string) {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, hotel } : p));
  }

  function toggleCityStyle(id: string, style: string) {
    setPlaces(prev => prev.map(p => {
      if (p.id !== id) return p;
      const current = p.styles ?? ["relaxed"];
      const next = current.includes(style)
        ? current.length > 1 ? current.filter(s => s !== style) : current
        : [...current, style];
      return { ...p, styles: next };
    }));
  }

  function movePlace(id: string, direction: "up" | "down") {
    setPlaces(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
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
          cities: places.map(p => ({ name: p.name, days: p.days ?? 3, styles: p.styles ?? ["relaxed"], hotel: p.hotel ?? "" })),
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
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d0d12]">

      {/* Header */}
      <header className="flex items-center justify-between px-5 bg-[#13131e] border-b border-white/8 shrink-0" style={{ height: "60px" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-lg shadow-lg shadow-violet-900/40 shrink-0">
            🧭
          </div>
          <span className="font-bold text-zinc-100 text-[15px] tracking-tight truncate">Smart Trip Planner</span>
        </div>
        <div className="shrink-0">
          <AuthButton />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-[300px] flex flex-col bg-[#13131e] border-r border-white/8 overflow-y-auto shrink-0">
          <div className="px-4 py-5 space-y-6">

            {/* Search section */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-3">Search cities</p>
              <SearchBar onAdd={addPlace} />
            </div>

            {/* Your trip section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Your trip</p>
                {places.length > 0 && (
                  <span className="text-[11px] bg-violet-950 text-violet-400 px-2 py-0.5 rounded-full border border-violet-800/60 font-medium">
                    {totalDays}d · {places.length} {places.length === 1 ? "city" : "cities"}
                  </span>
                )}
              </div>
              <PlaceList
                places={places}
                onRemove={removePlace}
                onDaysChange={changeDays}
                onStyleToggle={toggleCityStyle}
                onMove={movePlace}
                onHotelChange={changeHotel}
              />
            </div>

            {/* Trip name + generate — only when cities added */}
            {places.length > 0 && (
              <div className="border-t border-white/5 pt-5 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-2">Trip name</p>
                  <input
                    id="trip-name"
                    className="w-full bg-[#1e1e2a] border border-white/12 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    placeholder="e.g. Europe Summer 2025"
                    value={tripName}
                    onChange={e => setTripName(e.target.value)}
                    aria-label="Trip name"
                  />
                </div>
                <button
                  onClick={generateItinerary}
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>✨ Generate Itinerary</>
                  )}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right: map + itinerary */}
        <div className="flex flex-1 overflow-hidden bg-[#0d0d12]">
          <div className={`${itinerary ? "w-1/2" : "flex-1"} transition-all duration-300`}>
            <TripMap places={places} />
          </div>

          {itinerary && (
            <div className="w-1/2 bg-[#111118] border-l border-white/5 overflow-y-auto p-6">
              <h2 className="text-base font-bold text-zinc-100 mb-5 flex items-center gap-2">
                📅 {tripName || `${totalDays}-Day ${styleLabel} Trip`}
              </h2>
              <ItineraryView text={itinerary} streaming={generating} />
              {!generating && (
                <div className="mt-6 space-y-3">
                  <SaveTrip tripName={tripName} places={places} styles={allStyles} itinerary={itinerary} />
                  <ExportPDF tripName={tripName} places={places} styles={allStyles} itinerary={itinerary} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
