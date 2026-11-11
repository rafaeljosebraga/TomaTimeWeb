import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionPhase, SessionStage } from "@/types/domain";

const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CircularTimerProps {
  stage: SessionStage;
  phase: SessionPhase;
  remainingSeconds: number;
  formattedTime: string;
  progress: number;
  completedCycles: number;
  cyclesBeforeLongBreak: number;
  onReset?: () => void;
}

const STAGE_CONFIG: Record<
  SessionStage,
  { name: string; ring: string; pill: string; dot: string; text: string }
> = {
  TF: {
    name: "Foco",
    ring: "stroke-emerald-500 text-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  TPC: {
    name: "Pausa Curta",
    ring: "stroke-amber-500 text-amber-500",
    pill: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  TPL: {
    name: "Pausa Longa",
    ring: "stroke-rose-500 text-rose-500",
    pill: "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

export function CircularTimer({
  stage,
  phase,
  remainingSeconds,
  formattedTime,
  progress,
  completedCycles,
  cyclesBeforeLongBreak,
  onReset,
}: CircularTimerProps) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.TF;
  const isRunning = phase === "running";
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clampedProgress);

  return (
    <div
      role="timer"
      aria-label={`${cfg.name}: ${Math.floor(remainingSeconds / 60)} minutos e ${
        remainingSeconds % 60
      } segundos restantes. ${completedCycles} ciclos concluídos.`}
      className="relative mx-auto size-56 sm:size-64 md:size-72 shrink-0"
    >
      <svg viewBox="0 0 240 240" className="size-full -rotate-90">
        {/* Circunferência base inativa (trilho sutil) */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-muted/40 dark:stroke-muted/60"
        />
        {/* Linha de progresso proporcional que vai sendo preenchida até fechar o círculo */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            opacity: clampedProgress > 0 ? 1 : 0,
          }}
          className={`${cfg.ring} transition-[stroke-dashoffset,opacity] ${
            isRunning ? "duration-1000 ease-linear" : "duration-300 ease-out"
          }`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.pill}`}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${cfg.dot} ${
              isRunning ? "animate-pulse" : ""
            }`}
          />
          {cfg.name}
          <span className="sr-only">
            {isRunning ? "em andamento" : phase === "paused" ? "pausado" : "parado"}
          </span>
        </span>

        <p
          aria-hidden
          className="text-5xl sm:text-6xl md:text-7xl font-semibold tabular-nums tracking-tight font-mono"
        >
          {formattedTime}
        </p>

        {/* Botão de Zerar Fase no lugar dos indicadores de ciclo */}
        {onReset && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-accent h-10 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={onReset}
            aria-label="Reiniciar tempo da fase atual"
            title="Zerar Fase"
          >
            <RotateCcw className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Zerar</span>
          </button>
        )}
      </div>
    </div>
  );
}
