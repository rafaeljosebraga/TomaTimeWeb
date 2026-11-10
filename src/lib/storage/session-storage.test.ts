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

  it("deve avançar sequencialmente para a fase vigente caso o tempo tenha expirado enquanto a página esteve fechada (RN-07)", () => {
    const initialTimer = createSessionTimer(mockPreset);
    const runningTimer = startSessionTimer(initialTimer, BASE_NOW);
    saveSessionTimer(runningTimer);

    // Simula reabrir a página 28 minutos depois (o foco de 25 min já acabou; a pausa curta de 5 min vai de 25m a 30m)
    // Portanto, aos 28 min, o temporizador deve estar rodando na Pausa Curta (TPC) com 2 minutos restantes (120.000 ms)
    const twentyEightMinutesLater = BASE_NOW + 28 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, twentyEightMinutesLater);

    expect(restored.phase).toBe("running");
    expect(restored.stage).toBe("TPC");
    expect(restored.completedCycles).toBe(1);
    expect(restored.remainingMs).toBe(2 * 60 * 1000); // 2 minutos restantes na TPC
    expect(restored.endsAt).toBe(BASE_NOW + 30 * 60 * 1000);
  });

  it("deve avançar para TPL em andamento caso o ciclo expirado atinja a meta de ciclos (RN-07)", () => {
    // Timer no 4º ciclo de foco prestes a terminar aos 25 minutos
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

    // Reabre 26 minutos depois (1 minuto dentro da Pausa Longa de 15 min, que vai de 25m a 40m)
    const afterEnd = BASE_NOW + 26 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, afterEnd);

    // Como atingiu a meta de ciclos (4 % 4 === 0), deve estar na pausa longa (TPL) com 14 min restantes
    expect(restored.phase).toBe("running");
    expect(restored.stage).toBe("TPL");
    expect(restored.completedCycles).toBe(4);
    expect(restored.remainingMs).toBe(14 * 60 * 1000); // 14 minutos restantes
    expect(restored.endsAt).toBe(BASE_NOW + 40 * 60 * 1000);
  });

  it("deve encerrar a sessão com status concluído caso todas as fases previstas tenham vencido (RN-08)", () => {
    // Timer no 4º ciclo de foco
    const almostDoneTimer: SessionTimer = {
      preset: mockPreset,
      stage: "TF",
      phase: "running",
      completedCycles: 3,
      startedAt: BASE_NOW,
      endsAt: BASE_NOW + 25 * 60 * 1000,
      durationMs: 25 * 60 * 1000,
      remainingMs: 25 * 60 * 1000,
    };
    saveSessionTimer(almostDoneTimer);

    // Reabre 50 minutos depois (a pausa longa acabou aos 40 minutos)
    const longAfterEnd = BASE_NOW + 50 * 60 * 1000;
    const restored = loadSessionTimer(mockPreset, longAfterEnd);

    // Conforme RN-08: todas as fases previstas venceram -> status concluído
    expect(restored.phase).toBe("completed");
    expect(restored.stage).toBe("TPL");
    expect(restored.completedCycles).toBe(4);
    expect(restored.remainingMs).toBe(0);
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

  describe("Snapshot isolado do Preset na Sessão Ativa", () => {
    it("deve manter o snapshot intacto mesmo se o preset original for editado", () => {
      // Inicia e salva a sessão com o preset original (25 minutos)
      const session = startSessionTimer(createSessionTimer(mockPreset), BASE_NOW);
      saveSessionTimer(session);

      // Simula edição do preset no gerenciador de presets (ex: tempo alterado para 50 min)
      const editedPreset: TimerPreset = {
        ...mockPreset,
        name: "Preset Modificado",
        focusMinutes: 50,
      };

      // Recarrega a sessão passando o preset editado
      const restored = loadSessionTimer(editedPreset, BASE_NOW + 1000);

      // O preset da sessão ativa NÃO deve sofrer efeito colateral
      expect(restored.preset.name).toBe("Preset 25/5");
      expect(restored.preset.focusMinutes).toBe(25);
      expect(restored.durationMs).toBe(25 * 60 * 1000);
    });

    it("deve manter o snapshot intacto mesmo se o preset original for excluído", () => {
      // Inicia e salva a sessão com o preset que será deletado
      const session = startSessionTimer(createSessionTimer(mockPreset), BASE_NOW);
      saveSessionTimer(session);

      // Simula exclusão do preset, onde o fallback ativo passa a ser outro preset
      const fallbackPreset: TimerPreset = {
        id: "preset-fallback",
        name: "Preset Fallback",
        focusMinutes: 10,
        shortBreakMinutes: 2,
        cyclesBeforeLongBreak: 2,
        longBreakMinutes: 5,
      };

      const restored = loadSessionTimer(fallbackPreset, BASE_NOW + 1000);

      // A sessão continua com seu snapshot original isolado
      expect(restored.preset.id).toBe(mockPreset.id);
      expect(restored.preset.name).toBe("Preset 25/5");
      expect(restored.durationMs).toBe(25 * 60 * 1000);
    });
  });
});
