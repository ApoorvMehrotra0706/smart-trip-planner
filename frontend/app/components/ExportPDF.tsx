"use client";
import { Place } from "../lib/types";

interface Props {
  tripName: string;
  places: Place[];
  styles: string[];
  itinerary: string;
}

// ── parser (mirrors ItineraryView.tsx) ───────────────────────────────────────

interface Segment { label: string; icon: string; color: string; content: string; }
interface DayBlock { header: string; segments: Segment[]; }

const LABELS: Record<string, { icon: string; color: string }> = {
  Morning:   { icon: "🌅", color: "#f59e0b" },
  Afternoon: { icon: "☀️",  color: "#eab308" },
  Evening:   { icon: "🌙", color: "#818cf8" },
  Tip:       { icon: "💡", color: "#34d399" },
  Travel:      { icon: "🚇", color: "#38bdf8" },
  Precautions: { icon: "⚠️", color: "#fb7185" },
};

function normalize(text: string): string {
  return text
    .replace(/\bnoon:/gi,  "\nAfternoon:")
    .replace(/\bning:/gi,  "\nEvening:")
    .replace(/\.?\s*(Day\s+\d+)/gi,          "\n\n$1")
    .replace(/[.!?]\s*(\d+)\s*[-–]\s*/g,    "\n\nDay $1 - ")
    .replace(/\.?\s*(Morning):/gi,   "\nMorning:")
    .replace(/\.?\s*(Afternoon):/gi, "\nAfternoon:")
    .replace(/\.?\s*(Evening):/gi,   "\nEvening:")
    .replace(/\.?\s*(Tip):/gi,       "\nTip:")
    .replace(/\.?\s*(Travel):/gi,       "\nTravel:")
    .replace(/\.?\s*(Precautions):/gi,  "\nPrecautions:")
    .replace(/\bing:/gi,  "\nEvening:")
    .replace(/\n{3,}/g, "\n\n");
}

function parse(text: string): DayBlock[] {
  const lines = normalize(text).split("\n").map(l => l.trim()).filter(Boolean);
  const days: DayBlock[] = [];
  let current: DayBlock | null = null;

  for (const line of lines) {
    if (/^Day\s+\d+/i.test(line)) {
      const dayMatch = line.match(/^(Day\s+\d+(?:\s*[-–]\s*.+)?)/i);
      const header = (dayMatch ? dayMatch[1] : line).replace(/:$/, "").trim();
      const rest = dayMatch ? line.slice(dayMatch[0].length).replace(/^[\s:,]+/, "").trim() : "";
      current = { header, segments: [] };
      days.push(current);
      if (rest.length > 15) {
        current.segments.push({ label: "Morning", content: rest, ...LABELS["Morning"] });
      }
      continue;
    }
    const match = line.match(/^(Morning|Afternoon|Evening|Tip|Travel|Precautions):\s*([\s\S]*)/);
    if (match) {
      const [, label, content] = match;
      if (!current) { current = { header: "", segments: [] }; days.push(current); }
      current.segments.push({ label, content: content.trim(), ...LABELS[label] });
      continue;
    }
    if (current && current.segments.length > 0) {
      current.segments[current.segments.length - 1].content += " " + line;
    }
  }
  return days.filter(d => d.segments.length > 0);
}

// ── HTML builder ─────────────────────────────────────────────────────────────

function buildHtml(tripName: string, places: Place[], styles: string[], itinerary: string): string {
  const days = parse(itinerary);
  const totalDays = places.reduce((s, p) => s + (p.days ?? 3), 0);
  const styleLabel = styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");
  const title = tripName || `${totalDays}-Day ${styleLabel} Trip`;
  const placeNames = places.map(p => p.name).join(" → ");
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const segBg: Record<string, string> = {
    Morning:   "#fff8e7",
    Afternoon: "#fffbe6",
    Evening:   "#f0f0ff",
    Tip:       "#edfdf5",
    Travel:      "#e0f7ff",
    Precautions: "#fff0f0",
  };
  const segBorder: Record<string, string> = {
    Morning:     "#f59e0b",
    Afternoon:   "#eab308",
    Evening:     "#818cf8",
    Tip:         "#34d399",
    Travel:      "#38bdf8",
    Precautions: "#fb7185",
  };

  const dayHtml = days.map(day => {
    const segsHtml = day.segments.map(seg => `
      <div style="background:${segBg[seg.label] ?? "#f9f9f9"};border-left:4px solid ${segBorder[seg.label] ?? "#ccc"};border-radius:6px;padding:10px 14px;margin-bottom:8px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${seg.color};margin-bottom:4px;">
          ${seg.icon} ${seg.label}
        </div>
        <div style="font-size:13px;color:#334155;line-height:1.6;">${seg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      </div>`).join("");

    return `
      <div style="margin-bottom:24px;page-break-inside:avoid;">
        <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:8px;padding:10px 16px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">📍</span>
          <span style="font-size:14px;font-weight:700;color:#4c1d95;">${day.header}</span>
        </div>
        <div style="padding-left:8px;">${segsHtml}</div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; color: #1e293b; padding: 40px; max-width: 750px; margin: 0 auto; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:28px;">
    <div style="font-size:26px;font-weight:bold;color:#1e293b;">🧭 ${title}</div>
    <div style="margin-top:6px;font-size:13px;color:#64748b;">${styleLabel} &nbsp;·&nbsp; ${totalDays} day${totalDays !== 1 ? "s" : ""}</div>
    <div style="margin-top:4px;font-size:12px;color:#7c3aed;font-style:italic;">📍 ${placeNames}</div>
  </div>
  ${dayHtml}
  <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:14px;font-size:11px;color:#94a3b8;text-align:center;">
    Generated by Smart Trip Planner · ${date}
  </div>
</body>
</html>`;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ExportPDF({ tripName, places, styles, itinerary }: Props) {
  function exportPDF() {
    const html = buildHtml(tripName, places, styles, itinerary);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  }

  return (
    <button
      onClick={exportPDF}
      className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-600"
    >
      📄 Export as PDF
    </button>
  );
}
