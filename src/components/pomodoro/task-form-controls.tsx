import { Check, Flag } from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATES,
  type TaskPriority,
  type TaskState,
} from "@/types/domain";

export const STATE_DISPLAY_LABELS: Record<TaskState, string> = {
  backlog: "Backlog",
  "a fazer": "A Fazer",
  "em execução": "Em Execução",
  "concluída": "Concluída",
  "cancelada": "Cancelada",
};

export const PRIORITY_DISPLAY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  média: "Média",
  alta: "Alta",
};

interface TaskStateSelectorProps {
  value: TaskState;
  onChange: (state: TaskState) => void;
  error?: string[];
}

export function TaskStateSelector({ value, onChange, error }: TaskStateSelectorProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Estado
      </span>
      <div className="grid grid-cols-2 gap-2">
        {TASK_STATES.map((s) => {
          const isSelected = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
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
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.join(" ")}
        </p>
      )}
    </div>
  );
}

interface TaskPrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  error?: string[];
}

export function TaskPrioritySelector({
  value,
  onChange,
  error,
}: TaskPrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Prioridade
      </span>
      <div className="grid grid-cols-3 gap-2">
        {TASK_PRIORITIES.map((p) => {
          const isSelected = value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
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
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error.join(" ")}
        </p>
      )}
    </div>
  );
}

