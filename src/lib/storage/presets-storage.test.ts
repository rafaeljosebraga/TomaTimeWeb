import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PRESETS,
  DEFAULT_PRESET_ID,
  PRESET_STORAGE_KEYS,
  createPreset,
  deletePreset,
  getActivePresetId,
  getPresetById,
  isPresetInUse,
  loadPresets,
  resetToDefaultPresets,
  savePresets,
  setActivePresetId,
  updatePreset,
} from "./presets-storage";
import { saveSessionTimer, clearSessionTimer } from "./session-storage";
import { createSessionTimer, startSessionTimer, pauseSessionTimer } from "@/lib/domain/session-timer";
import type { TimerPreset } from "@/types/domain";

describe("presets-storage (CRUD no localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadPresets e savePresets", () => {
    it("deve inicializar com DEFAULT_PRESETS caso o localStorage esteja vazio", () => {
      const presets = loadPresets();
      expect(presets).toHaveLength(DEFAULT_PRESETS.length);
      expect(presets[0]?.name).toBe(DEFAULT_PRESETS[0]?.name);
    });

    it("deve carregar presets salvos no localStorage", () => {
      const custom: TimerPreset[] = [
        {
          id: "custom-1",
          name: "Sprint 45",
          focusMinutes: 45,
          shortBreakMinutes: 8,
          cyclesBeforeLongBreak: 3,
          longBreakMinutes: 18,
        },
      ];

      savePresets(custom);
      const loaded = loadPresets();

      expect(loaded).toHaveLength(1);
      expect(loaded[0]?.id).toBe("custom-1");
      expect(loaded[0]?.name).toBe("Sprint 45");
    });

    it("deve recuperar com DEFAULT_PRESETS se o JSON estiver corrompido", () => {
      localStorage.setItem(PRESET_STORAGE_KEYS.PRESETS, "json_invalido{{{");
      const presets = loadPresets();
      expect(presets).toEqual(DEFAULT_PRESETS);
    });

    it("deve recuperar com DEFAULT_PRESETS se a lista for vazia", () => {
      localStorage.setItem(PRESET_STORAGE_KEYS.PRESETS, JSON.stringify([]));
      const presets = loadPresets();
      expect(presets).toEqual(DEFAULT_PRESETS);
    });
  });

  describe("getPresetById", () => {
    it("deve retornar o preset correto pelo ID", () => {
      const target = DEFAULT_PRESETS[0];
      expect(target).toBeDefined();
      if (target) {
        const found = getPresetById(target.id);
        expect(found).toEqual(target);
      }
    });

    it("deve retornar null para ID inexistente", () => {
      expect(getPresetById("id-inexistente")).toBeNull();
    });
  });

  describe("createPreset", () => {
    it("deve criar um preset válido e persisti-lo no localStorage", () => {
      const result = createPreset({
        name: "Estudo Intenso",
        focusMinutes: 50,
        shortBreakMinutes: 10,
        cyclesBeforeLongBreak: 4,
        longBreakMinutes: 30,
      });

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.name).toBe("Estudo Intenso");
        expect(result.data.id).toBeDefined();

        const all = loadPresets();
        expect(all.some((p) => p.id === result.data.id)).toBe(true);
      }
    });

    it("deve rejeitar a criação se os dados forem inválidos", () => {
      const result = createPreset({
        name: "", // Nome inválido
        focusMinutes: 150, // Foco maior que 120 min
        shortBreakMinutes: 5,
        cyclesBeforeLongBreak: 4,
        longBreakMinutes: 15,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.name).toBeDefined();
        expect(result.errors.focusMinutes).toBeDefined();
      }
    });
  });

  describe("updatePreset", () => {
    it("deve atualizar os campos permitidos e persistir", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        const result = updatePreset(target.id, {
          name: "Nome Atualizado",
          focusMinutes: 30,
        });

        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.data.name).toBe("Nome Atualizado");
          expect(result.data.focusMinutes).toBe(30);

          const updated = getPresetById(target.id);
          expect(updated?.name).toBe("Nome Atualizado");
          expect(updated?.focusMinutes).toBe(30);
        }
      }
    });

    it("deve retornar erro se o ID a ser atualizado não existir", () => {
      const result = updatePreset("id-fantasma", { name: "Novo Nome" });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.name).toContain("Preset não encontrado.");
      }
    });

    it("deve rejeitar atualização se os novos valores forem inválidos", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        const result = updatePreset(target.id, {
          focusMinutes: 0, // Foco inválido
        });

        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.errors.focusMinutes).toBeDefined();
        }
      }
    });

    it("não deve permitir editar preset em uso por sessão em andamento (running)", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        // Simula sessão ativa em andamento com este preset
        const activeSession = startSessionTimer(createSessionTimer(target), Date.now());
        saveSessionTimer(activeSession);

        expect(isPresetInUse(target.id)).toBe(true);

        const result = updatePreset(target.id, {
          name: "Tentativa de Alteração",
          focusMinutes: 45,
        });

        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.errors.name).toBeDefined();
          expect(result.errors.name?.[0]).toContain("sessão ativa");
        }

        // Garante que o preset não foi alterado no storage
        const current = getPresetById(target.id);
        expect(current?.name).toBe(target.name);
      }
    });

    it("não deve permitir editar preset em uso por sessão pausada (paused)", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        // Simula sessão ativa pausada com este preset
        const started = startSessionTimer(createSessionTimer(target), Date.now());
        const pausedSession = pauseSessionTimer(started, Date.now() + 1000);
        saveSessionTimer(pausedSession);

        expect(isPresetInUse(target.id)).toBe(true);

        const result = updatePreset(target.id, {
          name: "Tentativa de Alteração Pausada",
        });

        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.errors.name?.[0]).toContain("sessão ativa");
        }
      }
    });

    it("deve permitir editar preset quando a sessão estiver concluída (completed) ou inexistente", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        clearSessionTimer();
        expect(isPresetInUse(target.id)).toBe(false);

        const result = updatePreset(target.id, {
          name: "Nome Permitido",
        });

        expect(result.isValid).toBe(true);
      }
    });
  });

  describe("deletePreset", () => {
    it("deve excluir um preset quando houver mais de um na lista", () => {
      createPreset({
        name: "Preset Temporário",
        focusMinutes: 20,
        shortBreakMinutes: 5,
        cyclesBeforeLongBreak: 2,
        longBreakMinutes: 10,
      });

      const before = loadPresets();
      expect(before.length).toBeGreaterThan(2);

      const target = before[before.length - 1];
      expect(target).toBeDefined();

      if (target) {
        const result = deletePreset(target.id);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deletedId).toBe(target.id);
          expect(getPresetById(target.id)).toBeNull();
        }
      }
    });

    it("deve impedir a exclusão caso reste apenas 1 preset", () => {
      const singlePreset: TimerPreset[] = [
        {
          id: "unico-preset",
          name: "Único",
          focusMinutes: 25,
          shortBreakMinutes: 5,
          cyclesBeforeLongBreak: 4,
          longBreakMinutes: 15,
        },
      ];
      savePresets(singlePreset);

      const result = deletePreset("unico-preset");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Não é possível excluir o único preset restante.");
      }

      expect(loadPresets()).toHaveLength(1);
    });

    it("deve retornar erro se o ID não for encontrado", () => {
      const result = deletePreset("id-inexistente");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Preset não encontrado.");
      }
    });

    it("não deve permitir excluir preset em uso por sessão em andamento (running)", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        // Simula sessão ativa em andamento com este preset
        const activeSession = startSessionTimer(createSessionTimer(target), Date.now());
        saveSessionTimer(activeSession);

        expect(isPresetInUse(target.id)).toBe(true);

        const result = deletePreset(target.id);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("sessão ativa");
        }

        // Garante que o preset permaneceu na lista
        expect(getPresetById(target.id)).toBeDefined();
      }
    });

    it("não deve permitir excluir preset em uso por sessão pausada (paused)", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        // Simula sessão ativa pausada com este preset
        const started = startSessionTimer(createSessionTimer(target), Date.now());
        const pausedSession = pauseSessionTimer(started, Date.now() + 1000);
        saveSessionTimer(pausedSession);

        expect(isPresetInUse(target.id)).toBe(true);

        const result = deletePreset(target.id);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("sessão ativa");
        }

        expect(getPresetById(target.id)).toBeDefined();
      }
    });

    it("deve permitir excluir preset quando não houver sessão ativa baseada nele", () => {
      const presets = loadPresets();
      const target = presets[0];
      expect(target).toBeDefined();

      if (target) {
        clearSessionTimer();
        expect(isPresetInUse(target.id)).toBe(false);

        const result = deletePreset(target.id);
        expect(result.success).toBe(true);
      }
    });

    it("deve atualizar o preset ativo se o preset excluído for o ativo", () => {
      const presets = loadPresets();
      const targetToDelete = presets[0];
      const secondPreset = presets[1];

      expect(targetToDelete).toBeDefined();
      expect(secondPreset).toBeDefined();

      if (targetToDelete && secondPreset) {
        setActivePresetId(targetToDelete.id);
        expect(getActivePresetId()).toBe(targetToDelete.id);

        deletePreset(targetToDelete.id);

        const newActiveId = getActivePresetId();
        expect(newActiveId).not.toBe(targetToDelete.id);
        expect(newActiveId).toBe(secondPreset.id);
      }
    });
  });

  describe("activePresetId e resetToDefaultPresets", () => {
    it("deve persistir e carregar o ID ativo", () => {
      const presets = loadPresets();
      const secondPreset = presets[1];
      expect(secondPreset).toBeDefined();

      if (secondPreset) {
        setActivePresetId(secondPreset.id);
        expect(getActivePresetId()).toBe(secondPreset.id);
      }
    });

    it("deve restaurar para o primeiro preset se o ID ativo salvo for inválido", () => {
      setActivePresetId("id-invalido");
      const activeId = getActivePresetId();
      expect(activeId).toBe(DEFAULT_PRESET_ID);
    });

    it("deve resetar presets e ID ativo com resetToDefaultPresets", () => {
      createPreset({
        name: "Custom",
        focusMinutes: 40,
        shortBreakMinutes: 10,
        cyclesBeforeLongBreak: 2,
        longBreakMinutes: 20,
      });

      const restored = resetToDefaultPresets();
      expect(restored).toHaveLength(DEFAULT_PRESETS.length);
      expect(getActivePresetId()).toBe(DEFAULT_PRESET_ID);
    });
  });
});
