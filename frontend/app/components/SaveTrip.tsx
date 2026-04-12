"use client";
import { useState } from "react";
import { Place, Trip } from "../lib/types";

interface Props {
  tripName: string;
  places: Place[];
  days: number;
  style: Trip["style"];
  itinerary: string;
}

export default function SaveTrip({ tripName, places, days, style, itinerary }: Props) {
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tripName || `${days}-Day ${style} Trip`,
          places,
          days,
          style,
          itinerary,
        }),
      });
      const data = await res.json();
      const url = `${window.location.origin}${data.url}`;
      setShareUrl(url);
    } catch {
      alert("Could not save trip. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <button
      onClick={save}
      disabled={saving}
      className="w-full mt-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-100 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-600"
    >
      {saving ? (
        <><div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Saving...</>
      ) : "🔗 Save & Share Trip"}
    </button>
  );
}
