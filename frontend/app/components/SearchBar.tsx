"use client";
import { useState, useRef, useEffect } from "react";
import { searchPlaces } from "../lib/nominatim";
import { Place } from "../lib/types";

interface Props {
  onAdd: (place: Place) => void;
}

export default function SearchBar({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlaces(query);
        setResults(places);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 400);
  }, [query]);

  function pick(place: Place) {
    onAdd(place);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500"
          placeholder="Search a city or place..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {loading && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-2xl">
          {results.map(place => (
            <button
              key={place.id}
              onClick={() => pick(place)}
              className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
            >
              <div className="text-sm font-medium text-slate-100 truncate">{place.name}</div>
              <div className="text-xs text-slate-400 truncate mt-0.5">{place.displayName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
