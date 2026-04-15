"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "../lib/api";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.backendToken) return;
    fetch(`${API_URL}/api/trips`, {
      headers: { "Authorization": `Bearer ${session.backendToken}` },
    })
      .then(r => r.json())
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [session?.backendToken]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-lg shadow-lg shadow-violet-900/40">
            🧭
          </div>
          <span className="font-bold text-slate-100 text-base group-hover:text-violet-300 transition-colors">Smart Trip Planner</span>
        </Link>
        <Link
          href="/"
          className="ml-auto flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-violet-900/30"
        >
          ✨ New Trip
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Your trips</h1>
          <p className="text-slate-500 text-sm mt-1">All your saved itineraries in one place.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mb-5">
              🗺️
            </div>
            <h2 className="text-lg font-semibold text-slate-300">No trips yet</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Plan and save a trip to see it here.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-900/30"
            >
              ✨ Plan your first trip
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <Link
                key={trip.slug}
                href={`/trip/${trip.slug}`}
                className="flex items-center gap-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-xl transition-all shrink-0">
                  {styleEmojis[trip.style] ?? "✈️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate group-hover:text-violet-300 transition-colors">
                    {trip.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {trip.days} day{trip.days > 1 ? "s" : ""} · {trip.place_count} {trip.place_count > 1 ? "cities" : "city"} · {trip.style}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-600">
                    {new Date(trip.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-violet-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
