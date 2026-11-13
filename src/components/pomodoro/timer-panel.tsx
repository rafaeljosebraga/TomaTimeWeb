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
import { Separator } from "@/components/ui/separator";
import {
  STAGE_DISPLAY_NAMES,
  type PresetValidationErrors,
  type SessionStage,
  type SessionTimer,
  type TimerPreset,
} from "@/types/domain";
import {
  formatTime,
  getRemainingSeconds,
} from "@/lib/domain/session-timer";
import { CircularTimer } from "./circular-timer";
import { PresetSelector } from "./preset-selector";

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
  onCreatePreset: () => void;
  onFormDataChange: (data: PresetFormData) => void;
  onSavePreset: (e: React.FormEvent) => void;
  onStartEdit: (preset: TimerPreset) => void;
  onCancelEdit: () => void;
  onRequestDeletePreset: (preset: TimerPreset) => void;
}

const STAGES: { stage: SessionStage; label: string }[] = [
  { stage: "TF", label: STAGE_DISPLAY_NAMES.TF },
  { stage: "TPC", label: STAGE_DISPLAY_NAMES.TPC },
  { stage: "TPL", label: STAGE_DISPLAY_NAMES.TPL },
];

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
  onCreatePreset,
  onFormDataChange,
  onSavePreset,
  onStartEdit,
  onCancelEdit,
  onRequestDeletePreset,
}: TimerPanelProps) {
  const hasNoPresets = presets.length === 0;
  const remainingSecs = getRemainingSeconds(timer);
  const remainingFormatted = hasNoPresets ? "--:--" : formatTime(remainingSecs);
  const totalDurationMs = timer.durationMs > 0 ? timer.durationMs : 1;
  const progress = hasNoPresets ? 0 : 1 - timer.remainingMs / totalDurationMs;
  const activePreset = presets.find((p) => p.id === activePresetId) ?? timer.preset;

  return (
    <Card className="h-full gap-4 sm:gap-5 px-2 py-4 sm:px-8 sm:py-6 flex flex-col justify-between shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] dark:border-border/80">
      {/* Seletor visual de fases */}
      <CardHeader className="flex flex-row justify-center px-0 pb-0 pt-0 w-full overflow-hidden">
        <div
          role="tablist"
          aria-label="Fase do temporizador"
          className="flex w-auto max-w-full items-center gap-1 rounded-full border border-neutral-200/60 bg-neutral-100/90 p-1 dark:border-neutral-800 dark:bg-neutral-900/80 overflow-x-auto custom-scrollbar-h scroll-smooth"
        >
          {STAGES.map((s) => {
            const isCurrent = !hasNoPresets && timer.stage === s.stage;
            return (
              <span
                key={s.stage}
                role="tab"
                aria-selected={isCurrent}
                className={`whitespace-nowrap shrink-0 rounded-full py-1 sm:py-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-50 font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 sm:gap-5 px-0 pt-0 sm:pt-1">
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
          hasNoPresets={hasNoPresets}
        />

        {/* Detalhes de status e ciclos (linha estática para não haver salto de layout) */}
        <div className="flex min-h-6 flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-center text-xs sm:text-sm text-muted-foreground pb-1">
          <p className="flex items-center gap-1 font-medium text-foreground text-[11px] sm:text-xs whitespace-nowrap">
            <span>Ciclos de foco concluídos: {timer.completedCycles}</span>
          </p>
          <span className="text-muted-foreground/40 font-bold hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-neutral-200/80 bg-neutral-100 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-neutral-800 shadow-2xs dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-100 transition-colors whitespace-nowrap">
            <TimerIcon className="size-3 sm:size-3.5 text-neutral-600 dark:text-neutral-300" />
            {hasNoPresets
              ? "Sem preset"
              : timer.phase === "running" && timer.endsAt
              ? `Fim às ${new Date(timer.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : timer.phase === "paused"
              ? "Pausado"
              : "Pronto"}
          </span>
        </div>

        <Separator className="w-full max-w-md" />

        {/* Seletor de preset ativo com visual moderno em card pill */}
        <div className="flex w-full max-w-md flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-100/90 dark:border-neutral-800 dark:bg-neutral-900/90 p-2.5 sm:px-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200/90 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-2xs transition-colors">
              <TimerIcon className="size-3.5 sm:size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                Preset de estudo
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {activePreset
                  ? `${activePreset.focusMinutes}m · ${activePreset.shortBreakMinutes}m · ${activePreset.cyclesBeforeLongBreak} ciclos`
                  : "Selecione o ritmo"}
              </span>
            </div>
          </div>

          <PresetSelector
            presets={presets}
            activePresetId={activePresetId}
            onSelect={onSelectActivePreset}
            onCreate={onCreatePreset}
            onEdit={onStartEdit}
            onDelete={onRequestDeletePreset}
          />
        </div>
      </CardContent>
    </Card>
  );
}
