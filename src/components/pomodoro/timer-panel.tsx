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
  const activePreset = presets.find((p) => p.id === activePresetId) ?? timer.preset;

  return (
    <Card className="h-full gap-6 px-4 py-8 sm:px-8 flex flex-col justify-between shadow-xl">
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
          onReset={onReset}
        />

        {/* Detalhes de status e ciclos */}
        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Ciclos de foco concluídos: {timer.completedCycles}</span>
          </p>
          {timer.endsAt && timer.phase === "running" && (
            <p className="text-[11px] opacity-80">
              Fim previsto: {new Date(timer.endsAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <Separator className="w-full max-w-sm" />

        {/* Seletor de preset ativo com visual moderno em card pill */}
        <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-border/70 bg-neutral-50/70 dark:bg-neutral-900/60 p-2.5 sm:px-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200/60 dark:bg-neutral-800 text-foreground">
              <TimerIcon className="size-4" aria-hidden />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Preset de estudo
              </span>
              <span className="text-xs text-muted-foreground/80 truncate">
                {activePreset
                  ? `${activePreset.focusMinutes}m · ${activePreset.shortBreakMinutes}m · ${activePreset.cyclesBeforeLongBreak} ciclos`
                  : "Selecione o ritmo"}
              </span>
            </div>
          </div>

          <Select value={activePresetId} onValueChange={onSelectActivePreset}>
            <SelectTrigger
              className="h-9 min-w-32 max-w-44 rounded-xl border-border/80 bg-background font-semibold text-xs text-foreground shadow-xs hover:bg-accent transition-colors"
              aria-label="Selecionar preset do timer"
            >
              <span className="truncate">{activePreset?.name ?? "Escolha um preset"}</span>
            </SelectTrigger>
            <SelectContent align="end" className="rounded-2xl border-border/80 p-1.5 shadow-xl">
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id} className="rounded-xl py-2">
                  <div className="flex flex-col text-left gap-0.5">
                    <span className="font-semibold text-xs text-foreground truncate">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.focusMinutes}m foco · {p.shortBreakMinutes}m pausa · {p.cyclesBeforeLongBreak} ciclos
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
