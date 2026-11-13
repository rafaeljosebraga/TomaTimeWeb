"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { SessionPhase, SessionStage } from "@/types/domain";
import { useTimerStyle } from "@/components/theme/timer-style-provider";

const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL_TICKS = 48; // 48 marcadores de alta legibilidade e espaçamento perfeito

interface CircularTimerProps {
  stage: SessionStage;
  phase: SessionPhase;
  remainingSeconds: number;
  formattedTime: string;
  progress: number;
  completedCycles: number;
  cyclesBeforeLongBreak: number;
  onReset?: () => void;
  hasNoPresets?: boolean;
}

const STAGE_CONFIG: Record<
  SessionStage,
  {
    name: string;
    ring: string;
    activeColor: string;
    ledColor: string;
    ledGlow: string;
    text: string;
    filterId: string;
    glowColor: string;
  }
> = {
  TF: {
    name: "Foco",
    ring: "stroke-emerald-600 dark:stroke-emerald-400 text-emerald-600 dark:text-emerald-400",
    activeColor: "#10b981", // verde esmeralda
    ledColor: "bg-emerald-500 text-emerald-500",
    ledGlow: "bg-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    filterId: "glow-focus",
    glowColor: "rgba(16, 185, 129, 0.45)",
  },
  TPC: {
    name: "Pausa Curta",
    ring: "stroke-amber-600 dark:stroke-amber-400 text-amber-600 dark:text-amber-400",
    activeColor: "#f59e0b", // âmbar/amarelo
    ledColor: "bg-amber-500 text-amber-500",
    ledGlow: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    filterId: "glow-short-break",
    glowColor: "rgba(245, 158, 11, 0.45)",
  },
  TPL: {
    name: "Pausa Longa",
    ring: "stroke-rose-600 dark:stroke-rose-400 text-rose-600 dark:text-rose-400",
    activeColor: "#f43f5e", // rosa/vermelho
    ledColor: "bg-rose-500 text-rose-500",
    ledGlow: "bg-rose-400",
    text: "text-rose-600 dark:text-rose-400",
    filterId: "glow-long-break",
    glowColor: "rgba(244, 63, 94, 0.45)",
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
  hasNoPresets = false,
}: CircularTimerProps) {
  const { timerStyle } = useTimerStyle();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetClick = () => {
    setIsResetting(true);
    onReset?.();
  };
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.TF;
  const isRunning = !hasNoPresets && phase === "running";
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clampedProgress);

  // Quantidade de marcadores ativos preenchidos
  const activeTicksCount = hasNoPresets ? 0 : Math.round(clampedProgress * TOTAL_TICKS);

  // Marcadores radiais distribuídos igualmente ao redor do centro (120, 120)
  const ticks = useMemo(() => {
    return Array.from({ length: TOTAL_TICKS }).map((_, index) => {
      const angle = (index * 360) / TOTAL_TICKS;
      return { index, angle };
    });
  }, []);

  return (
    <div
      role="timer"
      aria-label={`${cfg.name}: ${Math.floor(remainingSeconds / 60)} minutos e ${
        remainingSeconds % 60
      } segundos restantes. ${completedCycles} ciclos concluídos.`}
      className="relative mx-auto w-full max-w-[208px] sm:max-w-none sm:size-72 md:size-80 lg:size-88 aspect-square shrink-0"
    >
      {/* 1. ESTILO ANEL: Anel clássico contínuo */}
      {timerStyle === "ring" && (
        <svg
          key="style-ring"
          viewBox="0 0 240 240"
          className="size-full -rotate-90 animate-timer-style-appear"
        >
          <defs>
            <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5"
                floodColor={cfg.glowColor}
              />
            </filter>
          </defs>

          {/* Circunferência base inativa */}
          <circle
            cx="120"
            cy="120"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="stroke-neutral-200 dark:stroke-neutral-800"
          />
          {/* Linha de progresso proporcional */}
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
            filter="url(#ring-glow)"
            style={{
              opacity: !hasNoPresets && clampedProgress > 0 ? 1 : 0,
            }}
            className={`${cfg.ring} transition-[stroke-dashoffset,opacity] ${
              isRunning ? "duration-1000 ease-linear" : "duration-300 ease-out"
            }`}
          />
        </svg>
      )}

      {/* 2. ESTILO MARCADORES: Cada tracinho individual preenche com a cor da fase (verde/amarelo/vermelho), mantendo exatamente o mesmo tamanho e glow vibrante */}
      {timerStyle === "ticks" && (
        <svg
          key="style-ticks"
          viewBox="0 0 240 240"
          className="size-full animate-timer-style-appear"
        >
          <g>
            {ticks.map(({ index, angle }) => {
              const isActive = index < activeTicksCount;
              return (
                <line
                  key={index}
                  x1="120"
                  y1="14"
                  x2="120"
                  y2="26"
                  transform={`rotate(${angle} 120 120)`}
                  stroke={isActive ? cfg.activeColor : "currentColor"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={
                    isActive
                      ? {
                          filter: `drop-shadow(0 0 5px ${cfg.glowColor})`,
                        }
                      : undefined
                  }
                  className={
                    isActive
                      ? "transition-colors duration-200"
                      : "text-neutral-400 dark:text-neutral-600 transition-colors duration-200"
                  }
                />
              );
            })}
          </g>
        </svg>
      )}

      {/* 3. ESTILO APENAS NÚMEROS: Sem anel/tracinhos */}
      {timerStyle === "minimal" && (
        <div
          key="style-minimal"
          className="size-full rounded-full border border-dashed border-border/40 bg-muted/5 flex items-center justify-center animate-timer-style-appear"
        />
      )}

      {/* Conteúdo Central Compartilhado */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
        {/* Top: Modelo Flutuante Minimalista (Sem caixa ou pílula, foco na respiração do mostrador) */}
        <div className="h-8 sm:h-9 flex items-center justify-center pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full transition-all">
            {/* Ponto de acento orgânico com brilho sutil */}
            <span className="relative flex size-2 items-center justify-center">
              {isRunning && (
                <span
                  className={`absolute size-2.5 rounded-full ${cfg.ledGlow} opacity-60 animate-ping`}
                />
              )}
              <span
                className={`size-2 rounded-full ${
                  hasNoPresets
                    ? "bg-neutral-400 dark:bg-neutral-600"
                    : `${cfg.ledColor} shadow-[0_0_8px_currentColor]`
                } transition-colors`}
              />
            </span>

            {/* Nome da fase elegante e nítido */}
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-foreground/90 select-none">
              {hasNoPresets ? "Sem preset" : cfg.name}
            </span>

            <span className="sr-only">
              {hasNoPresets ? "sem preset" : isRunning ? "em andamento" : phase === "paused" ? "pausado" : "parado"}
            </span>
          </div>
        </div>

        {/* Center: Tempo (ancorado perfeitamente no centro do círculo) */}
        <p
          aria-hidden
          className={`tabular-nums tracking-tight font-sans font-bold leading-none my-1 sm:my-2 ${
            timerStyle === "minimal"
              ? "text-5xl sm:text-7xl md:text-8xl"
              : "text-4xl sm:text-6xl md:text-7xl"
          }`}
        >
          {formattedTime}
        </p>

        {/* Bottom: Botão Zerar com mesma altura reservada para manter o centro perfeito */}
        <div className="h-8 sm:h-9 flex items-center justify-center pointer-events-auto">
          {!hasNoPresets && onReset ? (
            <button
              type="button"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full size-7 sm:size-auto sm:px-2.5 sm:py-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 active:scale-95"
              onClick={handleResetClick}
              aria-label="Reiniciar tempo da fase atual"
              title="Zerar Fase"
            >
              <RotateCcw
                onAnimationEnd={() => setIsResetting(false)}
                className={`size-3.5 sm:size-4 shrink-0 ${
                  isResetting ? "animate-spin-once-smooth" : ""
                }`}
              />
              <span className="hidden sm:inline">Zerar</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
