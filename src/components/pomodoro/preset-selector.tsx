import { Check, Pencil, Plus, Trash, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimerPreset } from "@/types/domain";

interface PresetSelectorProps {
  presets: TimerPreset[];
  activePresetId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (preset: TimerPreset) => void;
  onDelete: (preset: TimerPreset) => void;
}

export function PresetSelector({
  presets,
  activePresetId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const activePreset = presets.find((preset) => preset.id === activePresetId);

  if (presets.length === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full rounded-xl text-xs font-semibold sm:w-auto"
        onClick={onCreate}
      >
        <Plus className="size-3.5" /> Criar
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-full min-w-32 max-w-full justify-between rounded-xl border-neutral-300/80 bg-white px-3 text-xs font-semibold text-neutral-900 shadow-xs transition-colors hover:bg-neutral-50 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-750 sm:h-9 sm:w-auto sm:max-w-52"
          aria-label="Selecionar preset do timer"
        >
          <span className="truncate">{activePreset?.name ?? "Escolha um preset"}</span>
          <ChevronDown className="ml-2 size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-1.5">
        <div className="space-y-1" role="menu" aria-label="Presets de estudo">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <div
                key={preset.id}
                className="flex items-center gap-1 rounded-xl px-1 py-1 transition-colors hover:bg-accent"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    onSelect(preset.id);
                    setOpen(false);
                  }}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {isActive && <Check className="size-3.5 text-primary" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {preset.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {preset.focusMinutes}m foco · {preset.shortBreakMinutes}m pausa · {preset.cyclesBeforeLongBreak} ciclos
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Editar ${preset.name}`}
                  title="Editar preset"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    onEdit(preset);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Excluir ${preset.name}`}
                  title="Excluir preset"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    onDelete(preset);
                  }}
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            setOpen(false);
            onCreate();
          }}
        >
          <Plus className="size-4" /> Criar novo preset
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
