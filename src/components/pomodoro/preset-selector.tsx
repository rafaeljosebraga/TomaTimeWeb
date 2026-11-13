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
          className="h-8 w-full min-w-32 max-w-full justify-between rounded-xl border-neutral-300/80 bg-white px-3 text-xs font-semibold text-neutral-900 shadow-xs transition-all duration-300 hover:bg-neutral-50 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-750 sm:h-9 sm:w-auto sm:max-w-52 active:scale-95"
          aria-label="Selecionar preset do timer"
        >
          <span key={activePresetId} className="truncate transition-opacity duration-300 animate-in fade-in-50">
            {activePreset?.name ?? "Escolha um preset"}
          </span>
          <ChevronDown
            className={`ml-2 size-3.5 shrink-0 opacity-60 transition-transform duration-300 ease-out ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={16}
        className="w-[calc(100vw-2.5rem)] sm:w-80 max-w-sm rounded-2xl p-1.5"
      >
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
                  className="group/preset-edit size-7 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-90"
                  aria-label={`Editar ${preset.name}`}
                  title="Editar preset"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    onEdit(preset);
                  }}
                >
                  <Pencil className="size-3.5 transition-transform duration-150 ease-out group-active/preset-edit:scale-90 group-active/preset-edit:-rotate-45" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="group/preset-del size-7 shrink-0 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors active:scale-90"
                  aria-label={`Excluir ${preset.name}`}
                  title="Excluir preset"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    onDelete(preset);
                  }}
                >
                  <Trash className="size-3.5 transition-transform duration-150 ease-out group-active/preset-del:scale-90 group-active/preset-del:rotate-12" />
                </Button>
              </div>
            );
          })}
        </div>
        <DropdownMenuSeparator className="my-1.5" />
        <div className="pt-0.5">
          <Button
            type="button"
            role="menuitem"
            variant="default"
            size="sm"
            className="group/create w-full justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            onClick={() => {
              setOpen(false);
              onCreate();
            }}
          >
            <Plus className="size-3.5 transition-transform duration-300 ease-out group-hover/create:rotate-90 group-active/create:scale-125" />
            <span>Criar novo preset</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
