import { describe, expect, it } from "vitest";
import { validatePreset } from "./validate-preset";

describe("Validação de Presets", () => {
  const validPresetData = {
    name: "Padrão Clássico",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  };

  it("deve aprovar um preset com todos os dados válidos", () => {
    const result = validatePreset(validPresetData);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.name).toBe("Padrão Clássico");
      expect(result.data.focusMinutes).toBe(25);
      expect(result.data.shortBreakMinutes).toBe(5);
      expect(result.data.cyclesBeforeLongBreak).toBe(4);
      expect(result.data.longBreakMinutes).toBe(15);
    }
  });

  describe("Nome do preset", () => {
    it("deve rejeitar nome ausente ou vazio", () => {
      const result = validatePreset({ ...validPresetData, name: "" });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.name).toBeDefined();
      }
    });

    it("deve rejeitar nome composto apenas de espaços", () => {
      const result = validatePreset({ ...validPresetData, name: "   " });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.name).toBeDefined();
      }
    });

    it("deve rejeitar nome com mais de 40 caracteres", () => {
      const longName = "a".repeat(41);
      const result = validatePreset({ ...validPresetData, name: longName });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.name).toBeDefined();
      }
    });

    it("deve aceitar nome nos limites exatos (1 e 40 caracteres)", () => {
      expect(validatePreset({ ...validPresetData, name: "A" }).isValid).toBe(true);
      expect(validatePreset({ ...validPresetData, name: "A".repeat(40) }).isValid).toBe(true);
    });
  });

  describe("Tempo de foco (TF)", () => {
    it("deve rejeitar foco menor que 1 minuto", () => {
      const result = validatePreset({ ...validPresetData, focusMinutes: 0 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.focusMinutes).toBeDefined();
      }
    });

    it("deve rejeitar foco maior que 120 minutos", () => {
      const result = validatePreset({ ...validPresetData, focusMinutes: 121 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.focusMinutes).toBeDefined();
      }
    });

    it("deve rejeitar números decimais/não-inteiros", () => {
      const result = validatePreset({ ...validPresetData, focusMinutes: 25.5 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.focusMinutes).toBeDefined();
      }
    });

    it("deve aceitar os limites válidos de 1 e 120 minutos", () => {
      expect(validatePreset({ ...validPresetData, focusMinutes: 1 }).isValid).toBe(true);
      expect(validatePreset({ ...validPresetData, focusMinutes: 120 }).isValid).toBe(true);
    });
  });

  describe("Tempo de pausa curta (TPC)", () => {
    it("deve rejeitar pausa curta menor que 1 minuto", () => {
      const result = validatePreset({ ...validPresetData, shortBreakMinutes: 0 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.shortBreakMinutes).toBeDefined();
      }
    });

    it("deve rejeitar pausa curta maior que 60 minutos", () => {
      const result = validatePreset({ ...validPresetData, shortBreakMinutes: 61 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.shortBreakMinutes).toBeDefined();
      }
    });

    it("deve rejeitar números não-inteiros", () => {
      const result = validatePreset({ ...validPresetData, shortBreakMinutes: 5.5 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.shortBreakMinutes).toBeDefined();
      }
    });

    it("deve aceitar os limites válidos de 1 e 60 minutos", () => {
      expect(validatePreset({ ...validPresetData, shortBreakMinutes: 1 }).isValid).toBe(true);
      expect(validatePreset({ ...validPresetData, shortBreakMinutes: 60 }).isValid).toBe(true);
    });
  });

  describe("Quantidade de ciclos antes da pausa longa", () => {
    it("deve rejeitar ciclos menores que 1", () => {
      const result = validatePreset({ ...validPresetData, cyclesBeforeLongBreak: 0 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.cyclesBeforeLongBreak).toBeDefined();
      }
    });

    it("deve rejeitar ciclos maiores que 12", () => {
      const result = validatePreset({ ...validPresetData, cyclesBeforeLongBreak: 13 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.cyclesBeforeLongBreak).toBeDefined();
      }
    });

    it("deve rejeitar valores não-inteiros", () => {
      const result = validatePreset({ ...validPresetData, cyclesBeforeLongBreak: 4.2 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.cyclesBeforeLongBreak).toBeDefined();
      }
    });

    it("deve aceitar os limites válidos de 1 e 12 ciclos", () => {
      expect(validatePreset({ ...validPresetData, cyclesBeforeLongBreak: 1 }).isValid).toBe(true);
      expect(validatePreset({ ...validPresetData, cyclesBeforeLongBreak: 12 }).isValid).toBe(true);
    });
  });

  describe("Tempo de pausa longa (TPL)", () => {
    it("deve rejeitar pausa longa menor que 1 minuto", () => {
      const result = validatePreset({ ...validPresetData, longBreakMinutes: 0 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.longBreakMinutes).toBeDefined();
      }
    });

    it("deve rejeitar pausa longa maior que 60 minutos", () => {
      const result = validatePreset({ ...validPresetData, longBreakMinutes: 61 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.longBreakMinutes).toBeDefined();
      }
    });

    it("deve rejeitar valores não-inteiros", () => {
      const result = validatePreset({ ...validPresetData, longBreakMinutes: 15.8 });
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.longBreakMinutes).toBeDefined();
      }
    });

    it("deve aceitar os limites válidos de 1 e 60 minutos", () => {
      expect(validatePreset({ ...validPresetData, longBreakMinutes: 1 }).isValid).toBe(true);
      expect(validatePreset({ ...validPresetData, longBreakMinutes: 60 }).isValid).toBe(true);
    });
  });
});
