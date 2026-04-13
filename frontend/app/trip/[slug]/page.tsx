"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Place } from "../../lib/types";
import Link from "next/link";
import { API_URL } from "../../lib/api";

const TripMap = dynamic(() => import("../../components/Map"), { ssr: false });

interface TripData {
  name: string;
  places: Place[];
  days: number;
  style: string;
  itinerary: string;
  created_at: string;
}

export default function TripPage() {
  const { slug } = useParams<{ slug: string }>();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/trips/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setTrip(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-400">
        <p className="text-4xl mb-4">🗺️</p>
        <p className="text-lg font-semibold text-slate-200">Trip not found</p>
        <p className="text-sm mt-1 mb-6">This link may have expired or the backend isn&apos;t running.</p>
        <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm underline">Plan a new trip</Link>
      </div>
    );
  }

  const styleEmojis: Record<string, string> = {
    adventure: "🧗", relaxed: "🌴", cultural: "🏛️", budget: "💰"
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 shrink-0">
        <span className="text-2xl">🧭</span>
        <div>
          <h1 className="text-lg font-bold text-slate-100">{trip.name}</h1>
          <p className="text-xs text-slate-400">
            {styleEmojis[trip.style]} {trip.style} · {trip.days} day{trip.days > 1 ? "s" : ""} · {trip.places.length} place{trip.places.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">Shared trip</span>
          <Link
            href="/"
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Plan my own →
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="w-1/2 p-4">
          <TripMap places={trip.places} />
        </div>

        {/* Itinerary */}
        <div className="w-1/2 border-l border-slate-800 overflow-y-auto p-6">
          <h2 className="text-base font-bold text-slate-100 mb-1">📅 Itinerary</h2>
          <p className="text-xs text-slate-500 mb-4">
            {trip.places.map(p => p.name).join(" → ")}
          </p>
          <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
            {trip.itinerary}
          </pre>
        </div>
      </div>
    </div>
  );
}
