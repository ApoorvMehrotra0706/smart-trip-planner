interface Props {
  text: string;
}

const TIME_LABELS: Record<string, { icon: string; color: string }> = {
  Morning:   { icon: "🌅", color: "text-amber-400" },
  Afternoon: { icon: "☀️",  color: "text-yellow-400" },
  Evening:   { icon: "🌙", color: "text-indigo-400" },
  Tip:       { icon: "💡", color: "text-emerald-400" },
};

function parseLine(line: string) {
  // Day header: "Day 1 - Paris" or "Day 1:"
  if (/^Day\s+\d+/i.test(line)) {
    return { type: "day", text: line.trim() };
  }
  // Time-of-day label
  for (const label of Object.keys(TIME_LABELS)) {
    if (line.trimStart().startsWith(label + ":")) {
      const content = line.slice(line.indexOf(label + ":") + label.length + 1).trim();
      return { type: "segment", label, content };
    }
  }
  // Non-empty plain line
  if (line.trim()) {
    return { type: "text", text: line.trim() };
  }
  return null;
}

export default function ItineraryView({ text }: Props) {
  const lines = text.split("\n");

  return (
    <div className="space-y-5">
      {lines.map((line, i) => {
        const parsed = parseLine(line);
        if (!parsed) return null;

        if (parsed.type === "day") {
          return (
            <div key={i} className="mt-6 first:mt-0">
              <div className="flex items-center gap-2 bg-violet-900/40 border border-violet-700/50 rounded-xl px-4 py-2.5">
                <span className="text-violet-300 text-base">📍</span>
                <span className="text-violet-100 font-bold text-sm">{parsed.text}</span>
              </div>
            </div>
          );
        }

        if (parsed.type === "segment") {
          const meta = TIME_LABELS[parsed.label!];
          return (
            <div key={i} className="flex gap-3 ml-2">
              <div className="flex flex-col items-center">
                <span className="text-base mt-0.5">{meta.icon}</span>
                <div className="w-px flex-1 bg-slate-700/50 mt-1" />
              </div>
              <div className="pb-3 flex-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${meta.color} block mb-1`}>
                  {parsed.label}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.content}</p>
              </div>
            </div>
          );
        }

        if (parsed.type === "text") {
          return (
            <p key={i} className="text-sm text-slate-400 leading-relaxed ml-2 italic">
              {parsed.text}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
