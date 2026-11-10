// src/lib/storage/session-storage.ts
// Persistência e restauração do temporizador da sessão no localStorage.
// Imune a fechamento de aba, reinicialização de navegador e throttling.
import type { SessionTimer, TimerPreset } from "@/types/domain";
import {
  createSessionTimer,
  getStageDurationMs,
  recalculateSessionOnResume,
} from "@/lib/domain/session-timer";

export const SESSION_STORAGE_KEY = "pomodoro.sessaoAtiva" as const;
export const LEGACY_SESSION_STORAGE_KEY = "tomatimer:session" as const;

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
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    }
  } catch {
    // Falha silenciosa
  }
}

/**
 * Verifica se existe uma sessão ativa salva em localStorage antes de ser carregada
 */
export function hasStoredActiveSession(): boolean {
  try {
    if (!isBrowserStorageAvailable()) return false;
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!raw) return false;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredSession(parsed)) return false;

    return parsed.phase === "running" || parsed.phase === "paused";
  } catch {
    return false;
  }
}

/**
 * Retorna o ID do preset atualmente em uso por uma sessão ativa
 * Regra RN-01 (bloqueio de edição/exclusão)
 */
export function getActiveSessionPresetId(): string | null {
  try {
    if (!isBrowserStorageAvailable()) return null;
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredSession(parsed)) return null;

    // Sessão ativa: em andamento ou pausada (RN-01)
    if (parsed.phase === "running" || parsed.phase === "paused") {
      return parsed.preset.id;
    }

    return null;
  } catch {
    return null;
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

    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!raw) {
      return createSessionTimer(activePreset);
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredSession(parsed)) {
      clearSessionTimer();
      return createSessionTimer(activePreset);
    }

    // O preset da sessão é um snapshot imutável isolado da sessão ativa.
    // Ele não se altera mesmo se o preset original for editado ou excluído da lista de presets.
    const snapshotPreset: TimerPreset = { ...parsed.preset };
    const currentDurationMs = getStageDurationMs(
      snapshotPreset,
      parsed.stage,
    );

    const baseRestoredTimer: SessionTimer = {
      ...parsed,
      preset: snapshotPreset,
      durationMs: currentDurationMs,
    };

    // UC10: Recalcula a sessão com base em timestamps e avanço sequencial (RN-06, RN-07, RN-08)
    const recalculatedTimer = recalculateSessionOnResume(baseRestoredTimer, now);
    saveSessionTimer(recalculatedTimer);
    return recalculatedTimer;
  } catch {
    clearSessionTimer();
    return createSessionTimer(activePreset);
  }
}
