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
};

function normalize(text: string): string {
  return text
    .replace(/\.?(Day\s+\d+)/gi,      "\n\n$1")
    .replace(/\.?\s*(Morning):/gi,    "\nMorning:")
    .replace(/\.?\s*(Afternoon):/gi,  "\nAfternoon:")
    .replace(/\.?\s*(Evening):/gi,    "\nEvening:")
    .replace(/\.?\s*(ing):/gi,        "\nEvening:")   // handle "...city.ing:" artifact
    .replace(/\.?\s*(noon):/gi,       "\nAfternoon:")  // handle "...city.noon:" artifact
    .replace(/\.?\s*(Tip):/gi,        "\nTip:")
    .replace(/\n{3,}/g, "\n\n");
}

function parse(text: string): DayBlock[] {
  const normalized = normalize(text);
  const lines = normalized.split("\n").map(l => l.trim()).filter(Boolean);

  const days: DayBlock[] = [];
  let current: DayBlock | null = null;

  for (const line of lines) {
    if (/^Day\s+\d+/i.test(line)) {
      // Strip trailing colon from header
      const header = line.replace(/:$/, "").trim();
      current = { header, segments: [] };
      days.push(current);
      continue;
    }

    const match = line.match(/^(Morning|Afternoon|Evening|Tip):\s*([\s\S]*)/);
    if (match) {
      const [, label, content] = match;
      const meta = LABELS[label];
      if (!current) {
        current = { header: "", segments: [] };
        days.push(current);
      }
      current.segments.push({ label, content: content.trim(), ...meta });
      continue;
    }

    // Plain text — append to last segment or day header
    if (current) {
      if (current.segments.length > 0) {
        current.segments[current.segments.length - 1].content += " " + line;
      } else {
        current.header += " " + line;
      }
    }
  }

  return days;
}

export default function ItineraryView({ text }: { text: string }) {
  const days = parse(text);

  // Fallback: if parsing yields nothing useful, show plain formatted text
  if (days.length === 0 || days.every(d => d.segments.length === 0)) {
    return (
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
    );
  }

  return (
    <div className="space-y-6">
      {days.map((day, di) => (
        <div key={di}>
          {day.header && (
            <div className="flex items-center gap-2 bg-violet-900/40 border border-violet-600/40 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-lg">📍</span>
              <span className="text-violet-100 font-bold text-sm tracking-wide">{day.header}</span>
            </div>
          )}
          <div className="space-y-3 pl-1">
            {day.segments.map((seg, si) => (
              <div key={si} className={`rounded-xl border px-4 py-3 ${seg.bg}`}>
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-1.5 ${seg.color}`}>
                  <span>{seg.icon}</span>
                  <span>{seg.label}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{seg.content}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
