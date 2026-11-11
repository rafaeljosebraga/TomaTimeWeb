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
  backlog:
    "border-neutral-300 bg-neutral-200/60 text-neutral-800 dark:border-neutral-700/80 dark:bg-neutral-800/90 dark:text-neutral-200",
  "a fazer":
    "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 dark:bg-amber-500/25 dark:border-amber-500/50",
  "em execução":
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 dark:bg-emerald-500/25 dark:border-emerald-500/50",
  "concluída":
    "border-neutral-800 bg-neutral-800 text-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 font-medium",
  "cancelada":
    "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300 dark:bg-red-500/25 dark:border-red-500/50 line-through opacity-85",
};

const STATE_DOT: Record<TaskState, string> = {
  backlog: "bg-neutral-500 dark:bg-neutral-400",
  "a fazer": "bg-amber-600 dark:bg-amber-400",
  "em execução": "bg-emerald-600 dark:bg-emerald-400",
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
  alta: "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-200 dark:bg-red-500/25 dark:border-red-500/50 font-medium",
  média:
    "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 dark:bg-amber-500/25 dark:border-amber-500/50 font-medium",
  baixa:
    "border-neutral-300 bg-neutral-200/60 text-neutral-800 dark:border-neutral-700/80 dark:bg-neutral-800/90 dark:text-neutral-300",
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
