// src/lib/audio/sound-alert.ts
// Módulo de alerta sonoro via Web Audio API nativa com controle de mudo.

export const SOUND_STORAGE_KEY = "tomatimer:sound-enabled" as const;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Falha silenciosa caso o armazenamento esteja indisponível
  }
}

let audioCtx: AudioContext | null = null;

export function _resetAudioContextForTesting(): void {
  audioCtx = null;
}

/**
 * Obtém ou cria a instância do AudioContext, com suporte a webkitAudioContext.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  return audioCtx;
}

/**
 * Inicializa ou desbloqueia o AudioContext a partir de um gesto do usuário (ex: clique em Iniciar).
 * Mitiga o risco R-01 (política de autoplay do navegador).
 */
export async function primeAudioContext(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    // Falha silenciosa caso o navegador restrinja a ativação
  }
}

/**
 * Toca uma nota suave com envelope harmônico (attack / decay exponencial).
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peakVolume: number = 0.15,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);

  // Envelope AD: ataque suave para evitar cliques e decaimento exponencial suave
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * Emite o alerta sonoro agradável ao fim de cada fase (duplo chime harmônico).
 * Respeita RNF-10 e políticas de autoplay.
 */
export async function playPhaseEndAlert(): Promise<void> {
  if (!isSoundEnabled()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    // Duas notas harmônicas agradáveis (Mi 659.25Hz e Si 987.77Hz / chime sutil)
    playTone(ctx, 659.25, now, 0.45, 0.18);
    playTone(ctx, 880.0, now + 0.16, 0.65, 0.2);
  } catch {
    // Falha silenciosa caso o dispositivo não possua saída de áudio
  }
}
