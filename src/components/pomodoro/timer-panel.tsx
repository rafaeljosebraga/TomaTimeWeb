import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Square,
  Timer as TimerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type {
  PresetValidationErrors,
  SessionStage,
  SessionTimer,
  TimerPreset,
} from "@/types/domain";
import {
  getLongBreakStatusMessage,
  getRemainingSeconds,
} from "@/lib/domain/session-timer";
import { CircularTimer } from "./circular-timer";

type PresetFormData = {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
};

interface TimerPanelProps {
  timer: SessionTimer;
  presets: TimerPreset[];
  activePresetId: string;
  formData: PresetFormData;
  editingId: string | null;
  formErrors: PresetValidationErrors;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onResetCycles: () => void;
  onSkipStage: () => void;
  onEndSession: () => void;
  onSelectActivePreset: (id: string) => void;
  onFormDataChange: (data: PresetFormData) => void;
  onSavePreset: (e: React.FormEvent) => void;
  onStartEdit: (preset: TimerPreset) => void;
  onCancelEdit: () => void;
  onRequestDeletePreset: (preset: TimerPreset) => void;
}

const STAGES: { stage: SessionStage; label: string }[] = [
  { stage: "TF", label: "Tempo de Foco" },
  { stage: "TPC", label: "Pausa Curta" },
  { stage: "TPL", label: "Pausa Longa" },
];

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TimerPanel({
  timer,
  presets,
  activePresetId,
  formData,
  editingId,
  formErrors,
  onStart,
  onPause,
  onResume,
  onReset,
  onResetCycles,
  onSkipStage,
  onEndSession,
  onSelectActivePreset,
  onFormDataChange,
  onSavePreset,
  onStartEdit,
  onCancelEdit,
  onRequestDeletePreset,
}: TimerPanelProps) {
  const remainingSecs = getRemainingSeconds(timer);
  const remainingFormatted = formatSeconds(remainingSecs);
  const totalDurationMs = timer.durationMs > 0 ? timer.durationMs : 1;
  const progress = 1 - timer.remainingMs / totalDurationMs;

  return (
    <Card className="gap-6 px-4 py-8 sm:px-8 flex flex-col justify-between">
      {/* Seletor visual de fases */}
      <CardHeader className="flex flex-row justify-center px-0 pb-0 pt-0">
        <div
          role="tablist"
          aria-label="Fase do temporizador"
          className="inline-flex max-w-full flex-wrap justify-center items-center gap-1 rounded-full bg-muted p-1"
        >
          {STAGES.map((s) => {
            const isCurrent = timer.stage === s.stage;
            return (
              <span
                key={s.stage}
                role="tab"
                aria-selected={isCurrent}
                className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground opacity-70"
                }`}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-7 px-0 pt-4">
        {/* Temporizador Circular */}
        <CircularTimer
          stage={timer.stage}
          phase={timer.phase}
          remainingSeconds={remainingSecs}
          formattedTime={remainingFormatted}
          progress={progress}
          completedCycles={timer.completedCycles}
          cyclesBeforeLongBreak={timer.preset.cyclesBeforeLongBreak}
        />

        {/* Detalhes de status e ciclos */}
        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Ciclos de foco concluídos: {timer.completedCycles}</span>
            <button
              type="button"
              onClick={onResetCycles}
              className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer ml-1"
              title="Zerar a contagem de ciclos concluídos"
            >
              (Zerar)
            </button>
          </p>
          <p>{getLongBreakStatusMessage(timer)}</p>
          {timer.endsAt && timer.phase === "running" && (
            <p className="text-[11px] opacity-80">
              Fim previsto: {new Date(timer.endsAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Botões de controle */}
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {timer.phase === "idle" && (
            <Button
              size="lg"
              className="h-12 w-full min-w-40 px-8 text-base font-semibold sm:w-auto"
              onClick={onStart}
              aria-label="Iniciar temporizador"
            >
              <Play className="size-5 fill-current" />
              Iniciar
            </Button>
          )}

          {timer.phase === "running" && (
            <Button
              size="lg"
              className="h-12 w-full min-w-40 px-8 text-base font-semibold sm:w-auto"
              onClick={onPause}
              aria-label="Pausar temporizador"
            >
              <Pause className="size-5 fill-current" />
              Pausar
            </Button>
          )}

          {timer.phase === "paused" && (
            <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
              <Button
                size="lg"
                className="h-12 flex-1 sm:flex-none min-w-36 text-base font-semibold"
                onClick={onResume}
                aria-label="Retomar temporizador"
              >
                <Play className="size-5 fill-current" />
                Retomar
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 sm:flex-none"
                onClick={onReset}
                aria-label="Reiniciar fase atual"
                title="Reiniciar"
              >
                <RotateCcw className="size-4" />
                Reiniciar
              </Button>
            </div>
          )}

          {timer.phase === "completed" && (
            <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
              <Button
                size="lg"
                className="h-12 flex-1 sm:flex-none min-w-36 text-base font-semibold"
                onClick={onStart}
                aria-label="Iniciar próximo estágio"
              >
                <Play className="size-5 fill-current" />
                Próxima Fase
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 sm:flex-none"
                onClick={onReset}
                aria-label="Reiniciar estágio"
                title="Reiniciar"
              >
                <RotateCcw className="size-4" />
                Reiniciar
              </Button>
            </div>
          )}

          <div className="flex w-full max-w-sm flex-wrap justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 sm:h-11 flex-1 min-w-[100px] text-xs sm:text-sm font-medium"
              onClick={onSkipStage}
              aria-label="Pular fase atual"
              title="Avançar para a próxima fase"
            >
              <SkipForward className="size-4" />
              Pular Fase
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 sm:h-11 flex-1 min-w-[100px] text-xs sm:text-sm font-medium"
              onClick={onResetCycles}
              aria-label="Reiniciar ciclo"
              title="Reiniciar contagem de ciclos"
            >
              <RotateCcw className="size-4" />
              Reiniciar Ciclo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 sm:h-11 flex-1 min-w-[100px] text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={onEndSession}
              aria-label="Encerrar sessão ativa"
              title="Encerrar sessão"
            >
              <Square className="size-4" />
              Encerrar
            </Button>
          </div>
        </div>

        <Separator className="w-full max-w-sm" />

        {/* Seletor de preset ativo e atalho para o Dialog */}
        <div className="flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <TimerIcon className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Preset de estudo</span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={activePresetId} onValueChange={onSelectActivePreset}>
              <SelectTrigger
                className="h-9 w-40"
                aria-label="Selecionar preset do timer"
              >
                <SelectValue placeholder="Escolha um preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.focusMinutes}m / {p.shortBreakMinutes}m · {p.cyclesBeforeLongBreak} ciclos
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Pressione{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Espaço
          </kbd>{" "}
          para iniciar ou pausar · o ciclo reinicia após{" "}
          {timer.preset.cyclesBeforeLongBreak} pomodoros
        </p>
      </CardContent>
    </Card>
  );
}
