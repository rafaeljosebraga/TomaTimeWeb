import { describe, expect, it } from "vitest";
import {
  createSessionTimer,
  endSessionTimer,
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

  it("deve inicializar com o preset carregado como snapshot, estágio 'TF' e timestamps nulos", () => {
    const timer = createSessionTimer(preset);

    expect(timer.preset).toEqual(preset);
    expect(timer.preset).not.toBe(preset); // Snapshot isolado (não compartilha a mesma referência de memória)
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
    it("deve avançar manualmente de TF para TPC e NÃO deve incrementar completedCycles", () => {
      const timer = startSessionTimer(createSessionTimer(preset), BASE_TIMESTAMP);
      expect(timer.stage).toBe("TF");
      expect(timer.completedCycles).toBe(0);

      const skipped = skipSessionStage(timer);

      expect(skipped.stage).toBe("TPC");
      expect(skipped.phase).toBe("idle");
      expect(skipped.completedCycles).toBe(0); // pular foco não incrementa contagem de ciclos
      expect(skipped.durationMs).toBe(5 * 60 * 1000);
      expect(skipped.remainingMs).toBe(5 * 60 * 1000);
      expect(skipped.startedAt).toBeNull();
      expect(skipped.endsAt).toBeNull();
    });

    it("ao pular fase de foco inicial com meta 4, deve manter a mensagem 'Faltam 4 ciclos de foco para a próxima Pausa Longa.'", () => {
      // Inicia timer clássico com meta de 4 ciclos antes da pausa longa
      const initialTimer = createSessionTimer(preset);
      expect(initialTimer.completedCycles).toBe(0);
      expect(getLongBreakStatusMessage(initialTimer)).toBe(
        "Faltam 4 ciclos de foco para a próxima Pausa Longa.",
      );

      // Pula a fase de foco
      const skippedTimer = skipSessionStage(initialTimer);

      // Estágio avançou para pausa curta (TPC)
      expect(skippedTimer.stage).toBe("TPC");
      // Contagem de ciclos NÃO pode ser incrementada (permanece 0)
      expect(skippedTimer.completedCycles).toBe(0);
      // Portanto, a mensagem para a próxima pausa longa continua sendo 4 ciclos
      expect(getLongBreakStatusMessage(skippedTimer)).toBe(
        "Faltam 4 ciclos de foco para a próxima Pausa Longa.",
      );
    });

    it("deve avançar manualmente de TPC para TF e NÃO deve incrementar completedCycles", () => {
      const shortBreakTimer = {
        ...createSessionTimer(preset),
        stage: "TPC" as const,
        completedCycles: 1,
      };

      const skipped = skipSessionStage(shortBreakTimer);

      expect(skipped.stage).toBe("TF");
      expect(skipped.durationMs).toBe(25 * 60 * 1000);
      expect(skipped.remainingMs).toBe(25 * 60 * 1000);
      expect(skipped.completedCycles).toBe(1); // pular pausa não incrementa contagem de ciclos
    });

    it("deve avançar manualmente de TPL para TF preservando a contagem de ciclos", () => {
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

  describe("endSessionTimer (Encerrar sessão ativa a qualquer momento)", () => {
    it("deve finalizar uma sessão em andamento (running) e retornar ao estado inicial", () => {
      const runningTimer = startSessionTimer(createSessionTimer(preset), BASE_TIMESTAMP);
      expect(runningTimer.phase).toBe("running");
      expect(runningTimer.startedAt).not.toBeNull();
      expect(runningTimer.endsAt).not.toBeNull();

      const ended = endSessionTimer(runningTimer);

      expect(ended.phase).toBe("idle");
      expect(ended.stage).toBe("TF");
      expect(ended.completedCycles).toBe(0);
      expect(ended.startedAt).toBeNull();
      expect(ended.endsAt).toBeNull();
      expect(ended.durationMs).toBe(25 * 60 * 1000);
      expect(ended.remainingMs).toBe(25 * 60 * 1000);
    });

    it("deve finalizar uma sessão que esteja em pausa (TPC ou TPL) com ciclos concluídos", () => {
      const breakTimer = {
        ...createSessionTimer(preset),
        stage: "TPL" as const,
        phase: "paused" as const,
        completedCycles: 4,
        remainingMs: 10 * 1000,
      };

      const ended = endSessionTimer(breakTimer);

      expect(ended.phase).toBe("idle");
      expect(ended.stage).toBe("TF");
      expect(ended.completedCycles).toBe(0);
      expect(ended.durationMs).toBe(25 * 60 * 1000);
      expect(ended.remainingMs).toBe(25 * 60 * 1000);
    });

    it("deve ser idempotente quando chamado em uma sessão já idle", () => {
      const idleTimer = createSessionTimer(preset);
      const ended = endSessionTimer(idleTimer);

      expect(ended).toEqual(idleTimer);
    });

    it("deve sincronizar com o preset atualizado (espelho do storage) ao encerrar a sessão", () => {
      const runningTimer = startSessionTimer(createSessionTimer(preset), BASE_TIMESTAMP);

      const updatedMirrorPreset: TimerPreset = {
        ...preset,
        name: "Preset Atualizado 40/10",
        focusMinutes: 40,
        shortBreakMinutes: 10,
      };

      const ended = endSessionTimer(runningTimer, updatedMirrorPreset);

      expect(ended.phase).toBe("idle");
      expect(ended.stage).toBe("TF");
      expect(ended.preset.name).toBe("Preset Atualizado 40/10");
      expect(ended.preset.focusMinutes).toBe(40);
      expect(ended.durationMs).toBe(40 * 60 * 1000);
      expect(ended.remainingMs).toBe(40 * 60 * 1000);
    });
  });
});
