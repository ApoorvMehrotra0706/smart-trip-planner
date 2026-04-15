"use client";
import { useState } from "react";

interface Segment {
  label: string;
  icon: string;
  color: string;
  bg: string;
  content: string;
}

interface DayBlock {
  header: string;
  segments: Segment[];
}

const LABELS: Record<string, { icon: string; color: string; bg: string }> = {
  Morning:   { icon: "🌅", color: "text-amber-300",  bg: "bg-amber-900/20 border-amber-700/40" },
  Afternoon: { icon: "☀️",  color: "text-yellow-300", bg: "bg-yellow-900/20 border-yellow-700/40" },
  Evening:   { icon: "🌙", color: "text-indigo-300",  bg: "bg-indigo-900/20 border-indigo-700/40" },
  Tip:       { icon: "💡", color: "text-emerald-300", bg: "bg-emerald-900/20 border-emerald-700/40" },
  Travel:    { icon: "🚇", color: "text-sky-300",     bg: "bg-sky-900/20 border-sky-700/40" },
};

function normalize(text: string): string {
  return text
    .replace(/\bnoon:/gi,  "\nAfternoon:")
    .replace(/\bning:/gi,  "\nEvening:")
    .replace(/\.?\s*(Day\s+\d+)/gi,           "\n\n$1")
    .replace(/[.!?]\s*(\d+)\s*[-–]\s*/g,     "\n\nDay $1 - ")
    .replace(/\.?\s*(Morning):/gi,    "\nMorning:")
    .replace(/\.?\s*(Afternoon):/gi,  "\nAfternoon:")
    .replace(/\.?\s*(Evening):/gi,    "\nEvening:")
    .replace(/\.?\s*(Tip):/gi,        "\nTip:")
    .replace(/\.?\s*(Travel):/gi,     "\nTravel:")
    .replace(/\bing:/gi,  "\nEvening:")
    .replace(/\n{3,}/g, "\n\n");
}

function parse(text: string): DayBlock[] {
  const normalized = normalize(text);
  const lines = normalized.split("\n").map(l => l.trim()).filter(Boolean);

  const days: DayBlock[] = [];
  let current: DayBlock | null = null;

  for (const line of lines) {
    if (/^Day\s+\d+/i.test(line)) {
      const dayMatch = line.match(/^(Day\s+\d+(?:\s*[-–]\s*\S+)?)/i);
      let header = (dayMatch ? dayMatch[1] : line).replace(/:$/, "").trim();
      const rest = dayMatch ? line.slice(dayMatch[0].length).replace(/^[\s:,]+/, "").trim() : "";
      current = { header, segments: [] };
      days.push(current);
      if (rest.length > 15) {
        current.segments.push({ label: "Morning", content: rest, ...LABELS["Morning"] });
      }
      continue;
    }

    const match = line.match(/^(Morning|Afternoon|Evening|Tip|Travel):\s*([\s\S]*)/);
    if (match) {
      const [, label, content] = match;
      const meta = LABELS[label];
      if (!current) { current = { header: "", segments: [] }; days.push(current); }
      current.segments.push({ label, content: content.trim(), ...meta });
      continue;
    }

    if (current && current.segments.length > 0) {
      current.segments[current.segments.length - 1].content += " " + line;
    }
  }

  return days;
}

// ── place detection ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "Start", "Visit", "Take", "Head", "Enjoy", "Explore", "Walk", "Spend",
  "Consider", "Stop", "Try", "Return", "Be", "Make", "Find", "Stroll",
  "Morning", "Afternoon", "Evening", "Tip", "Day", "The", "This", "These",
  "Your", "Our", "Its", "For", "And", "But", "With", "From", "Into",
  "Through", "Along", "Around", "After", "Before", "During", "Between",
  "Located", "Known", "Famous", "Beautiful", "Stunning", "Charming",
]);

function detectPlaces(text: string): string[] {
  const re = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})\b/g;
  const places: string[] = [];
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    const phrase = m[1].trim();
    const firstWord = phrase.split(/\s+/)[0];
    if (!STOP_WORDS.has(firstWord) && phrase.split(/\s+/).length >= 2) {
      places.push(phrase);
    }
  }
  return [...new Set(places)];
}

// ── place chip ─────────────────────────────────────────────────────────────────

function PlaceChip({ name }: { name: string }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo]       = useState<{ extract: string; thumbnail?: string } | null>(null);

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (info) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
      );
      if (res.ok) {
        const data = await res.json();
        setInfo({ extract: data.extract ?? "No summary available.", thumbnail: data.thumbnail?.source });
      } else {
        setInfo({ extract: "No information found for this place." });
      }
    } catch {
      setInfo({ extract: "Could not load information." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-block">
      <button
        onClick={toggle}
        className="text-xs text-violet-400 underline decoration-dotted underline-offset-2 hover:text-violet-200 transition-colors mr-2 mb-1"
      >
        📍 {name}
      </button>
      {open && (
        <div className="mt-1 mb-2 rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-xs text-slate-300 leading-relaxed">
          {loading ? (
            <span className="text-slate-500">Loading...</span>
          ) : (
            <div className="flex gap-3">
              {info?.thumbnail && (
                <img
                  src={info.thumbnail}
                  alt={name}
                  className="w-16 h-16 object-cover rounded shrink-0"
                />
              )}
              <p>{info?.extract}</p>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function ItineraryView({ text, streaming = false }: { text: string; streaming?: boolean }) {
  if (streaming) {
    return (
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{text}</p>
    );
  }

  const days = parse(text);

  if (days.length === 0 || days.every(d => d.segments.length === 0)) {
    return (
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
    );
  }

  const renderable = days.filter(d => d.segments.length > 0);

  return (
    <div className="space-y-6">
      {renderable.map((day, di) => (
        <div key={di}>
          {day.header && (
            <div className="flex items-center gap-2 bg-violet-900/40 border border-violet-600/40 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-lg">📍</span>
              <span className="text-violet-100 font-bold text-sm tracking-wide">{day.header}</span>
            </div>
          )}
          <div className="space-y-3 pl-1">
            {day.segments.map((seg, si) => {
              const places = (seg.label !== "Tip" && seg.label !== "Travel") ? detectPlaces(seg.content) : [];
              return (
                <div key={si} className={`rounded-xl border px-4 py-3 ${seg.bg}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-1.5 ${seg.color}`}>
                    <span>{seg.icon}</span>
                    <span>{seg.label}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mb-2">{seg.content}</p>
                  {places.length > 0 && (
                    <div className="flex flex-wrap gap-x-0 gap-y-0 mt-1">
                      {places.map(p => <PlaceChip key={p} name={p} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
