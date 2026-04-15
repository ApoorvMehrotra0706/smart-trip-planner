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
      <div className="flex items-center gap-2.5 bg-white/5 border border-white/[0.08] rounded-xl px-3.5 py-2.5 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/15 transition-all">
        <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder-zinc-600 focus-visible:outline-none"
          placeholder="Search a city or place…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search for a city or place"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 top-full mt-2 w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
          role="listbox"
        >
          {results.map(place => (
            <button
              key={place.id}
              onClick={() => pick(place)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:bg-white/[0.08]"
              role="option"
              aria-selected={false}
            >
              <span className="text-zinc-600 text-sm mt-0.5 shrink-0">📍</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-100 truncate">{place.name}</div>
                <div className="text-xs text-zinc-500 truncate mt-0.5">{place.displayName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
