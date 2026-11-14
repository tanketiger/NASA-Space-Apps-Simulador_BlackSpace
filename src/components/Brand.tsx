export default function Brand({ size = 34 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <defs>
          <linearGradient id="aurora-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd9ae" />
            <stop offset="55%" stopColor="#e8a15c" />
            <stop offset="100%" stopColor="#c8563a" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="21" fill="none" stroke="#243044" strokeWidth="1.5" />
        <path
          d="M9 30c6-11 12-15 15-15s9 4 15 15"
          fill="none"
          stroke="url(#aurora-g)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path d="M13 34h22" stroke="#5fd0c8" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="24" cy="16.5" r="2.6" fill="#ffd9ae" />
      </svg>
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-[0.32em] text-ink">AURORA</div>
        <div className="micro mt-1 !text-[9px] !tracking-[0.22em]">Puesto avanzado · Marte</div>
      </div>
    </div>
  );
}
