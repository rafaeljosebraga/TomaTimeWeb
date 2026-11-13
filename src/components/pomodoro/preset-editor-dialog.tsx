import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PresetValidationErrors } from "@/types/domain";

export type PresetFormData = {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
};

interface PresetEditorDialogProps {
  open: boolean;
  editingId: string | null;
  formData: PresetFormData;
  formErrors: PresetValidationErrors;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: PresetFormData) => void;
  onSave: (event: React.FormEvent) => void;
  onCancel: () => void;
}

export function PresetEditorDialog({
  open,
  editingId,
  formData,
  formErrors,
  onOpenChange,
  onFormDataChange,
  onSave,
  onCancel,
}: PresetEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-lg font-bold text-foreground">
            {editingId ? "Editar Preset" : "Criar Preset"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Configure o tempo de foco, pausas e ciclos do seu ritmo de estudo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4">
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
              onChange={(event) =>
                onFormDataChange({ ...formData, name: event.target.value })
              }
            />
            {formErrors.name && (
              <p role="alert" className="text-xs text-destructive">
                {formErrors.name.join(" ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PresetNumberField
              id="preset-focus"
              label="Foco (min)"
              min={1}
              max={120}
              value={formData.focusMinutes}
              error={formErrors.focusMinutes}
              onChange={(value) => onFormDataChange({ ...formData, focusMinutes: value })}
            />
            <PresetNumberField
              id="preset-short-break"
              label="Pausa curta"
              min={1}
              max={60}
              value={formData.shortBreakMinutes}
              error={formErrors.shortBreakMinutes}
              onChange={(value) => onFormDataChange({ ...formData, shortBreakMinutes: value })}
            />
            <PresetNumberField
              id="preset-cycles"
              label="Ciclos p/ longa"
              min={1}
              max={12}
              value={formData.cyclesBeforeLongBreak}
              error={formErrors.cyclesBeforeLongBreak}
              onChange={(value) => onFormDataChange({ ...formData, cyclesBeforeLongBreak: value })}
            />
            <PresetNumberField
              id="preset-long-break"
              label="Pausa longa"
              min={1}
              max={60}
              value={formData.longBreakMinutes}
              error={formErrors.longBreakMinutes}
              onChange={(value) => onFormDataChange({ ...formData, longBreakMinutes: value })}
            />
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2 pt-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-full px-5 font-medium sm:w-auto"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-10 w-full rounded-full bg-neutral-900 px-5 font-semibold text-white shadow-md hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 sm:w-auto"
            >
              {editingId ? "Salvar Alterações" : "Criar Preset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PresetNumberFieldProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  error?: string[];
  onChange: (value: number) => void;
}

function PresetNumberField({
  id,
  label,
  min,
  max,
  value,
  error,
  onChange,
}: PresetNumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        className="h-10 rounded-xl bg-background text-center font-medium"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {error && (
        <p role="alert" className="text-[11px] text-destructive">
          {error.join(" ")}
        </p>
      )}
    </div>
  );
}
