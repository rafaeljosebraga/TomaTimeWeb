import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority, TaskState } from "@/types/domain";

const STATE_LABELS: Record<TaskState, string> = {
  backlog: "Backlog",
  "a fazer": "A Fazer",
  "em execução": "Em Execução",
  "concluída": "Concluída",
  "cancelada": "Cancelada",
};

const STATE_CLASSES: Record<TaskState, string> = {
  backlog: "border-border text-muted-foreground bg-muted/30",
  "a fazer":
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "em execução":
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "concluída":
    "border-zinc-800 bg-zinc-800 text-zinc-50 dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900",
  "cancelada":
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 line-through opacity-80",
};

const STATE_DOT: Record<TaskState, string> = {
  backlog: "bg-zinc-400",
  "a fazer": "bg-amber-500",
  "em execução": "bg-emerald-500",
  "concluída": "",
  "cancelada": "",
};

export function StatusBadge({
  state,
  pulse = false,
}: {
  state: TaskState;
  pulse?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={`h-6 gap-1.5 rounded-full px-2.5 text-[11px] font-medium ${STATE_CLASSES[state]}`}
    >
      {state === "concluída" ? (
        <Check className="size-3 stroke-[3]" />
      ) : state === "cancelada" ? (
        <X className="size-3 stroke-[3]" />
      ) : (
        <span
          aria-hidden
          className={`size-1.5 rounded-full ${STATE_DOT[state]} ${
            pulse && state === "em execução" ? "animate-pulse" : ""
          }`}
        />
      )}
      {STATE_LABELS[state]}
    </Badge>
  );
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  alta: "Alta",
  média: "Média",
  baixa: "Baixa",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  alta: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  média:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  baixa: "border-border text-muted-foreground bg-muted/20",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="outline"
      className={`h-6 gap-1 rounded-full px-2.5 text-[11px] font-medium ${PRIORITY_CLASSES[priority]}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" x2="4" y1="22" y2="15" />
      </svg>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
