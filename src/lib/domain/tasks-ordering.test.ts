// src/lib/domain/tasks-ordering.test.ts
import { describe, expect, it } from "vitest";
import type { Task } from "@/types/domain";
import {
  sortTasks,
  STATE_SORT_WEIGHT_ALTERNATIVE,
  STATE_SORT_WEIGHT_DEFAULT,
} from "./tasks-ordering";

describe("Ordenação Determinística de Tarefas", () => {
  const createTaskMock = (
    id: string,
    priority: Task["priority"],
    state: Task["state"],
    createdAt: string = "2026-11-08T20:00:00.000Z",
  ): Task => ({
    id,
    title: `Tarefa ${id}`,
    priority,
    state,
    createdAt,
    updatedAt: createdAt,
  });

  it("deve ordenar primeiramente por prioridade decrescente (alta > média > baixa)", () => {
    const tLow = createTaskMock("1", "baixa", "a fazer");
    const tHigh = createTaskMock("2", "alta", "a fazer");
    const tMed = createTaskMock("3", "média", "a fazer");

    const result = sortTasks([tLow, tHigh, tMed]);

    expect(result.map((t) => t.id)).toEqual(["2", "3", "1"]);
  });

  it("deve desempatar por estado na ordem padrão (a fazer > em execução > concluída > cancelada > backlog)", () => {
    const tBacklog = createTaskMock("1", "alta", "backlog");
    const tCancelled = createTaskMock("2", "alta", "cancelada");
    const tCompleted = createTaskMock("3", "alta", "concluída");
    const tInProgress = createTaskMock("4", "alta", "em execução");
    const tTodo = createTaskMock("5", "alta", "a fazer");

    const result = sortTasks([
      tBacklog,
      tCancelled,
      tCompleted,
      tInProgress,
      tTodo,
    ]);

    expect(result.map((t) => t.id)).toEqual(["5", "4", "3", "2", "1"]);
  });

  it("deve suportar a sequência alternativa de estados com backlog no início quando configurado", () => {
    const tBacklog = createTaskMock("1", "média", "backlog");
    const tTodo = createTaskMock("2", "média", "a fazer");
    const tInProgress = createTaskMock("3", "média", "em execução");
    const tCompleted = createTaskMock("4", "média", "concluída");
    const tCancelled = createTaskMock("5", "média", "cancelada");

    const result = sortTasks(
      [tCancelled, tCompleted, tInProgress, tTodo, tBacklog],
      STATE_SORT_WEIGHT_ALTERNATIVE,
    );

    expect(result.map((t) => t.id)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("deve desempatar por data de criação mais recente quando prioridade e estado forem idênticos", () => {
    const tOlder = createTaskMock("old", "alta", "a fazer", "2026-11-08T10:00:00.000Z");
    const tNewer = createTaskMock("new", "alta", "a fazer", "2026-11-08T12:00:00.000Z");

    const result = sortTasks([tOlder, tNewer]);

    expect(result.map((t) => t.id)).toEqual(["new", "old"]);
  });

  it("não deve mutar o array original recebido", () => {
    const t1 = createTaskMock("1", "baixa", "backlog");
    const t2 = createTaskMock("2", "alta", "a fazer");
    const original = [t1, t2];

    const result = sortTasks(original);

    expect(result).not.toBe(original);
    expect(original[0]?.id).toBe("1");
    expect(original[1]?.id).toBe("2");
  });

  it("deve lidar corretamente com listas vazias ou com apenas um elemento", () => {
    expect(sortTasks([])).toEqual([]);

    const single = [createTaskMock("1", "alta", "a fazer")];
    expect(sortTasks(single)).toEqual(single);
  });
});
