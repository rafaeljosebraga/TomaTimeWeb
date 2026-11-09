// src/lib/domain/validate-task.ts
// Validador puro das regras de negócio de tarefas (Tasks).
import {
  TASK_PRIORITIES,
  TASK_STATES,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskState,
  type TaskValidationErrors,
  type TaskValidationResult,
} from "@/types/domain";

export function isValidTaskState(value: unknown): value is TaskState {
  return (
    typeof value === "string" &&
    (TASK_STATES as readonly string[]).includes(value)
  );
}

export function isValidTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

export type ValidatedTaskData = {
  id?: string;
  title: string;
  state: TaskState;
  priority: TaskPriority;
  createdAt?: string;
  updatedAt?: string;
};

export function validateTask(
  input: Partial<CreateTaskInput> | Partial<Task>,
): TaskValidationResult<ValidatedTaskData> {
  const errors: TaskValidationErrors = {};

  // Título da tarefa: obrigatório, entre 1 e 100 caracteres
  const trimmedTitle =
    typeof input.title === "string" ? input.title.trim() : "";
  if (!trimmedTitle || trimmedTitle.length < 1 || trimmedTitle.length > 100) {
    errors.title = [
      "O título da tarefa é obrigatório e deve ter entre 1 e 100 caracteres.",
    ];
  }

  // Estado da tarefa: um entre backlog, a fazer, em execução, concluída e cancelada
  const state = input.state !== undefined ? input.state : "backlog";
  if (!isValidTaskState(state)) {
    errors.state = [
      "O estado da tarefa deve ser um entre: backlog, a fazer, em execução, concluída ou cancelada.",
    ];
  }

  // Prioridade da tarefa: uma entre baixa, média e alta
  const priority = input.priority !== undefined ? input.priority : "média";
  if (!isValidTaskPriority(priority)) {
    errors.priority = [
      "A prioridade da tarefa deve ser uma entre: baixa, média ou alta.",
    ];
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      ...input,
      title: trimmedTitle,
      state: state as TaskState,
      priority: priority as TaskPriority,
    },
  };
}
