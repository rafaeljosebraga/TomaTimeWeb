import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetAudioContextForTesting,
  playPhaseEndAlert,
  primeAudioContext,
  isSoundEnabled,
  setSoundEnabled,
} from "./sound-alert";

describe("sound-alert (Alerta Sonoro RF-14, RN-13, RNF-10)", () => {
  let mockResume: ReturnType<typeof vi.fn>;
  let mockCreateOscillator: ReturnType<typeof vi.fn>;
  let mockCreateGain: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    _resetAudioContextForTesting();
    mockResume = vi.fn().mockResolvedValue(undefined);
    mockCreateOscillator = vi.fn().mockReturnValue({
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    mockCreateGain = vi.fn().mockReturnValue({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    });

    class MockAudioContext {
      state = "suspended";
      currentTime = 0;
      resume = mockResume;
      createOscillator = mockCreateOscillator;
      createGain = mockCreateGain;
      destination = {};
    }

    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("primeAudioContext deve chamar resume no AudioContext suspenso", async () => {
    await primeAudioContext();
    expect(mockResume).toHaveBeenCalled();
  });

  it("playPhaseEndAlert deve sintetizar os tons harmônicos de alerta quando habilitado", async () => {
    await playPhaseEndAlert();
    expect(mockCreateOscillator).toHaveBeenCalledTimes(2);
    expect(mockCreateGain).toHaveBeenCalledTimes(2);
  });

  it("isSoundEnabled deve retornar true por padrão e refletir alterações via setSoundEnabled", () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it("playPhaseEndAlert NÃO deve emitir nenhum som quando desativado (mudo)", async () => {
    setSoundEnabled(false);
    await playPhaseEndAlert();
    expect(mockCreateOscillator).not.toHaveBeenCalled();
    expect(mockCreateGain).not.toHaveBeenCalled();
  });
});
