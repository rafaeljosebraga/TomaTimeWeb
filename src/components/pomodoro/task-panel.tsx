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
}

export function TaskPanel({
  tasks,
  onOpenCreateDialog,
  onEditTask,
  onRequestDeleteTask,
  onQuickChangeState,
  onQuickChangePriority,
}: TaskPanelProps) {
  const pendingCount = tasks.filter(
    (t) => t.state !== "concluída" && t.state !== "cancelada"
  ).length;
  const doneCount = tasks.filter((t) => t.state === "concluída").length;
  const sortedTasks = sortTasks(tasks);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Tarefas de Estudo</CardTitle>
          <CardDescription className="text-xs">
            {tasks.length === 0
              ? "Organize o que você precisa estudar"
              : `${pendingCount} pendente${pendingCount === 1 ? "" : "s"} · ${doneCount} concluída${doneCount === 1 ? "" : "s"}`}
          </CardDescription>
        </div>

        <Button
          size="sm"
          className="h-9 gap-1.5 shrink-0"
          onClick={onOpenCreateDialog}
        >
          <Plus className="size-4" />
          <span>Nova Tarefa</span>
        </Button>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <ClipboardList className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">Nenhuma tarefa ainda</p>
            <p className="max-w-64 text-xs text-muted-foreground">
              Adicione sua primeira tarefa de estudo para acompanhar seu progresso nos ciclos de foco.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={onOpenCreateDialog}
            >
              <Plus className="size-3.5" /> Adicionar tarefa
            </Button>
          </div>
        ) : (
          <ul className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onRequestDeleteTask={onRequestDeleteTask}
                onQuickChangeState={onQuickChangeState}
                onQuickChangePriority={onQuickChangePriority}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
