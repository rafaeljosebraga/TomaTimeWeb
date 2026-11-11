import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Task,
  TaskPriority,
  TaskState,
} from "@/types/domain";
import { sortTasks } from "@/lib/domain/tasks-ordering";
import { TaskItem } from "./task-item";

interface TaskPanelProps {
  tasks: Task[];
  onOpenCreateDialog: () => void;
  onEditTask: (task: Task) => void;
  onRequestDeleteTask: (task: Task) => void;
  onQuickChangeState: (id: string, state: TaskState) => void;
  onQuickChangePriority: (id: string, priority: TaskPriority) => void;
  onUpdateTaskTitle?: (id: string, title: string) => void;
  onClose?: () => void;
}

export function TaskPanel({
  tasks,
  onOpenCreateDialog,
  onEditTask,
  onRequestDeleteTask,
  onQuickChangeState,
  onQuickChangePriority,
  onUpdateTaskTitle,
  onClose,
}: TaskPanelProps) {
  const pendingCount = tasks.filter(
    (t) => t.state !== "concluída" && t.state !== "cancelada"
  ).length;
  const doneCount = tasks.filter((t) => t.state === "concluída").length;
  const sortedTasks = sortTasks(tasks);

  return (
    <Card className="flex flex-col h-full border-0 lg:border border-border bg-transparent lg:bg-card shadow-none lg:shadow-xl dark:lg:shadow-[0_20px_50px_rgba(0,0,0,0.7)] dark:border-border/80 justify-between px-2 sm:px-6 pt-5 pb-1 sm:pt-6 sm:pb-1.5">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-0 pb-3 shrink-0">
        <div className="space-y-0.5 min-w-0 pr-1">
          <CardTitle className="text-base sm:text-lg font-bold tracking-tight truncate">Tarefas de Estudo</CardTitle>
          <CardDescription className="text-xs truncate">
            {tasks.length === 0
              ? "Organize o que você precisa estudar"
              : `${pendingCount} pendente${pendingCount === 1 ? "" : "s"} · ${doneCount} concluída${doneCount === 1 ? "" : "s"}`}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="h-9 gap-1.5 px-3.5 text-xs font-semibold rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm"
            onClick={onOpenCreateDialog}
          >
            <Plus className="size-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col p-0 pb-0">
        {tasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border px-6 py-12 text-center bg-card/40">
            <ClipboardList className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">Nenhuma tarefa ainda</p>
            <p className="max-w-64 text-xs text-muted-foreground">
              Adicione sua primeira tarefa de estudo para acompanhar seu progresso nos ciclos de foco.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs rounded-full"
              onClick={onOpenCreateDialog}
            >
              <Plus className="size-3.5" /> Adicionar tarefa
            </Button>
          </div>
        ) : (
          <ul className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1.5 pb-2 custom-scrollbar max-h-[60vh] lg:max-h-[500px]">
            {sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onRequestDeleteTask={onRequestDeleteTask}
                onQuickChangeState={onQuickChangeState}
                onQuickChangePriority={onQuickChangePriority}
                onUpdateTitle={onUpdateTaskTitle}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
