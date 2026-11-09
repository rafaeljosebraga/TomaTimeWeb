// src/lib/domain/decoupling.test.ts
// Testes automatizados de desacoplamento estrito entre Tarefas e Temporizador da Sessão.
import { beforeEach, describe, expect, it } from "vitest";
import type { TimerPreset } from "@/types/domain";
import {
  createSessionTimer,
  endSessionTimer,
  pauseSessionTimer,
  resumeSessionTimer,
  skipSessionStage,
  startSessionTimer,
  tickSessionTimer,
} from "./session-timer";
import {
  clearSessionTimer,
  loadSessionTimer,
  saveSessionTimer,
  SESSION_STORAGE_KEY,
} from "@/lib/storage/session-storage";
import {
  clearTasks,
  createTask,
  deleteTask,
  loadTasks,
  TASK_STORAGE_KEYS,
  updateTask,
} from "@/lib/storage/tasks-storage";

describe("Desacoplamento entre Tarefas e Temporizador de Sessão", () => {
  const preset: TimerPreset = {
    id: "preset-decoupling",
    name: "Preset Teste Desacoplamento",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("mutações em tarefas (criar, atualizar, deletar, limpar) não alteram o estado da sessão", () => {
    // 1. Inicializa e salva uma sessão em andamento
    const initialTimer = startSessionTimer(
      createSessionTimer(preset),
      1700000000000,
    );
    saveSessionTimer(initialTimer);

    const savedSessionRawBefore = localStorage.getItem(SESSION_STORAGE_KEY);
    expect(savedSessionRawBefore).not.toBeNull();

    // 2. Executa operações completas de tarefas
    const created = createTask({
      title: "Tarefa Isolada",
      state: "a fazer",
      priority: "alta",
    });
    expect(created.isValid).toBe(true);

    if (created.isValid) {
      updateTask(created.data.id, {
        state: "em execução",
        priority: "baixa",
      });

      deleteTask(created.data.id);
    }

    clearTasks();

    // 3. Garante que a sessão permanece 100% inalterada no storage
    const savedSessionRawAfter = localStorage.getItem(SESSION_STORAGE_KEY);
    expect(savedSessionRawAfter).toBe(savedSessionRawBefore);

    const reloadedTimer = loadSessionTimer(preset, 1700000000000);
    expect(reloadedTimer.phase).toBe(initialTimer.phase);
    expect(reloadedTimer.stage).toBe(initialTimer.stage);
    expect(reloadedTimer.endsAt).toBe(initialTimer.endsAt);
    expect(reloadedTimer.remainingMs).toBe(initialTimer.remainingMs);
  });

  it("operações no temporizador (iniciar, pausar, pular, encerrar, tick) não afetam as tarefas salvas", () => {
    // 1. Cria e persiste tarefas no storage
    const t1 = createTask({ title: "Tarefa Fixa 1", state: "a fazer", priority: "alta" });
    const t2 = createTask({ title: "Tarefa Fixa 2", state: "backlog", priority: "média" });

    expect(t1.isValid).toBe(true);
    expect(t2.isValid).toBe(true);

    const tasksRawBefore = localStorage.getItem(TASK_STORAGE_KEYS.TASKS);
    expect(tasksRawBefore).not.toBeNull();

    // 2. Executa diversas transições de temporizador de sessão
    let timer = createSessionTimer(preset);
    saveSessionTimer(timer);

    timer = startSessionTimer(timer, 1700000000000);
    saveSessionTimer(timer);

    timer = tickSessionTimer(timer, 1700000005000);
    saveSessionTimer(timer);

    timer = pauseSessionTimer(timer, 1700000006000);
    saveSessionTimer(timer);

    timer = resumeSessionTimer(timer, 1700000007000);
    saveSessionTimer(timer);

    timer = skipSessionStage(timer);
    saveSessionTimer(timer);

    timer = endSessionTimer(timer);
    saveSessionTimer(timer);

    clearSessionTimer();

    // 3. Garante que as tarefas continuam intactas
    const loadedTasks = loadTasks();
    expect(loadedTasks).toHaveLength(2);
    expect(loadedTasks.map((t) => t.title)).toContain("Tarefa Fixa 1");
    expect(loadedTasks.map((t) => t.title)).toContain("Tarefa Fixa 2");

    const tasksRawAfter = localStorage.getItem(TASK_STORAGE_KEYS.TASKS);
    expect(tasksRawAfter).toBe(tasksRawBefore);
  });
});
