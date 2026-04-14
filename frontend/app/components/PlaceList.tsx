"use client";
import { Place } from "../lib/types";

interface Props {
  places: Place[];
  onRemove: (id: string) => void;
  onDaysChange: (id: string, days: number) => void;
}

export default function PlaceList({ places, onRemove, onDaysChange }: Props) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
        </svg>
        <p className="text-sm">Search and add places to your trip</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {places.map((place, i) => (
        <div key={place.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3 group">
          <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-100 truncate">{place.name}</div>
            <div className="text-xs text-slate-400 truncate">{place.displayName}</div>
          </div>

          {/* Per-city duration control */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDaysChange(place.id, Math.max(1, (place.days ?? 3) - 1))}
              className="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              −
            </button>
            <span className="text-xs text-violet-400 w-7 text-center font-mono">{place.days ?? 3}d</span>
            <button
              onClick={() => onDaysChange(place.id, Math.min(14, (place.days ?? 3) + 1))}
              className="w-5 h-5 rounded bg-slate-700 text-slate-300 text-xs flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onRemove(place.id)}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {places.length > 0 && (
        <div className="text-xs text-slate-500 text-right pt-1">
          Total: <span className="text-violet-400 font-medium">{places.reduce((s, p) => s + (p.days ?? 3), 0)} days</span>
        </div>
      )}
    </div>
  );
}
