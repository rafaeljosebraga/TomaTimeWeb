// src/lib/storage/presets-storage.ts
// Módulo de persistência e operações de CRUD de TimerPresets no localStorage.
import type {
  StorageActionResult,
  TimerPreset,
  ValidationResult,
} from "@/types/domain";
import { validatePreset } from "@/lib/domain/validate-preset";
import { getActiveSessionPresetId } from "./session-storage";

export const PRESET_STORAGE_KEYS = {
  PRESETS: "pomodoro.presets",
  LEGACY_PRESETS: "tomatimer:presets",
  ACTIVE_PRESET_ID: "pomodoro.activePresetId",
  LEGACY_ACTIVE_PRESET_ID: "tomatimer:active-preset-id",
} as const;

export const DEFAULT_PRESET_ID = "preset-default-classic";

export const DEFAULT_PRESETS: readonly TimerPreset[] = [
  {
    id: DEFAULT_PRESET_ID,
    name: "Clássico 25/5",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  },
  {
    id: "preset-extended-50-10",
    name: "Foco Estendido 50/10",
    focusMinutes: 50,
    shortBreakMinutes: 10,
    cyclesBeforeLongBreak: 3,
    longBreakMinutes: 20,
  },
];

function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function isPresetInUse(id: string): boolean {
  return getActiveSessionPresetId() === id;
}

export function savePresets(presets: TimerPreset[]): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.setItem(
        PRESET_STORAGE_KEYS.PRESETS,
        JSON.stringify(presets),
      );
    }
  } catch {
    // Falha silenciosa de escrita (ex: quota cheia ou bloqueio de armazenamento)
  }
}

export function loadPresets(): TimerPreset[] {
  try {
    if (!isBrowserStorageAvailable()) {
      return [...DEFAULT_PRESETS];
    }

    const raw =
      localStorage.getItem(PRESET_STORAGE_KEYS.PRESETS) ??
      localStorage.getItem(PRESET_STORAGE_KEYS.LEGACY_PRESETS);
    if (!raw) {
      // Inicializa com os presets padrão caso não haja nada salvo
      const defaults = [...DEFAULT_PRESETS];
      savePresets(defaults);
      return defaults;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = [...DEFAULT_PRESETS];
      savePresets(defaults);
      return defaults;
    }

    // Valida cada item lido do storage
    const validPresets: TimerPreset[] = [];
    for (const item of parsed) {
      const validation = validatePreset(item as Partial<TimerPreset>);
      if (validation.isValid) {
        validPresets.push(validation.data);
      }
    }

    if (validPresets.length === 0) {
      const defaults = [...DEFAULT_PRESETS];
      savePresets(defaults);
      return defaults;
    }

    return validPresets;
  } catch {
    return [...DEFAULT_PRESETS];
  }
}

export function getPresetById(id: string): TimerPreset | null {
  const presets = loadPresets();
  return presets.find((preset) => preset.id === id) ?? null;
}

export function getActivePresetId(): string {
  const presets = loadPresets();
  const fallbackId = presets[0]?.id ?? DEFAULT_PRESET_ID;

  try {
    if (!isBrowserStorageAvailable()) {
      return fallbackId;
    }

    const activeId =
      localStorage.getItem(PRESET_STORAGE_KEYS.ACTIVE_PRESET_ID) ??
      localStorage.getItem(PRESET_STORAGE_KEYS.LEGACY_ACTIVE_PRESET_ID);
    if (activeId && presets.some((p) => p.id === activeId)) {
      return activeId;
    }

    // Se o ID salvo não existe na lista, redefine para o primeiro disponível
    setActivePresetId(fallbackId);
    return fallbackId;
  } catch {
    return fallbackId;
  }
}

export function setActivePresetId(id: string): void {
  try {
    if (isBrowserStorageAvailable()) {
      localStorage.setItem(PRESET_STORAGE_KEYS.ACTIVE_PRESET_ID, id);
    }
  } catch {
    // Falha silenciosa
  }
}

export function createPreset(
  input: Omit<TimerPreset, "id"> | Partial<TimerPreset>,
): ValidationResult<TimerPreset> {
  const validation = validatePreset(input);
  if (!validation.isValid) {
    return validation;
  }

  const presets = loadPresets();
  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `preset-${Date.now()}`;

  const newPreset: TimerPreset = {
    ...validation.data,
    id: newId,
  };

  savePresets([...presets, newPreset]);
  return { isValid: true, data: newPreset };
}

export function updatePreset(
  id: string,
  input: Partial<Omit<TimerPreset, "id">>,
): ValidationResult<TimerPreset> {
  // Um preset em uso por sessão ativa não pode ser editado nem excluído
  if (isPresetInUse(id)) {
    return {
      isValid: false,
      errors: {
        name: [
          "Este preset está em uso por uma sessão ativa e não pode ser editado.",
        ],
      },
    };
  }

  const presets = loadPresets();
  const existing = presets.find((p) => p.id === id);

  if (!existing) {
    return {
      isValid: false,
      errors: {
        name: ["Preset não encontrado."],
      },
    };
  }

  const merged = {
    ...existing,
    ...input,
    id,
  };

  const validation = validatePreset(merged);
  if (!validation.isValid) {
    return validation;
  }

  const updatedPresets = presets.map((preset) =>
    preset.id === id ? validation.data : preset,
  );

  savePresets(updatedPresets);
  return { isValid: true, data: validation.data };
}

export function deletePreset(id: string): StorageActionResult<{ deletedId: string }> {
  // Um preset em uso por sessão ativa não pode ser editado nem excluído
  if (isPresetInUse(id)) {
    return {
      success: false,
      error:
        "Este preset está em uso por uma sessão ativa e não pode ser excluído.",
    };
  }

  const presets = loadPresets();

  if (presets.length <= 1) {
    return {
      success: false,
      error: "Não é possível excluir o único preset restante.",
    };
  }

  const targetExists = presets.some((p) => p.id === id);
  if (!targetExists) {
    return {
      success: false,
      error: "Preset não encontrado.",
    };
  }

  const remainingPresets = presets.filter((p) => p.id !== id);
  savePresets(remainingPresets);

  // Se o preset excluído era o ativo, atualiza o ativo para o primeiro remanescente
  if (getActivePresetId() === id) {
    const nextActiveId = remainingPresets[0]?.id ?? DEFAULT_PRESET_ID;
    setActivePresetId(nextActiveId);
  }

  return {
    success: true,
    data: { deletedId: id },
  };
}

export function resetToDefaultPresets(): TimerPreset[] {
  const defaults = [...DEFAULT_PRESETS];
  savePresets(defaults);
  setActivePresetId(DEFAULT_PRESET_ID);
  return defaults;
}
