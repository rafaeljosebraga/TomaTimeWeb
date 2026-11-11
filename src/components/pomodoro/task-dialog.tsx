import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TASK_PRIORITIES,
  TASK_STATES,
  type TaskPriority,
  type TaskState,
  type TaskValidationErrors,
} from "@/types/domain";

type TaskFormData = {
  title: string;
  state: TaskState;
  priority: TaskPriority;
};

const STATE_DISPLAY_LABELS: Record<TaskState, string> = {
  backlog: "Backlog",
  "a fazer": "A Fazer",
  "em execução": "Em Execução",
  "concluída": "Concluída",
  "cancelada": "Cancelada",
};

const PRIORITY_DISPLAY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  média: "Média",
  alta: "Alta",
};

interface TaskDialogProps {
  open: boolean;
  editingTaskId: string | null;
  formData: TaskFormData;
  formErrors: TaskValidationErrors;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: TaskFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function TaskDialog({
  open,
  editingTaskId,
  formData,
  formErrors,
  onOpenChange,
  onFormDataChange,
  onSubmit,
  onCancel,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <DialogTitle className="text-lg font-bold text-foreground">
            {editingTaskId ? "Editar Tarefa de Estudo" : "Nova Tarefa de Estudo"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {editingTaskId
              ? "Atualize as informações e prioridade da tarefa."
              : "Cadastre uma disciplina, leitura ou exercício para acompanhar no seu foco."}
          </DialogDescription>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título da tarefa
            </span>
            <Input
              id="task-title"
              placeholder="Ex.: Revisar capítulos 3 e 4 de Cálculo"
              value={formData.title}
              maxLength={100}
              className="h-11 rounded-xl bg-muted/40 font-medium text-base text-foreground focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
              onChange={(e) =>
                onFormDataChange({ ...formData, title: e.target.value })
              }
            />
            {formErrors.title && (
              <p role="alert" className="text-xs text-destructive">
                {formErrors.title.join(" ")}
              </p>
            )}
          </div>

          {/* Seletor de Estado em Pills Modernas */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estado
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TASK_STATES.map((s) => {
                const isSelected = formData.state === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onFormDataChange({ ...formData, state: s })}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                        : "bg-muted/70 text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="capitalize">{STATE_DISPLAY_LABELS[s]}</span>
                    {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
            {formErrors.state && (
              <p role="alert" className="text-xs text-destructive">
                {formErrors.state.join(" ")}
              </p>
            )}
          </div>

          {/* Seletor de Prioridade em Pills Modernas */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prioridade
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TASK_PRIORITIES.map((p) => {
                const isSelected = formData.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onFormDataChange({ ...formData, priority: p })}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                        : "bg-muted/70 text-foreground hover:bg-muted"
                    }`}
                  >
                    <Flag className="size-3" />
                    <span>{PRIORITY_DISPLAY_LABELS[p]}</span>
                  </button>
                );
              })}
            </div>
            {formErrors.priority && (
              <p role="alert" className="text-xs text-destructive">
                {formErrors.priority.join(" ")}
              </p>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2 flex-col sm:flex-row-reverse sm:justify-start">
            <Button
              type="submit"
              disabled={!formData.title.trim()}
              className="w-full sm:w-auto h-11 rounded-full font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-md"
            >
              {editingTaskId ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-11 rounded-full font-medium"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            </DialogPrimitive.Close>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
