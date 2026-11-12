// src/types/domain.ts
// Tipos Abstratos de Domínio para Presets e Temporizador de Sessão.

// Estágios da sessão:
// TF: Tempo de Foco
// TPC: Tempo de Pausa Curta
// TPL: Tempo de Pausa Longa
export type SessionStage = "TF" | "TPC" | "TPL";

export const STAGE_DISPLAY_NAMES: Record<SessionStage, string> = {
  TF: "Tempo de Foco",
  TPC: "Pausa Curta",
  TPL: "Pausa Longa",
};

// Fases de execução da sessão
export type SessionPhase = "idle" | "running" | "paused" | "completed";

// Estrutura do Preset (Temporizador Personalizado)
export type TimerPreset = {
  id: string;
  name: string; // 1 a 40 caracteres
  focusMinutes: number; // TF: 1 a 120 min
  shortBreakMinutes: number; // TPC: 1 a 60 min
  cyclesBeforeLongBreak: number; // 1 a 12 ciclos
  longBreakMinutes: number; // TPL: 1 a 60 min
};

// Temporizador da Sessão controlado por Timestamps
export type SessionTimer = {
  preset: TimerPreset;
  stage: SessionStage;
  phase: SessionPhase;
  completedCycles: number;

  // Timestamps de controle
  startedAt: number | null; // Timestamp de quando o estágio atual foi iniciado
  endsAt: number | null; // Timestamp previsto para o término do estágio atual
  durationMs: number; // Duração total configurada para o estágio atual em ms
  remainingMs: number; // Tempo restante em milissegundos
};

// Contrato de validação de regras de negócio
export type PresetValidationErrors = {
  name?: string[];
  focusMinutes?: string[];
  shortBreakMinutes?: string[];
  cyclesBeforeLongBreak?: string[];
  longBreakMinutes?: string[];
};

export type ValidationResult<T, E = PresetValidationErrors> =
  | { isValid: true; data: T }
  | { isValid: false; errors: E };

// Resultado padronizado para operações de armazenamento (exclusão, mutações)
export type StorageActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Estados permitidos da Tarefa
export const TASK_STATES = [
  "backlog",
  "a fazer",
  "em execução",
  "concluída",
  "cancelada",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

// Níveis de prioridade permitidos da Tarefa
export const TASK_PRIORITIES = [
  "baixa",
  "média",
  "alta",
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Entidade Tarefa
export type Task = {
  id: string;
  title: string; // Obrigatório, entre 1 e 100 caracteres
  state: TaskState; // backlog, a fazer, em execução, concluída, cancelada
  priority: TaskPriority; // baixa, média, alta
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// Erros de validação de tarefas
export type TaskValidationErrors = {
  title?: string[];
  state?: string[];
  priority?: string[];
};

export type TaskValidationResult<T = Task> = ValidationResult<T, TaskValidationErrors>;

export type CreateTaskInput = {
  title: string;
  state?: TaskState;
  priority?: TaskPriority;
  id?: string;
  createdAt?: string;
};

export type UpdateTaskInput = {
  title?: string;
  state?: TaskState;
  priority?: TaskPriority;
};
