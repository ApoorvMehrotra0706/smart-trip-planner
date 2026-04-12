"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TripSummary {
  slug: string;
  name: string;
  days: number;
  style: string;
  created_at: string;
  place_count: number;
}

const styleEmojis: Record<string, string> = {
  adventure: "🧗", relaxed: "🌴", cultural: "🏛️", budget: "💰",
};

export default function HistoryPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/trips")
      .then(r => r.json())
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
        <Link href="/" className="text-2xl">🧭</Link>
        <h1 className="text-lg font-bold">Trip History</h1>
        <Link href="/" className="ml-auto text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors">
          + New Trip
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-lg font-medium text-slate-300">No trips saved yet</p>
            <p className="text-sm mt-1">Plan and save a trip to see it here.</p>
            <Link href="/" className="inline-block mt-6 text-violet-400 hover:text-violet-300 underline text-sm">
              Plan your first trip →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-6">{trips.length} saved trip{trips.length > 1 ? "s" : ""}</p>
            {trips.map(trip => (
              <Link
                key={trip.slug}
                href={`/trip/${trip.slug}`}
                className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-600 rounded-xl px-5 py-4 transition-all group"
              >
                <span className="text-2xl">{styleEmojis[trip.style] ?? "✈️"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 truncate group-hover:text-violet-300 transition-colors">
                    {trip.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {trip.days} day{trip.days > 1 ? "s" : ""} · {trip.place_count} place{trip.place_count > 1 ? "s" : ""} · {trip.style}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">
                    {new Date(trip.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="text-xs text-violet-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
