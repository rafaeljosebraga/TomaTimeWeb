// src/lib/domain/session-timer.ts
// Lógica pura de máquina de estados para o Temporizador da Sessão baseada em timestamps.
import type { SessionStage, SessionTimer, TimerPreset } from "@/types/domain";

export function getStageDurationMs(
  preset: TimerPreset,
  stage: SessionStage,
): number {
  switch (stage) {
    case "TF":
      return preset.focusMinutes * 60 * 1000;
    case "TPC":
      return preset.shortBreakMinutes * 60 * 1000;
    case "TPL":
      return preset.longBreakMinutes * 60 * 1000;
  }
}

export function createSessionTimer(preset: TimerPreset): SessionTimer {
  const durationMs = getStageDurationMs(preset, "TF");

  return {
    preset,
    stage: "TF",
    phase: "idle",
    completedCycles: 0,
    startedAt: null,
    endsAt: null,
    durationMs,
    remainingMs: durationMs,
  };
}

export function startSessionTimer(
  timer: SessionTimer,
  now: number = Date.now(),
): SessionTimer {
  if (timer.phase === "running") return timer;

  const endsAt = now + timer.remainingMs;

  return {
    ...timer,
    phase: "running",
    startedAt: now,
    endsAt,
  };
}

export function pauseSessionTimer(
  timer: SessionTimer,
  now: number = Date.now(),
): SessionTimer {
  if (timer.phase !== "running" || timer.endsAt === null) return timer;

  const remainingMs = Math.max(0, timer.endsAt - now);

  return {
    ...timer,
    phase: "paused",
    endsAt: null,
    remainingMs,
  };
}

export function resumeSessionTimer(
  timer: SessionTimer,
  now: number = Date.now(),
): SessionTimer {
  if (timer.phase !== "paused") return timer;

  const endsAt = now + timer.remainingMs;

  return {
    ...timer,
    phase: "running",
    startedAt: now,
    endsAt,
  };
}

export function resetSessionTimer(timer: SessionTimer): SessionTimer {
  const durationMs = getStageDurationMs(timer.preset, timer.stage);

  return {
    ...timer,
    phase: "idle",
    startedAt: null,
    endsAt: null,
    durationMs,
    remainingMs: durationMs,
  };
}

export function resetCompletedCycles(timer: SessionTimer): SessionTimer {
  return {
    ...timer,
    completedCycles: 0,
  };
}

// Retorna quantos ciclos de foco faltam para atingir a próxima Pausa Longa
export function getCyclesUntilNextLongBreak(
  completedCycles: number,
  cyclesBeforeLongBreak: number,
): number {
  const remainder = completedCycles % cyclesBeforeLongBreak;
  return remainder === 0 ? cyclesBeforeLongBreak : cyclesBeforeLongBreak - remainder;
}

// Retorna uma mensagem clara e contextual sobre a próxima Pausa Longa
export function getLongBreakStatusMessage(timer: SessionTimer): string {
  if (timer.stage === "TPL") {
    return "Você está na Pausa Longa agora.";
  }

  const cyclesRemaining = getCyclesUntilNextLongBreak(
    timer.completedCycles,
    timer.preset.cyclesBeforeLongBreak,
  );

  if (cyclesRemaining === 1) {
    if (timer.stage === "TF") {
      return "Falta 1 ciclo de foco (ao concluir este foco, o descanso será a Pausa Longa!).";
    }
    return "Falta 1 ciclo de foco para a próxima Pausa Longa.";
  }

  return `Faltam ${cyclesRemaining} ciclos de foco para a próxima Pausa Longa.`;
}

// Avança manualmente da fase atual para a próxima fase prevista do fluxo
export function skipSessionStage(timer: SessionTimer): SessionTimer {
  if (timer.stage === "TF") {
    const nextCompletedCycles = timer.completedCycles + 1;
    const isLongBreak =
      nextCompletedCycles % timer.preset.cyclesBeforeLongBreak === 0;
    const nextStage: SessionStage = isLongBreak ? "TPL" : "TPC";
    const nextDurationMs = getStageDurationMs(timer.preset, nextStage);

    return {
      ...timer,
      stage: nextStage,
      phase: "idle",
      completedCycles: nextCompletedCycles,
      startedAt: null,
      endsAt: null,
      durationMs: nextDurationMs,
      remainingMs: nextDurationMs,
    };
  }

  // Se estava em TPC ou TPL, a próxima fase prevista é sempre TF (Tempo de Foco)
  const focusDurationMs = getStageDurationMs(timer.preset, "TF");

  return {
    ...timer,
    stage: "TF",
    phase: "idle",
    startedAt: null,
    endsAt: null,
    durationMs: focusDurationMs,
    remainingMs: focusDurationMs,
  };
}

export function getRemainingSeconds(
  timer: SessionTimer,
  now: number = Date.now(),
): number {
  if (timer.phase === "running" && timer.endsAt !== null) {
    const diff = Math.max(0, timer.endsAt - now);
    return Math.ceil(diff / 1000);
  }

  return Math.ceil(timer.remainingMs / 1000);
}

export function tickSessionTimer(
  timer: SessionTimer,
  now: number = Date.now(),
): SessionTimer {
  if (timer.phase !== "running" || timer.endsAt === null) {
    return timer;
  }

  // Ainda há tempo restante no estágio atual
  if (now < timer.endsAt) {
    return {
      ...timer,
      remainingMs: timer.endsAt - now,
    };
  }

  // O tempo acabou com base no timestamp (now >= endsAt)
  if (timer.stage === "TF") {
    const nextCompletedCycles = timer.completedCycles + 1;
    const isLongBreak =
      nextCompletedCycles % timer.preset.cyclesBeforeLongBreak === 0;
    const nextStage: SessionStage = isLongBreak ? "TPL" : "TPC";
    const nextDurationMs = getStageDurationMs(timer.preset, nextStage);

    return {
      ...timer,
      stage: nextStage,
      phase: "completed",
      completedCycles: nextCompletedCycles,
      startedAt: null,
      endsAt: null,
      durationMs: nextDurationMs,
      remainingMs: nextDurationMs,
    };
  }

  // Transição de TPC ou TPL de volta para TF (Foco)
  const focusDurationMs = getStageDurationMs(timer.preset, "TF");

  return {
    ...timer,
    stage: "TF",
    phase: "completed",
    startedAt: null,
    endsAt: null,
    durationMs: focusDurationMs,
    remainingMs: focusDurationMs,
  };
}
