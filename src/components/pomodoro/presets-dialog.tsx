import { useState } from "react";
import { Sliders, Plus, Edit2, Trash2, Check } from "lucide-react";
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
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciador de Presets</DialogTitle>
          <DialogDescription>
            Crie, edite ou alterne entre seus temporizadores personalizados.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de presets existentes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Presets Salvos</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {presets.map((preset) => {
              const isActive = preset.id === activePresetId;
              const isBeingEdited = preset.id === editingId;
              return (
                <div
                  key={preset.id}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:bg-accent/40"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{preset.name}</span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Check className="size-3" /> Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Foco: {preset.focusMinutes}m · Pausa curta: {preset.shortBreakMinutes}m · Meta: {preset.cyclesBeforeLongBreak} ciclos · Pausa longa: {preset.longBreakMinutes}m
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => onSelectActivePreset(preset.id)}
                      >
                        Ativar
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      title="Editar preset"
                      disabled={isBeingEdited}
                      onClick={() => onStartEdit(preset)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Excluir preset"
                      onClick={() => onRequestDeletePreset(preset)}
                    >
                      <Trash2 className="size-3.5" />
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
            <h4 className="text-sm font-semibold">
              {editingId ? "Editar Preset" : "Novo Preset"}
            </h4>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={onCancelEdit}
              >
                Cancelar Edição
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-name">Nome do preset (1 a 40 caracteres)</Label>
            <Input
              id="preset-name"
              type="text"
              placeholder="Ex: Estudos Intensivos"
              value={formData.name}
              maxLength={40}
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit">
              {editingId ? (
                "Salvar Alterações"
              ) : (
                <>
                  <Plus className="size-4" /> Cadastrar Preset
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
