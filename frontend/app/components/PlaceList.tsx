"use client";
import { useState } from "react";
import { Place } from "../lib/types";

const STYLES = [
  { value: "adventure", emoji: "🧗", label: "Adventure" },
  { value: "relaxed",   emoji: "🌴", label: "Relaxed"   },
  { value: "cultural",  emoji: "🏛️", label: "Cultural"  },
  { value: "budget",    emoji: "💰", label: "Budget"    },
];

interface Props {
  places: Place[];
  onRemove: (id: string) => void;
  onDaysChange: (id: string, days: number) => void;
  onStyleToggle: (id: string, style: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onHotelChange: (id: string, hotel: string) => void;
}

function HotelInput({ place, onHotelChange }: { place: Place; onHotelChange: (id: string, hotel: string) => void }) {
  const [open, setOpen] = useState(!!place.hotel);
  return (
    <div className="pl-9">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-600 hover:text-violet-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 rounded"
        >
          + Add accommodation
        </button>
      ) : (
        <input
          type="text"
          value={place.hotel ?? ""}
          onChange={e => onHotelChange(place.id, e.target.value)}
          placeholder="Hotel name or address..."
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 w-full transition-all"
          aria-label="Accommodation name or address"
        />
      )}
    </div>
  );
}

export default function PlaceList({ places, onRemove, onDaysChange, onStyleToggle, onMove, onHotelChange }: Props) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">No cities yet</p>
        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Search for a city above to build your itinerary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {places.map((place, i) => {
        const cityStyles = place.styles ?? ["relaxed"];
        return (
          <div key={place.id} className="bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-xl px-4 py-3.5 space-y-3 transition-all">

            {/* Top row: number + name + days + move + remove */}
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-100 truncate">{place.name}</div>
                <div className="text-xs text-zinc-500 truncate">{place.displayName}</div>
              </div>

              {/* Days control */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onDaysChange(place.id, Math.max(1, (place.days ?? 3) - 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 text-sm flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                  aria-label="Decrease days"
                >−</button>
                <span className="text-sm font-semibold text-zinc-100 w-8 text-center">{place.days ?? 3}d</span>
                <button
                  onClick={() => onDaysChange(place.id, Math.min(14, (place.days ?? 3) + 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 text-sm flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                  aria-label="Increase days"
                >+</button>
              </div>

              {/* Up / Down */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => onMove(place.id, "up")}
                  disabled={i === 0}
                  className="w-6 h-5 text-zinc-500 hover:text-violet-400 disabled:opacity-20 flex items-center justify-center rounded text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                  aria-label="Move city up"
                >▲</button>
                <button
                  onClick={() => onMove(place.id, "down")}
                  disabled={i === places.length - 1}
                  className="w-6 h-5 text-zinc-500 hover:text-violet-400 disabled:opacity-20 flex items-center justify-center rounded text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                  aria-label="Move city down"
                >▼</button>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(place.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded"
                aria-label="Remove city"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Per-city style row */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => onStyleToggle(place.id, s.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    cityStyles.includes(s.value)
                      ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                      : "bg-white/5 border-white/[0.08] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Hotel / accommodation */}
            <HotelInput place={place} onHotelChange={onHotelChange} />

          </div>
        );
      })}

      {places.length > 0 && (
        <div className="text-xs text-zinc-600 text-right pt-1">
          Total: <span className="text-violet-400 font-medium">{places.reduce((s, p) => s + (p.days ?? 3), 0)} days</span>
        </div>
      )}
    </div>
  );
}
