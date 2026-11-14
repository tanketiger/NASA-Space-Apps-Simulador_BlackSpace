"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Hud from "./Hud";
import Martian from "./Martian";
import MissionReport from "./MissionReport";
import Onboarding from "./Onboarding";
import RoomControl from "./RoomControl";
import RoomExterior from "./RoomExterior";
import RoomNav from "./RoomNav";
import RoomVitals from "./RoomVitals";
import { SCENARIOS } from "@/lib/sim/scenarios";
import { useGame } from "@/store/game";

export default function GameClient() {
  const {
    game,
    room,
    onboarding,
    reportOpen,
    martian,
    start,
    reset,
    setRoom,
    setAllocation,
    cleanPanels,
    dispatchRover,
    greenhouse,
    repair,
    nextSol,
    closeReport,
    scareMartian,
    finishOnboarding,
  } = useGame();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="micro pulse-soft">Iniciando puesto avanzado…</div>
      </div>
    );
  }

  if (onboarding || !game) {
    return (
      <Onboarding
        onStart={start}
        hasGame={Boolean(game)}
        onContinue={finishOnboarding}
      />
    );
  }

  const canEnd = game.phase === "plan" && !martian && !reportOpen;

  return (
    <div className="flex min-h-screen flex-col">
      <Hud game={game} onMenu={() => useGame.setState({ onboarding: true })} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-6">
        {SCENARIOS[game.scenario].badge === "empty" && (
          <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-2.5 text-[11px] text-warn">
            <strong className="font-semibold">Modo sin datos.</strong> Falta la NASA_API_KEY: los soles
            estan vacios. Configura la key y ejecuta <code className="num">npm run snapshots</code> para
            jugar con el clima espacial real.
          </div>
        )}

        {room === "control" && (
          <RoomControl game={game} setAllocation={setAllocation} onExterior={() => setRoom("exterior")} />
        )}
        {room === "exterior" && (
          <RoomExterior
            game={game}
            cleanPanels={cleanPanels}
            dispatchRover={dispatchRover}
            greenhouse={greenhouse}
            repair={repair}
          />
        )}
        {room === "vitales" && <RoomVitals game={game} />}

        <p className="mt-6 text-center text-[9px] uppercase tracking-[0.18em] text-muted/70">
          Datos: NASA DONKI · OSDR · Mars Trek · MSL/RAD — sin logos ni marcas de la NASA ·{" "}
          <Link href="/creditos" className="underline decoration-dotted hover:text-dust">
            creditos
          </Link>
        </p>
      </main>

      <RoomNav room={room} onRoom={setRoom} onEndSol={nextSol} canEnd={canEnd} sol={game.sol} />

      {reportOpen && <MissionReport game={game} onClose={closeReport} onRestart={reset} />}
      {martian && <Martian onScare={scareMartian} />}
    </div>
  );
}
