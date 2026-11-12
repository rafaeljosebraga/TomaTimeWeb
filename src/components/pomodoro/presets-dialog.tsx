import { useState } from "react";
import { Sliders, Plus, Pencil, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { PresetValidationErrors, TimerPreset } from "@/types/domain";

type PresetFormData = {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
};

interface PresetsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  presets: TimerPreset[];
  activePresetId: string;
  formData: PresetFormData;
  editingId: string | null;
  formErrors: PresetValidationErrors;
  onFormDataChange: (data: PresetFormData) => void;
  onSavePreset: (e: React.FormEvent) => void;
  onSelectActivePreset: (id: string) => void;
  onStartEdit: (preset: TimerPreset) => void;
  onCancelEdit: () => void;
  onRequestDeletePreset: (preset: TimerPreset) => void;
}

export function PresetsDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  showTrigger = true,
  presets,
  activePresetId,
  formData,
  editingId,
  formErrors,
  onFormDataChange,
  onSavePreset,
  onSelectActivePreset,
  onStartEdit,
  onCancelEdit,
  onRequestDeletePreset,
}: PresetsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="Gerenciar presets de estudo"
            title="Gerenciar presets"
          >
            <Sliders className="size-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-lg font-bold text-foreground">
            Gerenciador de Presets
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Crie, edite ou alterne entre seus temporizadores personalizados.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de presets existentes */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Presets Salvos
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1.5 py-0.5">
            {presets.map((preset) => {
              const isActive = preset.id === activePresetId;
              const isBeingEdited = preset.id === editingId;
              return (
                <div
                  key={preset.id}
                  className={`flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl border text-sm transition-all ${
                    isActive
                      ? "border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20"
                      : "border-border bg-card/60 hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground truncate break-words max-w-full">
                        {preset.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                          <Check className="size-3" /> Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Foco: {preset.focusMinutes}m · Pausa curta: {preset.shortBreakMinutes}m · Meta: {preset.cyclesBeforeLongBreak} ciclos · Pausa longa: {preset.longBreakMinutes}m
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 sm:px-3 text-xs font-medium rounded-full shrink-0"
                        onClick={() => onSelectActivePreset(preset.id)}
                      >
                        Ativar
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 shrink-0 transition-colors"
                      title="Editar preset"
                      disabled={isBeingEdited}
                      onClick={() => onStartEdit(preset)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 shrink-0 transition-colors"
                      title="Excluir preset"
                      onClick={() => onRequestDeletePreset(preset)}
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Formulário de Criação / Edição */}
        <form onSubmit={onSavePreset} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {editingId ? "Editar Preset" : "Novo Preset"}
            </h4>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preset-name" className="text-xs font-medium text-foreground">
              Nome do preset (1 a 40 caracteres)
            </Label>
            <Input
              id="preset-name"
              type="text"
              placeholder="Ex: Estudos Intensivos"
              value={formData.name}
              maxLength={40}
              className="h-10 rounded-xl bg-background"
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
            />
            {formErrors.name && (
              <p role="alert" className="text-xs text-destructive">
                {formErrors.name.join(" ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset-focus" className="text-xs text-muted-foreground">
                Foco (min)
              </Label>
              <Input
                id="preset-focus"
                type="number"
                min={1}
                max={120}
                value={formData.focusMinutes}
                className="h-10 rounded-xl bg-background text-center font-medium"
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    focusMinutes: Number(e.target.value),
                  })
                }
              />
              {formErrors.focusMinutes && (
                <p role="alert" className="text-[11px] text-destructive">
                  {formErrors.focusMinutes.join(" ")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preset-short-break" className="text-xs text-muted-foreground">
                Pausa curta
              </Label>
              <Input
                id="preset-short-break"
                type="number"
                min={1}
                max={60}
                value={formData.shortBreakMinutes}
                className="h-10 rounded-xl bg-background text-center font-medium"
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    shortBreakMinutes: Number(e.target.value),
                  })
                }
              />
              {formErrors.shortBreakMinutes && (
                <p role="alert" className="text-[11px] text-destructive">
                  {formErrors.shortBreakMinutes.join(" ")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preset-cycles" className="text-xs text-muted-foreground">
                Ciclos p/ longa
              </Label>
              <Input
                id="preset-cycles"
                type="number"
                min={1}
                max={12}
                value={formData.cyclesBeforeLongBreak}
                className="h-10 rounded-xl bg-background text-center font-medium"
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    cyclesBeforeLongBreak: Number(e.target.value),
                  })
                }
              />
              {formErrors.cyclesBeforeLongBreak && (
                <p role="alert" className="text-[11px] text-destructive">
                  {formErrors.cyclesBeforeLongBreak.join(" ")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preset-long-break" className="text-xs text-muted-foreground">
                Pausa longa
              </Label>
              <Input
                id="preset-long-break"
                type="number"
                min={1}
                max={60}
                value={formData.longBreakMinutes}
                className="h-10 rounded-xl bg-background text-center font-medium"
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    longBreakMinutes: Number(e.target.value),
                  })
                }
              />
              {formErrors.longBreakMinutes && (
                <p role="alert" className="text-[11px] text-destructive">
                  {formErrors.longBreakMinutes.join(" ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-10 px-5 rounded-full font-medium"
              onClick={() => {
                if (editingId) {
                  onCancelEdit();
                } else {
                  onCancelEdit();
                  setIsOpen(false);
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto h-10 px-5 rounded-full font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-md whitespace-nowrap"
            >
              {editingId ? (
                "Salvar Alterações"
              ) : (
                <>
                  <Plus className="size-4 shrink-0" /> Cadastrar Preset
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
