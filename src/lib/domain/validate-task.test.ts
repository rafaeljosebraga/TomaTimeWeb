// src/lib/domain/validate-task.test.ts
import { describe, expect, it } from "vitest";
import {
  isValidTaskPriority,
  isValidTaskState,
  validateTask,
} from "./validate-task";

describe("Validação de Tarefas", () => {
  describe("Título da tarefa", () => {
    it("deve aceitar títulos válidos entre 1 e 100 caracteres", () => {
      const minResult = validateTask({ title: "A" });
      expect(minResult.isValid).toBe(true);
      if (minResult.isValid) {
        expect(minResult.data.title).toBe("A");
      }

      const hundredChars = "T".repeat(100);
      const maxResult = validateTask({ title: hundredChars });
      expect(maxResult.isValid).toBe(true);
      if (maxResult.isValid) {
        expect(maxResult.data.title).toBe(hundredChars);
      }
    });

    it("deve remover espaços em branco nas extremidades do título", () => {
      const result = validateTask({ title: "   Implementar testes de tarefas   " });
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.title).toBe("Implementar testes de tarefas");
      }
    });

    it("deve rejeitar título vazio ou com apenas espaços", () => {
      const emptyResult = validateTask({ title: "" });
      expect(emptyResult.isValid).toBe(false);
      if (!emptyResult.isValid) {
        expect(emptyResult.errors.title).toContain(
          "O título da tarefa é obrigatório e deve ter entre 1 e 100 caracteres.",
        );
      }

      const spacesResult = validateTask({ title: "     " });
      expect(spacesResult.isValid).toBe(false);
      if (!spacesResult.isValid) {
        expect(spacesResult.errors.title).toContain(
          "O título da tarefa é obrigatório e deve ter entre 1 e 100 caracteres.",
        );
      }
    });

    it("deve rejeitar título com mais de 100 caracteres", () => {
      const longTitle = "A".repeat(101);
      const result = validateTask({ title: longTitle });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.title).toContain(
          "O título da tarefa é obrigatório e deve ter entre 1 e 100 caracteres.",
        );
      }
    });

    it("deve rejeitar título quando não for informado ou tipo inválido", () => {
      const missingResult = validateTask({});
      expect(missingResult.isValid).toBe(false);
      if (!missingResult.isValid) {
        expect(missingResult.errors.title).toBeDefined();
      }

      const invalidTypeResult = validateTask({ title: 12345 as unknown as string });
      expect(invalidTypeResult.isValid).toBe(false);
      if (!invalidTypeResult.isValid) {
        expect(invalidTypeResult.errors.title).toBeDefined();
      }
    });
  });

  describe("Estado da tarefa", () => {
    it("deve aceitar exclusivamente os 5 estados em português definidos na regra", () => {
      const states = [
        "backlog",
        "a fazer",
        "em execução",
        "concluída",
        "cancelada",
      ] as const;

      for (const state of states) {
        expect(isValidTaskState(state)).toBe(true);

        const result = validateTask({ title: "Tarefa", state });
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.data.state).toBe(state);
        }
      }
    });

    it("deve aplicar o estado padrão 'backlog' quando o campo for omitido", () => {
      const result = validateTask({ title: "Nova Tarefa" });
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.state).toBe("backlog");
      }
    });

    it("deve rejeitar estados fora da lista em português", () => {
      const invalidStates = [
        "todo",
        "in_progress",
        "completed",
        "canceled",
        "pendente",
        "bloqueada",
        123,
      ];

      for (const invalid of invalidStates) {
        expect(isValidTaskState(invalid)).toBe(false);

        const result = validateTask({
          title: "Tarefa",
          state: invalid as unknown as "backlog",
        });
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.errors.state).toContain(
            "O estado da tarefa deve ser um entre: backlog, a fazer, em execução, concluída ou cancelada.",
          );
        }
      }
    });
  });

  describe("Prioridade da tarefa", () => {
    it("deve aceitar exclusivamente as 3 prioridades em português", () => {
      const priorities = ["baixa", "média", "alta"] as const;

      for (const priority of priorities) {
        expect(isValidTaskPriority(priority)).toBe(true);

        const result = validateTask({ title: "Tarefa", priority });
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.data.priority).toBe(priority);
        }
      }
    });

    it("deve aplicar a prioridade padrão 'média' quando o campo for omitido", () => {
      const result = validateTask({ title: "Tarefa Sem Prioridade" });
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.priority).toBe("média");
      }
    });

    it("deve rejeitar prioridades fora da lista em português", () => {
      const invalidPriorities = [
        "low",
        "medium",
        "high",
        "urgente",
        "crítica",
        "media", // sem acento
        456,
      ];

      for (const invalid of invalidPriorities) {
        expect(isValidTaskPriority(invalid)).toBe(false);

        const result = validateTask({
          title: "Tarefa",
          priority: invalid as unknown as "baixa",
        });
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.errors.priority).toContain(
            "A prioridade da tarefa deve ser uma entre: baixa, média ou alta.",
          );
        }
      }
    });
  });

  describe("Validação conjunta de múltiplos campos", () => {
    it("deve retornar todos os erros acumulados se múltiplos campos forem inválidos", () => {
      const result = validateTask({
        title: "",
        state: "invalido" as unknown as "backlog",
        priority: "invalido" as unknown as "baixa",
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.title).toBeDefined();
        expect(result.errors.state).toBeDefined();
        expect(result.errors.priority).toBeDefined();
      }
    });
  });
});
