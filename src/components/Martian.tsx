"use client";

import { Sparkles } from "lucide-react";

export default function Martian({ onScare }: { onScare: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent p-4">
      <div className="panel rise mb-20 w-full max-w-md overflow-hidden">
        <div className="relative h-28 bg-gradient-to-b from-[#2a1512] to-[#120a09]">
          <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="100" cy="96" r="46" fill="#7a3b2a" />
            <circle cx="86" cy="70" r="5" fill="#120a09" />
            <circle cx="114" cy="70" r="5" fill="#120a09" />
            <path d="M90 82q10 8 20 0" stroke="#120a09" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="72" cy="86" r="6" fill="#a55a3f" opacity="0.7" />
            <circle cx="128" cy="86" r="6" fill="#a55a3f" opacity="0.7" />
          </svg>
          <span className="absolute right-3 top-3 chip" style={{ color: "#ef6b6b", borderColor: "#ef6b6b44" }}>
            FICCION
          </span>
        </div>
        <div className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={15} className="text-dust" /> Un marciano en la ventana
          </h3>
          <p className="mt-1 text-[11.5px] leading-snug text-muted">
            Te tiro tierra en el panel. No es ciencia: es un easter egg. Sal a espantarlo antes de que
            ensucie mas.
          </p>
          <button onClick={onScare} className="btn btn-primary mt-3 w-full">
            Salir a espantarlo
          </button>
        </div>
      </div>
    </div>
  );
}
