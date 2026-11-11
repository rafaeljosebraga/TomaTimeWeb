import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Edit2,
  MoreVertical,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Flag,
  CircleDot,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  TASK_PRIORITIES,
  TASK_STATES,
  type Task,
  type TaskPriority,
  type TaskState,
} from "@/types/domain";
import { PriorityBadge, StatusBadge } from "./badges";

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

interface TaskItemProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onRequestDeleteTask: (task: Task) => void;
  onQuickChangeState: (id: string, state: TaskState) => void;
  onQuickChangePriority: (id: string, priority: TaskPriority) => void;
  onUpdateTitle?: (id: string, title: string) => void;
}

export function TaskItem({
  task,
  onEditTask,
  onRequestDeleteTask,
  onQuickChangeState,
  onQuickChangePriority,
  onUpdateTitle,
}: TaskItemProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(task.title);
  const [stateDraft, setStateDraft] = React.useState<TaskState>(task.state);
  const [priorityDraft, setPriorityDraft] = React.useState<TaskPriority>(task.priority);
  const isDone = task.state === "concluída";

  // Sincroniza os estados quando a tarefa externa mudar ou o modal abrir
  React.useEffect(() => {
    setTitleDraft(task.title);
    setStateDraft(task.state);
    setPriorityDraft(task.priority);
  }, [task.title, task.state, task.priority, isMobileSheetOpen]);

  const handleSaveChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = titleDraft.trim();
    if (cleanTitle && cleanTitle.length <= 100 && cleanTitle !== task.title) {
      if (onUpdateTitle) {
        onUpdateTitle(task.id, cleanTitle);
      }
    }
    if (stateDraft !== task.state) {
      onQuickChangeState(task.id, stateDraft);
    }
    if (priorityDraft !== task.priority) {
      onQuickChangePriority(task.id, priorityDraft);
    }
    setIsMobileSheetOpen(false);
  };

  const handleToggleCompleted = () => {
    onQuickChangeState(task.id, isDone ? "a fazer" : "concluída");
  };

  const handleMobileAction = (action: () => void) => {
    setIsMobileSheetOpen(false);
    action();
  };

  return (
    <li
      className={`group flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
        task.state === "em execução"
          ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
          : isDone
          ? "border-border/70 bg-neutral-100/80 text-muted-foreground dark:bg-neutral-900/60 dark:border-neutral-800 opacity-80"
          : "border-border/80 bg-neutral-50/90 hover:bg-neutral-100/90 dark:bg-neutral-900/90 dark:hover:bg-neutral-900 dark:border-neutral-800 text-foreground"
      }`}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={handleToggleCompleted}
        aria-label={
          isDone
            ? `Reabrir tarefa ${task.title}`
            : `Marcar tarefa ${task.title} como concluída`
        }
        className="mt-0.5 size-5 rounded-md border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-neutral-900 data-[state=checked]:text-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-neutral-900"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm sm:text-base font-semibold leading-snug break-words ${
            isDone ? "text-muted-foreground line-through opacity-70" : "text-neutral-900 dark:text-neutral-50"
          }`}
          title={task.title}
        >
          {task.title}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <StatusBadge state={task.state} pulse={task.state === "em execução"} />
          <PriorityBadge priority={task.priority} />
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            {new Date(task.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
          aria-label={`Ações para tarefa ${task.title}`}
          onClick={() => setIsMobileSheetOpen(true)}
        >
          <MoreVertical className="size-4" />
        </Button>

        <Dialog open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <DialogContent
            className="p-6 gap-5 sm:max-w-md"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Título da tarefa
                </span>
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  maxLength={100}
                  placeholder="Nome da tarefa..."
                  className="h-11 rounded-xl bg-muted/40 font-medium text-base text-foreground focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
                />
              </div>

              {/* Seletor de Estado em Pills/Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_STATES.map((s) => {
                    const isSelected = stateDraft === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStateDraft(s)}
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
              </div>

              {/* Seletor de Prioridade em Pills */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prioridade
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {TASK_PRIORITIES.map((p) => {
                    const isSelected = priorityDraft === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriorityDraft(p)}
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
              </div>

              {/* Ações Rápidas */}
              <div className="space-y-1.5 border-t border-border/70 pt-3">
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full justify-start rounded-xl text-sm font-medium h-10 gap-2.5"
                  onClick={() => onRequestDeleteTask(task)}
                >
                  <Trash2 className="size-4" /> Excluir tarefa
                </Button>

                {isDone ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl text-sm font-medium h-10 gap-2.5"
                    onClick={() =>
                      handleMobileAction(() => onQuickChangeState(task.id, "a fazer"))
                    }
                  >
                    <RotateCcw className="size-4" /> Reabrir tarefa
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl text-sm font-medium h-10 gap-2.5"
                    onClick={() =>
                      handleMobileAction(() => onQuickChangeState(task.id, "concluída"))
                    }
                  >
                    <CheckCircle2 className="size-4 text-emerald-500" /> Marcar como concluída
                  </Button>
                )}
              </div>

              {/* Botão de Salvar Alterações Fixo e Sempre Presente */}
              <div className="pt-2 flex flex-col sm:flex-row-reverse sm:justify-start gap-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto flex-1 justify-center gap-2 whitespace-nowrap text-sm transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 h-11 rounded-full font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-md"
                >
                  Salvar Alterações
                </Button>
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto h-11 rounded-full font-medium"
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    Cancelar
                  </Button>
                </DialogPrimitive.Close>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
}
