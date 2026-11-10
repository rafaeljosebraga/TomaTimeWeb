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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTaskId ? "Editar Tarefa de Estudo" : "Nova Tarefa de Estudo"}
          </DialogTitle>
          <DialogDescription>
            {editingTaskId
              ? "Atualize as informações e prioridade da tarefa."
              : "Cadastre uma disciplina, leitura ou exercício para acompanhar no seu foco."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título da tarefa (1 a 100 caracteres)</Label>
            <Input
              id="task-title"
              placeholder="Ex.: Revisar capítulos 3 e 4 de Cálculo"
              value={formData.title}
              maxLength={100}
              autoFocus
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-state">Estado</Label>
              <Select
                value={formData.state}
                onValueChange={(val) =>
                  onFormDataChange({ ...formData, state: val as TaskState })
                }
              >
                <SelectTrigger id="task-state">
                  <SelectValue placeholder="Escolha o estado" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATE_DISPLAY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.state && (
                <p role="alert" className="text-xs text-destructive">
                  {formErrors.state.join(" ")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) =>
                  onFormDataChange({ ...formData, priority: val as TaskPriority })
                }
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Escolha a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_DISPLAY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.priority && (
                <p role="alert" className="text-xs text-destructive">
                  {formErrors.priority.join(" ")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              {editingTaskId ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
