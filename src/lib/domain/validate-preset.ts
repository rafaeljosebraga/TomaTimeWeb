// src/lib/domain/validate-preset.ts
// Função pura para validação das regras de negócio de presets.
import type {
  PresetValidationErrors,
  TimerPreset,
  ValidationResult,
} from "@/types/domain";

export function validatePreset(
  input: Partial<TimerPreset>,
): ValidationResult<TimerPreset> {
  const errors: PresetValidationErrors = {};

  // Nome do preset: obrigatório, entre 1 e 40 caracteres
  const trimmedName = typeof input.name === "string" ? input.name.trim() : "";
  if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 40) {
    errors.name = [
      "O nome do preset é obrigatório e deve ter entre 1 e 40 caracteres.",
    ];
  }

  // (TF) Tempo de foco: inteiro entre 1 e 120 minutos
  const focus = input.focusMinutes;
  if (
    typeof focus !== "number" ||
    !Number.isInteger(focus) ||
    focus < 1 ||
    focus > 120
  ) {
    errors.focusMinutes = [
      "O tempo de foco (TF) deve ser um número inteiro entre 1 e 120 minutos.",
    ];
  }

  // (TPC) Tempo de pausa curta: inteiro entre 1 e 60 minutos
  const shortBreak = input.shortBreakMinutes;
  if (
    typeof shortBreak !== "number" ||
    !Number.isInteger(shortBreak) ||
    shortBreak < 1 ||
    shortBreak > 60
  ) {
    errors.shortBreakMinutes = [
      "O tempo de pausa curta (TPC) deve ser um número inteiro entre 1 e 60 minutos.",
    ];
  }

  // Quantidade de ciclos antes da pausa longa: inteiro entre 1 e 12
  const cycles = input.cyclesBeforeLongBreak;
  if (
    typeof cycles !== "number" ||
    !Number.isInteger(cycles) ||
    cycles < 1 ||
    cycles > 12
  ) {
    errors.cyclesBeforeLongBreak = [
      "A quantidade de ciclos antes da pausa longa deve ser um número inteiro entre 1 e 12.",
    ];
  }

  // (TPL) Tempo de pausa longa: inteiro entre 1 e 60 minutos
  const longBreak = input.longBreakMinutes;
  if (
    typeof longBreak !== "number" ||
    !Number.isInteger(longBreak) ||
    longBreak < 1 ||
    longBreak > 60
  ) {
    errors.longBreakMinutes = [
      "O tempo de pausa longa (TPL) deve ser um número inteiro entre 1 e 60 minutos.",
    ];
  }

  const hasErrors = Object.keys(errors).length > 0;

  if (hasErrors) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    data: {
      id: input.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `preset-${Date.now()}`),
      name: trimmedName,
      focusMinutes: focus as number,
      shortBreakMinutes: shortBreak as number,
      cyclesBeforeLongBreak: cycles as number,
      longBreakMinutes: longBreak as number,
    },
  };
}
