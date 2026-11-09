import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_STORAGE_KEY,
  clearSessionTimer,
  loadSessionTimer,
  saveSessionTimer,
} from "./session-storage";
import {
  createSessionTimer,
  startSessionTimer,
  pauseSessionTimer,
} from "@/lib/domain/session-timer";
import type { SessionTimer, TimerPreset } from "@/types/domain";

describe("session-storage (Persistência do Temporizador da Sessão no localStorage)", () => {
  const mockPreset: TimerPreset = {
    id: "preset-mock-1",
    name: "Preset 25/5",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  };

  const BASE_NOW = 1700000000000;

  beforeEach(() => {
    localStorage.clear();
  });

  it("deve inicializar com um novo timer quando o storage estiver vazio", () => {
    const timer = loadSessionTimer(mockPreset, BASE_NOW);

    expect(timer.preset.id).toBe(mockPreset.id);
    expect(timer.stage).toBe("TF");
    expect(timer.phase).toBe("idle");
    expect(timer.remainingMs).toBe(25 * 60 * 1000);
    expect(timer.startedAt).toBeNull();
    expect(timer.endsAt).toBeNull();
  });

  it("deve recuperar com novo timer se o JSON salvo estiver corrompido", () => {
    localStorage.setItem(SESSION_STORAGE_KEY, "json_invalido{[[");
    const timer = loadSessionTimer(mockPreset, BASE_NOW);

    expect(timer.phase).toBe("idle");
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("deve restaurar o timer em andamento recalculando o remainingMs se now < endsAt", () => {
    // Inicia o timer com 25 minutos (1.500.000 ms)
    const initialTimer = createSessionTimer(mockPreset);
    const runningTimer = startSessionTimer(initialTimer, BASE_NOW);
    saveSessionTimer(runningTimer);

    // Simula recarregamento da página (F5) 5 minutos depois (300.000 ms depois)
    const fiveMinutesLater = BASE_NOW + 5 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, fiveMinutesLater);

    expect(restored.phase).toBe("running");
    expect(restored.stage).toBe("TF");
    expect(restored.endsAt).toBe(runningTimer.endsAt);
    // Deve restar exatamente 20 minutos (1.200.000 ms)
    expect(restored.remainingMs).toBe(20 * 60 * 1000);
  });

  it("deve transicionar para completed caso o timer tenha expirado enquanto a página esteve fechada (now >= endsAt)", () => {
    const initialTimer = createSessionTimer(mockPreset);
    const runningTimer = startSessionTimer(initialTimer, BASE_NOW);
    saveSessionTimer(runningTimer);

    // Simula reabrir a página 30 minutos depois (o foco de 25 min já acabou)
    const thirtyMinutesLater = BASE_NOW + 30 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, thirtyMinutesLater);

    // Deve detectar a conclusão do ciclo de foco e transicionar para a pausa curta (TPC)
    expect(restored.phase).toBe("completed");
    expect(restored.stage).toBe("TPC");
    expect(restored.completedCycles).toBe(1);
    expect(restored.remainingMs).toBe(5 * 60 * 1000); // tempo configurado para pausa curta
    expect(restored.endsAt).toBeNull();
  });

  it("deve transicionar para TPL caso o ciclo expirado enquanto fechado atinja a meta de ciclos", () => {
    // Timer no 4º ciclo de foco prestes a terminar
    const almostDoneTimer: SessionTimer = {
      preset: mockPreset,
      stage: "TF",
      phase: "running",
      completedCycles: 3, // já completou 3
      startedAt: BASE_NOW,
      endsAt: BASE_NOW + 25 * 60 * 1000,
      durationMs: 25 * 60 * 1000,
      remainingMs: 25 * 60 * 1000,
    };
    saveSessionTimer(almostDoneTimer);

    // Reabre após o término
    const afterEnd = BASE_NOW + 26 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, afterEnd);

    // Como é o 4º ciclo de foco (4 % 4 === 0), deve transicionar para pausa longa (TPL)
    expect(restored.phase).toBe("completed");
    expect(restored.stage).toBe("TPL");
    expect(restored.completedCycles).toBe(4);
    expect(restored.remainingMs).toBe(15 * 60 * 1000); // 15 minutos de pausa longa
  });

  it("deve restaurar o timer pausado preservando os milissegundos restantes", () => {
    const initialTimer = createSessionTimer(mockPreset);
    const runningTimer = startSessionTimer(initialTimer, BASE_NOW);

    // Pausa após 10 minutos decorridos (restando 15 min = 900.000 ms)
    const tenMinutesLater = BASE_NOW + 10 * 60 * 1000;
    const pausedTimer = pauseSessionTimer(runningTimer, tenMinutesLater);
    saveSessionTimer(pausedTimer);

    // Simula recarregamento da página horas depois
    const twoHoursLater = tenMinutesLater + 2 * 60 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, twoHoursLater);

    expect(restored.phase).toBe("paused");
    expect(restored.endsAt).toBeNull();
    expect(restored.remainingMs).toBe(15 * 60 * 1000);
  });

  it("deve limpar o timer salvo com clearSessionTimer", () => {
    const timer = createSessionTimer(mockPreset);
    saveSessionTimer(timer);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();

    clearSessionTimer();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
