// src/lib/storage/session-storage.ts
// Persistência e restauração do temporizador da sessão no localStorage.
// Imune a fechamento de aba, reinicialização de navegador e throttling.
import type { SessionTimer, TimerPreset } from "@/types/domain";
import {
  createSessionTimer,
  getStageDurationMs,
  tickSessionTimer,
} from "@/lib/domain/session-timer";

export const SESSION_STORAGE_KEY = "tomatimer:session" as const;

function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveSessionTimer(timer: SessionTimer): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(timer));
    }
  } catch {
    // Falha silenciosa de escrita (ex.: quota cheia ou modo privado restrito)
  }
}

export function clearSessionTimer(): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Falha silenciosa
  }
}

function isValidStoredSession(value: unknown): value is SessionTimer {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  const validStages = ["TF", "TPC", "TPL"];
  const validPhases = ["idle", "running", "paused", "completed"];

  return (
    typeof candidate.preset === "object" &&
    candidate.preset !== null &&
    typeof candidate.stage === "string" &&
    validStages.includes(candidate.stage) &&
    typeof candidate.phase === "string" &&
    validPhases.includes(candidate.phase) &&
    typeof candidate.completedCycles === "number" &&
    typeof candidate.durationMs === "number" &&
    typeof candidate.remainingMs === "number" &&
    (candidate.startedAt === null || typeof candidate.startedAt === "number") &&
    (candidate.endsAt === null || typeof candidate.endsAt === "number")
  );
}

export function loadSessionTimer(
  activePreset: TimerPreset,
  now: number = Date.now(),
): SessionTimer {
  try {
    if (!isBrowserStorageAvailable()) {
      return createSessionTimer(activePreset);
    }

    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return createSessionTimer(activePreset);
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredSession(parsed)) {
      clearSessionTimer();
      return createSessionTimer(activePreset);
    }

    // Garante que o timer use os dados mais recentes do preset ativo
    const effectivePreset =
      parsed.preset.id === activePreset.id ? activePreset : parsed.preset;

    // Recalcula a duração do estágio atual com o preset mais recente
    const currentDurationMs = getStageDurationMs(
      effectivePreset,
      parsed.stage,
    );

    const baseRestoredTimer: SessionTimer = {
      ...parsed,
      preset: effectivePreset,
      durationMs: currentDurationMs,
    };

    // Caso 1: O timer estava pausado, idle ou já concluído
    if (baseRestoredTimer.phase !== "running" || baseRestoredTimer.endsAt === null) {
      return baseRestoredTimer;
    }

    // Caso 2: O timer estava rodando e o tempo ainda NÃO expirou
    if (now < baseRestoredTimer.endsAt) {
      return {
        ...baseRestoredTimer,
        remainingMs: baseRestoredTimer.endsAt - now,
      };
    }

    // Caso 3: O tempo expirou enquanto a página esteve fechada ou recarregando
    // Avança o temporizador computando a transição de ciclo automaticamente
    const transitionedTimer = tickSessionTimer(baseRestoredTimer, now);
    saveSessionTimer(transitionedTimer);
    return transitionedTimer;
  } catch {
    clearSessionTimer();
    return createSessionTimer(activePreset);
  }
}
