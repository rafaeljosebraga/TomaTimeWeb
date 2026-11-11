import { Edit2, MoreVertical, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
}

export function TaskItem({
  task,
  onEditTask,
  onRequestDeleteTask,
  onQuickChangeState,
  onQuickChangePriority,
}: TaskItemProps) {
  const isDone = task.state === "concluída";

  const handleToggleCompleted = () => {
    onQuickChangeState(task.id, isDone ? "a fazer" : "concluída");
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
              aria-label={`Ações para tarefa ${task.title}`}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Alterar Estado</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={task.state}
              onValueChange={(val) =>
                onQuickChangeState(task.id, val as TaskState)
              }
            >
              {TASK_STATES.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {STATE_DISPLAY_LABELS[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Prioridade</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={task.priority}
                  onValueChange={(val) =>
                    onQuickChangePriority(task.id, val as TaskPriority)
                  }
                >
                  {TASK_PRIORITIES.map((p) => (
                    <DropdownMenuRadioItem key={p} value={p}>
                      {PRIORITY_DISPLAY_LABELS[p]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {isDone ? (
              <DropdownMenuItem onClick={() => onQuickChangeState(task.id, "a fazer")}>
                <RotateCcw className="size-4" /> Reabrir tarefa
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onQuickChangeState(task.id, "concluída")}>
                <CheckCircle2 className="size-4" /> Marcar como concluída
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onEditTask(task)}>
              <Edit2 className="size-4" /> Editar tarefa
            </DropdownMenuItem>

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRequestDeleteTask(task)}
            >
              <Trash2 className="size-4" /> Excluir tarefa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
