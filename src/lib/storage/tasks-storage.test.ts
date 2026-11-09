// src/lib/storage/tasks-storage.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTasks,
  createTask,
  deleteTask,
  getTaskById,
  getTasksByPriority,
  getTasksByState,
  loadTasks,
  saveTasks,
  TASK_STORAGE_KEYS,
  updateTask,
} from "./tasks-storage";

describe("Armazenamento e CRUD de Tarefas no localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadTasks", () => {
    it("deve retornar um array vazio quando não houver tarefas salvas", () => {
      const tasks = loadTasks();
      expect(tasks).toEqual([]);
    });

    it("deve carregar tarefas válidas salvas no localStorage", () => {
      const mockTasks = [
        {
          id: "task-1",
          title: "Tarefa 1",
          state: "backlog" as const,
          priority: "baixa" as const,
          createdAt: "2026-11-08T20:00:00.000Z",
          updatedAt: "2026-11-08T20:00:00.000Z",
        },
      ];
      saveTasks(mockTasks);

      const loaded = loadTasks();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]?.title).toBe("Tarefa 1");
    });

    it("deve descartar itens inválidos ou corrompidos presentes no storage", () => {
      localStorage.setItem(
        TASK_STORAGE_KEYS.TASKS,
        JSON.stringify([
          { id: "invalid-1", title: "" }, // sem título válido
          {
            id: "valid-1",
            title: "Tarefa Válida",
            state: "a fazer",
            priority: "alta",
            createdAt: "2026-11-08T20:00:00.000Z",
            updatedAt: "2026-11-08T20:00:00.000Z",
          },
        ]),
      );

      const loaded = loadTasks();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]?.title).toBe("Tarefa Válida");
    });
  });

  describe("createTask", () => {
    it("deve criar uma nova tarefa com id gerado, timestamps e valores padrão", () => {
      const result = createTask({
        title: "Escrever documentação",
      });

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.id).toBeDefined();
        expect(result.data.title).toBe("Escrever documentação");
        expect(result.data.state).toBe("backlog");
        expect(result.data.priority).toBe("média");
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();

        const stored = loadTasks();
        expect(stored).toHaveLength(1);
        expect(stored[0]?.id).toBe(result.data.id);
      }
    });

    it("deve criar uma tarefa com estado e prioridade customizados", () => {
      const result = createTask({
        title: "Refatorar temporizador",
        state: "em execução",
        priority: "alta",
      });

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.state).toBe("em execução");
        expect(result.data.priority).toBe("alta");
      }
    });

    it("deve rejeitar a criação quando o título for inválido", () => {
      const result = createTask({
        title: "   ",
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.title).toBeDefined();
      }
      expect(loadTasks()).toHaveLength(0);
    });

    it("deve rejeitar a criação quando o estado ou prioridade forem inválidos", () => {
      const invalidStateResult = createTask({
        title: "Tarefa",
        state: "estado-inexistente" as unknown as "backlog",
      });
      expect(invalidStateResult.isValid).toBe(false);

      const invalidPriorityResult = createTask({
        title: "Tarefa",
        priority: "super-alta" as unknown as "alta",
      });
      expect(invalidPriorityResult.isValid).toBe(false);
    });
  });

  describe("getTaskById", () => {
    it("deve retornar a tarefa correspondente ao ID informado", () => {
      const created = createTask({ title: "Localizar por ID" });
      if (!created.isValid) throw new Error("Falha na criação");

      const found = getTaskById(created.data.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.data.id);
      expect(found?.title).toBe("Localizar por ID");
    });

    it("deve retornar null se o ID não existir", () => {
      const found = getTaskById("id-inexistente");
      expect(found).toBeNull();
    });
  });

  describe("updateTask", () => {
    it("deve atualizar os campos da tarefa e renovar updatedAt", () => {
      const created = createTask({
        title: "Tarefa Original",
        state: "backlog",
        priority: "baixa",
      });
      if (!created.isValid) throw new Error("Falha na criação");

      const updateResult = updateTask(created.data.id, {
        title: "Tarefa Atualizada",
        state: "concluída",
        priority: "alta",
      });

      expect(updateResult.isValid).toBe(true);
      if (updateResult.isValid) {
        expect(updateResult.data.title).toBe("Tarefa Atualizada");
        expect(updateResult.data.state).toBe("concluída");
        expect(updateResult.data.priority).toBe("alta");

        const updatedInStorage = getTaskById(created.data.id);
        expect(updatedInStorage?.title).toBe("Tarefa Atualizada");
        expect(updatedInStorage?.state).toBe("concluída");
      }
    });

    it("deve rejeitar atualização se os novos dados violarem validações", () => {
      const created = createTask({ title: "Título Bom" });
      if (!created.isValid) throw new Error("Falha na criação");

      const invalidUpdate = updateTask(created.data.id, {
        title: "",
      });

      expect(invalidUpdate.isValid).toBe(false);
      if (!invalidUpdate.isValid) {
        expect(invalidUpdate.errors.title).toBeDefined();
      }

      // Garante que o valor no storage permaneceu intacto
      expect(getTaskById(created.data.id)?.title).toBe("Título Bom");
    });

    it("deve retornar erro quando o ID da tarefa não existir", () => {
      const result = updateTask("id-fantasma", { title: "Novo" });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.title).toContain("Tarefa não encontrada.");
      }
    });
  });

  describe("deleteTask", () => {
    it("deve remover a tarefa do storage quando o ID existir", () => {
      const created = createTask({ title: "Tarefa para Deletar" });
      if (!created.isValid) throw new Error("Falha na criação");

      const deleteResult = deleteTask(created.data.id);
      expect(deleteResult.success).toBe(true);
      if (deleteResult.success) {
        expect(deleteResult.data.id).toBe(created.data.id);
      }

      expect(getTaskById(created.data.id)).toBeNull();
      expect(loadTasks()).toHaveLength(0);
    });

    it("deve retornar erro quando tentar deletar ID inexistente", () => {
      const result = deleteTask("id-fantasma");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Tarefa não encontrada para exclusão.");
      }
    });
  });

  describe("Filtros por Estado e Prioridade", () => {
    beforeEach(() => {
      createTask({ title: "T1", state: "backlog", priority: "baixa" });
      createTask({ title: "T2", state: "em execução", priority: "alta" });
      createTask({ title: "T3", state: "concluída", priority: "alta" });
    });

    it("getTasksByState deve filtrar corretamente pelo estado", () => {
      const inProgress = getTasksByState("em execução");
      expect(inProgress).toHaveLength(1);
      expect(inProgress[0]?.title).toBe("T2");

      const backlog = getTasksByState("backlog");
      expect(backlog).toHaveLength(1);
      expect(backlog[0]?.title).toBe("T1");
    });

    it("getTasksByPriority deve filtrar corretamente pela prioridade", () => {
      const highPriority = getTasksByPriority("alta");
      expect(highPriority).toHaveLength(2);

      const lowPriority = getTasksByPriority("baixa");
      expect(lowPriority).toHaveLength(1);
      expect(lowPriority[0]?.title).toBe("T1");
    });
  });

  describe("clearTasks", () => {
    it("deve limpar todas as tarefas do localStorage", () => {
      createTask({ title: "T1" });
      createTask({ title: "T2" });
      expect(loadTasks()).toHaveLength(2);

      clearTasks();
      expect(loadTasks()).toHaveLength(0);
    });
  });
});
