"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Place } from "../lib/types";
import { API_URL } from "../lib/api";

interface Props {
  tripName: string;
  places: Place[];
  styles: string[];
  itinerary: string;
}

function getSafeOrigin(): string {
  try {
    const origin = window.location.origin;
    if (!origin || origin === "null") return "http://localhost:3001";
    return origin;
  } catch {
    return "http://localhost:3001";
  }
}

export default function SaveTrip({ tripName, places, styles, itinerary }: Props) {
  const { data: session } = useSession();
  const days = places.reduce((s, p) => s + (p.days ?? 3), 0);
  const style = styles.join(", ");
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not logged in — prompt to sign in
  if (!session?.backendToken) {
    return (
      <div className="mt-3 p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
        <p className="text-xs text-slate-400 mb-2">Sign in to save & share your trip</p>
        <Link
          href="/login"
          className="inline-block text-xs bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session!.backendToken}`,
        },
        body: JSON.stringify({
          name: tripName || `${days}-Day ${style} Trip`,
          places,
          days,
          style,
          itinerary,
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const url = `${getSafeOrigin()}${data.url}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trip. Make sure the backend is running.");
    } finally {
      try {
        setSaving(false);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text manually
    }
  }

  if (shareUrl) {
    return (
      <div className="mt-4 p-3 bg-slate-800 rounded-xl border border-violet-700/50">
        <p className="text-xs text-violet-400 font-semibold mb-2">Trip saved! Share this link:</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-300 truncate font-mono">{shareUrl}</span>
          <button
            onClick={copy}
            className="shrink-0 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-100 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-600"
      >
        {saving ? (
          <><div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Saving...</>
        ) : "🔗 Save & Share Trip"}
      </button>
    </div>
  );
}
