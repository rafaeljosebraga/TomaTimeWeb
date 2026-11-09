// src/lib/domain/tasks-ordering.ts
// Lógica pura para ordenação determinística do painel de tarefas.
import type { Task, TaskPriority, TaskState } from "@/types/domain";

// Pesos para prioridade em ordem decrescente (alta > média > baixa)
export const PRIORITY_SORT_WEIGHT: Record<TaskPriority, number> = {
  alta: 1,
  média: 2,
  baixa: 3,
};

// Pesos para estados conforme regra de negócio:
// a fazer -> em execução -> concluída -> cancelada -> backlog
export const STATE_SORT_WEIGHT_DEFAULT: Record<TaskState, number> = {
  "a fazer": 1,
  "em execução": 2,
  "concluída": 3,
  "cancelada": 4,
  "backlog": 5,
};

// Pesos para estados alternativos:
// backlog -> a fazer -> em execução -> concluída -> cancelada
export const STATE_SORT_WEIGHT_ALTERNATIVE: Record<TaskState, number> = {
  "backlog": 1,
  "a fazer": 2,
  "em execução": 3,
  "concluída": 4,
  "cancelada": 5,
};

export function sortTasks(
  tasks: Task[],
  stateWeights: Record<TaskState, number> = STATE_SORT_WEIGHT_DEFAULT,
): Task[] {
  return [...tasks].sort((a, b) => {
    // 1º Critério: Prioridade decrescente (alta > média > baixa)
    const priorityDiff =
      PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // 2º Critério: Estado na sequência configurada
    const stateDiff = stateWeights[a.state] - stateWeights[b.state];
    if (stateDiff !== 0) {
      return stateDiff;
    }

    // 3º Critério de desempate: Data de criação (mais recente primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
