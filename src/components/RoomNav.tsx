"use client";

import { Home, Mountain, HeartPulse, ChevronRight } from "lucide-react";
import type { RoomId } from "@/lib/sim/types";

const ROOMS: { id: RoomId; label: string; sub: string; icon: typeof Home }[] = [
  { id: "control", label: "Control", sub: "Reparto de energía", icon: Home },
  { id: "exterior", label: "Exterior", sub: "Paneles y rover", icon: Mountain },
  { id: "vitales", label: "Vitales", sub: "Radiación y ciencia", icon: HeartPulse },
];

export default function RoomNav({
  room,
  onRoom,
  onEndSol,
  canEnd,
  sol,
}: {
  room: RoomId;
  onRoom: (r: RoomId) => void;
  onEndSol: () => void;
  canEnd: boolean;
  sol: number;
}) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line/80 bg-void/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-stretch gap-2 px-3 py-3 sm:px-6">
        <div className="flex flex-1 gap-2">
          {ROOMS.map((r) => {
            const active = r.id === room;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => onRoom(r.id)}
                className="group flex flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all sm:flex-none sm:px-4"
                style={{
                  borderColor: active ? "#e8a15c66" : "#1c2333",
                  background: active ? "rgba(232,161,92,0.1)" : "rgba(255,255,255,0.02)",
                }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} style={{ color: active ? "#e8a15c" : "#8b93a6" }} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{r.label}</span>
                  <span className="micro hidden !text-[9px] sm:block">{r.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button onClick={onEndSol} disabled={!canEnd} className="btn btn-primary shrink-0 !px-5">
          Terminar sol {sol}
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
