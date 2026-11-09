// src/lib/storage/tasks-storage.ts
// Persistência e operações de CRUD de Tarefas (Tasks) no localStorage.
import type {
  CreateTaskInput,
  StorageActionResult,
  Task,
  TaskPriority,
  TaskState,
  TaskValidationResult,
  UpdateTaskInput,
} from "@/types/domain";
import { validateTask } from "@/lib/domain/validate-task";

export const TASK_STORAGE_KEYS = {
  TASKS: "tomatimer:tasks",
} as const;

function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveTasks(tasks: Task[]): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.setItem(TASK_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  } catch {
    // Falha silenciosa de escrita (ex.: quota excedida ou modo privado restrito)
  }
}

export function loadTasks(): Task[] {
  try {
    if (!isBrowserStorageAvailable()) {
      return [];
    }

    const raw = localStorage.getItem(TASK_STORAGE_KEYS.TASKS);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const validTasks: Task[] = [];
    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).createdAt === "string" &&
        typeof (item as Record<string, unknown>).updatedAt === "string"
      ) {
        const candidate = item as Task;
        const validation = validateTask(candidate);
        if (validation.isValid) {
          validTasks.push({
            id: candidate.id,
            title: validation.data.title,
            state: validation.data.state,
            priority: validation.data.priority,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt,
          });
        }
      }
    }

    return validTasks;
  } catch {
    return [];
  }
}

export function getTaskById(id: string): Task | null {
  const tasks = loadTasks();
  return tasks.find((t) => t.id === id) ?? null;
}

export function getTasksByState(state: TaskState): Task[] {
  const tasks = loadTasks();
  return tasks.filter((t) => t.state === state);
}

export function getTasksByPriority(priority: TaskPriority): Task[] {
  const tasks = loadTasks();
  return tasks.filter((t) => t.priority === priority);
}

export function createTask(input: CreateTaskInput): TaskValidationResult<Task> {
  const validation = validateTask(input);
  if (!validation.isValid) {
    return validation;
  }

  const tasks = loadTasks();
  const id =
    input.id ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  const now = new Date().toISOString();
  const newTask: Task = {
    id,
    title: validation.data.title,
    state: validation.data.state,
    priority: validation.data.priority,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  saveTasks([...tasks, newTask]);
  return { isValid: true, data: newTask };
}

export function updateTask(
  id: string,
  input: UpdateTaskInput,
): TaskValidationResult<Task> {
  const tasks = loadTasks();
  const existing = tasks.find((t) => t.id === id);

  if (!existing) {
    return {
      isValid: false,
      errors: {
        title: ["Tarefa não encontrada."],
      },
    };
  }

  const merged = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.state !== undefined ? { state: input.state } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
  };

  const validation = validateTask(merged);
  if (!validation.isValid) {
    return validation;
  }

  const updatedTask: Task = {
    ...existing,
    title: validation.data.title,
    state: validation.data.state,
    priority: validation.data.priority,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
  saveTasks(updatedList);

  return { isValid: true, data: updatedTask };
}

export function deleteTask(id: string): StorageActionResult<Task> {
  const tasks = loadTasks();
  const target = tasks.find((t) => t.id === id);

  if (!target) {
    return {
      success: false,
      error: "Tarefa não encontrada para exclusão.",
    };
  }

  const filtered = tasks.filter((t) => t.id !== id);
  saveTasks(filtered);

  return {
    success: true,
    data: target,
  };
}

export function clearTasks(): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.removeItem(TASK_STORAGE_KEYS.TASKS);
    }
  } catch {
    // Falha silenciosa
  }
}
