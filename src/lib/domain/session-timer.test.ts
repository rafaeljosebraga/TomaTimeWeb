import { describe, expect, it } from "vitest";
import {
  createSessionTimer,
  getCyclesUntilNextLongBreak,
  getLongBreakStatusMessage,
  getRemainingSeconds,
  pauseSessionTimer,
  resetCompletedCycles,
  resetSessionTimer,
  resumeSessionTimer,
  skipSessionStage,
  startSessionTimer,
  tickSessionTimer,
} from "./session-timer";
import type { TimerPreset } from "@/types/domain";

describe("Temporizador da Sessão baseado em Timestamp", () => {
  const preset: TimerPreset = {
    id: "preset-1",
    name: "Preset Teste",
    focusMinutes: 25, // TF = 1.500.000 ms (25 min)
    shortBreakMinutes: 5, // TPC = 300.000 ms (5 min)
    cyclesBeforeLongBreak: 4, // 4 ciclos de TF antes de TPL
    longBreakMinutes: 15, // TPL = 900.000 ms (15 min)
  };

  const BASE_TIMESTAMP = 1700000000000; // Timestamp fixo de referência em ms

  it("deve inicializar com o preset carregado, estágio 'TF' e timestamps nulos", () => {
    const timer = createSessionTimer(preset);

    expect(timer.preset).toBe(preset);
    expect(timer.stage).toBe("TF");
    expect(timer.phase).toBe("idle");
    expect(timer.startedAt).toBeNull();
    expect(timer.endsAt).toBeNull();
    expect(timer.durationMs).toBe(25 * 60 * 1000);
    expect(timer.remainingMs).toBe(25 * 60 * 1000);
    expect(getRemainingSeconds(timer)).toBe(1500);
  });

  it("deve calcular o timestamp de término 'endsAt' ao iniciar", () => {
    const timer = createSessionTimer(preset);
    const started = startSessionTimer(timer, BASE_TIMESTAMP);

    expect(started.phase).toBe("running");
    expect(started.startedAt).toBe(BASE_TIMESTAMP);
    expect(started.endsAt).toBe(BASE_TIMESTAMP + 25 * 60 * 1000);
    expect(getRemainingSeconds(started, BASE_TIMESTAMP)).toBe(1500);
  });

  it("deve calcular o tempo restante real com base na diferença de timestamps", () => {
    const timer = createSessionTimer(preset);
    const started = startSessionTimer(timer, BASE_TIMESTAMP);

    // Avança 30 segundos no tempo real
    const thirtySecondsLater = BASE_TIMESTAMP + 30 * 1000;
    expect(getRemainingSeconds(started, thirtySecondsLater)).toBe(1470);

    // Executa tick atualizando remainingMs
    const updated = tickSessionTimer(started, thirtySecondsLater);
    expect(updated.remainingMs).toBe(1470 * 1000);
  });

  it("deve congelar o tempo restante ao pausar e recalcular o endsAt ao retomar", () => {
    const timer = createSessionTimer(preset);
    const started = startSessionTimer(timer, BASE_TIMESTAMP);

    // Pausa após 10 minutos (600 segundos) decorridos
    const tenMinutesLater = BASE_TIMESTAMP + 10 * 60 * 1000;
    const paused = pauseSessionTimer(started, tenMinutesLater);

    expect(paused.phase).toBe("paused");
    expect(paused.endsAt).toBeNull();
    expect(paused.remainingMs).toBe(15 * 60 * 1000); // 15 minutos restantes
    expect(getRemainingSeconds(paused)).toBe(900);

    // Fica 1 hora pausado antes de retomar
    const oneHourLater = tenMinutesLater + 60 * 60 * 1000;
    const resumed = resumeSessionTimer(paused, oneHourLater);

    expect(resumed.phase).toBe("running");
    expect(resumed.startedAt).toBe(oneHourLater);
    expect(resumed.endsAt).toBe(oneHourLater + 15 * 60 * 1000); // novo término calculado
    expect(getRemainingSeconds(resumed, oneHourLater)).toBe(900);
  });

  it("deve transicionar de 'TF' para 'TPC' quando o timestamp atual atingir ou passar do endsAt", () => {
    const timer = createSessionTimer(preset);
    const started = startSessionTimer(timer, BASE_TIMESTAMP);

    // Timestamp atinge exatamente o momento de término (now >= endsAt)
    const completionTime = BASE_TIMESTAMP + 25 * 60 * 1000;
    const completed = tickSessionTimer(started, completionTime);

    expect(completed.phase).toBe("completed");
    expect(completed.stage).toBe("TPC");
    expect(completed.completedCycles).toBe(1);
    expect(completed.durationMs).toBe(5 * 60 * 1000);
    expect(completed.remainingMs).toBe(5 * 60 * 1000);
    expect(completed.startedAt).toBeNull();
    expect(completed.endsAt).toBeNull();
  });

  it("deve transicionar de 'TF' para 'TPL' após completar o número configurado de ciclos (4)", () => {
    const timer = {
      ...createSessionTimer(preset),
      completedCycles: 3, // já completou 3 ciclos
    };

    const started = startSessionTimer(timer, BASE_TIMESTAMP);
    const completionTime = BASE_TIMESTAMP + 25 * 60 * 1000;
    const completed = tickSessionTimer(started, completionTime);

    expect(completed.phase).toBe("completed");
    expect(completed.stage).toBe("TPL");
    expect(completed.completedCycles).toBe(4);
    expect(completed.durationMs).toBe(15 * 60 * 1000); // Pausa longa
    expect(completed.remainingMs).toBe(15 * 60 * 1000);
  });

  it("deve transicionar de 'TPC' ou 'TPL' de volta para 'TF' ao zerar a pausa", () => {
    // Fim da pausa curta
    const shortBreakTimer = {
      ...createSessionTimer(preset),
      stage: "TPC" as const,
      durationMs: 5 * 60 * 1000,
      remainingMs: 5 * 60 * 1000,
    };
    const startedShortBreak = startSessionTimer(shortBreakTimer, BASE_TIMESTAMP);
    const afterShortBreak = tickSessionTimer(
      startedShortBreak,
      BASE_TIMESTAMP + 5 * 60 * 1000,
    );

    expect(afterShortBreak.stage).toBe("TF");
    expect(afterShortBreak.durationMs).toBe(25 * 60 * 1000);
    expect(afterShortBreak.remainingMs).toBe(25 * 60 * 1000);

    // Fim da pausa longa
    const longBreakTimer = {
      ...createSessionTimer(preset),
      stage: "TPL" as const,
      durationMs: 15 * 60 * 1000,
      remainingMs: 15 * 60 * 1000,
    };
    const startedLongBreak = startSessionTimer(longBreakTimer, BASE_TIMESTAMP);
    const afterLongBreak = tickSessionTimer(
      startedLongBreak,
      BASE_TIMESTAMP + 15 * 60 * 1000,
    );

    expect(afterLongBreak.stage).toBe("TF");
    expect(afterLongBreak.durationMs).toBe(25 * 60 * 1000);
  });

  it("deve restaurar o tempo inicial completo ao reiniciar (reset)", () => {
    const timer = createSessionTimer(preset);
    const started = startSessionTimer(timer, BASE_TIMESTAMP);
    const reset = resetSessionTimer(started);

    expect(reset.phase).toBe("idle");
    expect(reset.startedAt).toBeNull();
    expect(reset.endsAt).toBeNull();
    expect(reset.remainingMs).toBe(25 * 60 * 1000);
  });

  it("deve zerar os ciclos concluídos com resetCompletedCycles", () => {
    const timer = {
      ...createSessionTimer(preset),
      completedCycles: 7,
    };

    const resetTimer = resetCompletedCycles(timer);
    expect(resetTimer.completedCycles).toBe(0);
    expect(resetTimer.stage).toBe("TF");
  });

  describe("skipSessionStage (Pular fase manualmente)", () => {
    it("deve avançar manualmente de TF para TPC e incrementar ciclo", () => {
      const timer = startSessionTimer(createSessionTimer(preset), BASE_TIMESTAMP);
      expect(timer.stage).toBe("TF");
      expect(timer.completedCycles).toBe(0);

      const skipped = skipSessionStage(timer);

      expect(skipped.stage).toBe("TPC");
      expect(skipped.phase).toBe("idle");
      expect(skipped.completedCycles).toBe(1);
      expect(skipped.durationMs).toBe(5 * 60 * 1000);
      expect(skipped.remainingMs).toBe(5 * 60 * 1000);
      expect(skipped.startedAt).toBeNull();
      expect(skipped.endsAt).toBeNull();
    });

    it("deve avançar manualmente de TF para TPL quando a meta de ciclos for atingida", () => {
      const timer: typeof preset extends unknown ? ReturnType<typeof createSessionTimer> : never = {
        ...createSessionTimer(preset),
        completedCycles: 3,
      };

      const skipped = skipSessionStage(timer);

      expect(skipped.stage).toBe("TPL");
      expect(skipped.completedCycles).toBe(4);
      expect(skipped.durationMs).toBe(15 * 60 * 1000);
      expect(skipped.remainingMs).toBe(15 * 60 * 1000);
    });

    it("deve avançar manualmente de TPC para TF", () => {
      const shortBreakTimer = {
        ...createSessionTimer(preset),
        stage: "TPC" as const,
        completedCycles: 1,
      };

      const skipped = skipSessionStage(shortBreakTimer);

      expect(skipped.stage).toBe("TF");
      expect(skipped.durationMs).toBe(25 * 60 * 1000);
      expect(skipped.remainingMs).toBe(25 * 60 * 1000);
      expect(skipped.completedCycles).toBe(1); // não incrementa em pausas
    });

    it("deve avançar manualmente de TPL para TF", () => {
      const longBreakTimer = {
        ...createSessionTimer(preset),
        stage: "TPL" as const,
        completedCycles: 4,
      };

      const skipped = skipSessionStage(longBreakTimer);

      expect(skipped.stage).toBe("TF");
      expect(skipped.durationMs).toBe(25 * 60 * 1000);
      expect(skipped.remainingMs).toBe(25 * 60 * 1000);
      expect(skipped.completedCycles).toBe(4);
    });
  });

  describe("Cálculo e Mensagem da Próxima Pausa Longa", () => {
    it("deve calcular corretamente os ciclos restantes após múltiplos de pausa longa (ex: 15 concluídos com meta 3)", () => {
      // 15 concluídos com meta 3: acabou de passar por uma pausa longa, faltam 3 para a próxima!
      expect(getCyclesUntilNextLongBreak(15, 3)).toBe(3);
      expect(getCyclesUntilNextLongBreak(0, 3)).toBe(3);
      expect(getCyclesUntilNextLongBreak(1, 3)).toBe(2);
      expect(getCyclesUntilNextLongBreak(2, 3)).toBe(1);
    });

    it("deve gerar a mensagem contextual correta para o usuário", () => {
      const timerWith3Meta = {
        ...createSessionTimer({ ...preset, cyclesBeforeLongBreak: 3 }),
        completedCycles: 15,
        stage: "TF" as const,
      };

      // Logo após a pausa longa no ciclo 15, faltam 3 ciclos
      expect(getLongBreakStatusMessage(timerWith3Meta)).toBe(
        "Faltam 3 ciclos de foco para a próxima Pausa Longa.",
      );

      // Faltando 1 ciclo de foco
      const timerWith1Remaining = {
        ...timerWith3Meta,
        completedCycles: 17, // 17 % 3 = 2 -> falta 1
      };
      expect(getLongBreakStatusMessage(timerWith1Remaining)).toBe(
        "Falta 1 ciclo de foco (ao concluir este foco, o descanso será a Pausa Longa!).",
      );

      // Quando já está na pausa longa
      const timerInLongBreak = {
        ...timerWith3Meta,
        stage: "TPL" as const,
      };
      expect(getLongBreakStatusMessage(timerInLongBreak)).toBe(
        "Você está na Pausa Longa agora.",
      );
    });
  });
});
