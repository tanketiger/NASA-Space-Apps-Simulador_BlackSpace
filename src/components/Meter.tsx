const TONES = {
  dust: "#e8a15c",
  ice: "#5fd0c8",
  good: "#79dc8d",
  warn: "#f2c14e",
  bad: "#ef6b6b",
} as const;

export type Tone = keyof typeof TONES;

export default function Meter({
  label,
  value,
  max = 100,
  unit = "%",
  tone = "dust",
  hint,
  compact = false,
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  tone?: Tone;
  hint?: string;
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = TONES[tone];
  const decimals = unit === "mSv" ? 2 : Number.isInteger(value) ? 0 : 1;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro">{label}</span>
        <span className="num text-sm font-semibold" style={{ color }}>
          {value.toFixed(decimals)}
          <span className="ml-0.5 text-[10px] font-normal opacity-60">{unit}</span>
        </span>
      </div>
      <div
        className={`mt-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-[#141a25] ${
          compact ? "h-1.5" : "h-2.5"
        }`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>
      {hint ? <p className="mt-1 text-[10px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}
