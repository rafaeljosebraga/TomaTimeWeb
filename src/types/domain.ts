// src/types/domain.ts
// Tipos Abstratos de Domínio para Presets e Temporizador de Sessão.

// Estágios da sessão:
// TF: Tempo de Foco
// TPC: Tempo de Pausa Curta
// TPL: Tempo de Pausa Longa
export type SessionStage = "TF" | "TPC" | "TPL";

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

export type ValidationResult<T> =
  | { isValid: true; data: T }
  | { isValid: false; errors: PresetValidationErrors };

// Resultado padronizado para operações de armazenamento (exclusão, mutações)
export type StorageActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
