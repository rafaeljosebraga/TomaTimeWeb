// src/App.tsx
"use client";

import { useEffect, useState } from "react";
import { Timer, AlertCircle, X } from "lucide-react";
import {
  type PresetValidationErrors,
  type SessionTimer,
  type Task,
  type TaskPriority,
  type TaskState,
  type TaskValidationErrors,
  type TimerPreset,
} from "@/types/domain";
import {
  createSessionTimer,
  endSessionTimer,
  pauseSessionTimer,
  resetCompletedCycles,
  resetSessionTimer,
  resumeSessionTimer,
  skipSessionStage,
  startSessionTimer,
  tickSessionTimer,
} from "@/lib/domain/session-timer";
import {
  createPreset,
  deletePreset,
  getActivePresetId,
  getPresetById,
  loadPresets,
  setActivePresetId,
  updatePreset,
} from "@/lib/storage/presets-storage";
import {
  clearSessionTimer,
  hasStoredActiveSession,
  loadSessionTimer,
  saveSessionTimer,
} from "@/lib/storage/session-storage";
import {
  createTask,
  deleteTask,
  loadTasks,
  updateTask,
} from "@/lib/storage/tasks-storage";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TimerPanel } from "@/components/pomodoro/timer-panel";
import { TaskPanel } from "@/components/pomodoro/task-panel";
import { TaskDialog } from "@/components/pomodoro/task-dialog";
import { DeleteDialog } from "@/components/pomodoro/delete-dialog";
import { ConfirmDialog, type ConfirmAction } from "@/components/pomodoro/confirm-dialog";

type PendingDelete = {
  type: "preset" | "task";
  id: string;
  name: string;
};

type PresetFormData = {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
};

const INITIAL_FORM_DATA: PresetFormData = {
  name: "",
  focusMinutes: 25,
  shortBreakMinutes: 5,
  cyclesBeforeLongBreak: 4,
  longBreakMinutes: 15,
};

type TaskFormData = {
  title: string;
  state: TaskState;
  priority: TaskPriority;
};

const INITIAL_TASK_FORM: TaskFormData = {
  title: "",
  state: "backlog",
  priority: "média",
};

const STAGE_LABELS: Record<string, string> = {
  TF: "Tempo de Foco (TF)",
  TPC: "Tempo de Pausa Curta (TPC)",
  TPL: "Tempo de Pausa Longa (TPL)",
};

export function App() {
  // 1. Estado de presets e seleção
  const [presets, setPresets] = useState<TimerPreset[]>(() => loadPresets());
  const [activePresetId, setActiveId] = useState<string>(() =>
    getActivePresetId()
  );

  // 2. Estado do temporizador de sessão
  const [isResumedSession, setIsResumedSession] = useState<boolean>(() =>
    hasStoredActiveSession()
  );

  const [timer, setTimer] = useState<SessionTimer>(() => {
    const active = getPresetById(getActivePresetId()) ?? loadPresets()[0]!;
    return loadSessionTimer(active);
  });

  // 3. Estado do formulário de criação/edição de preset
  const [formData, setFormData] = useState<PresetFormData>(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<PresetValidationErrors>({});
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  // 4. Estado de Tarefas (Tasks)
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(INITIAL_TASK_FORM);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormErrors, setTaskFormErrors] = useState<TaskValidationErrors>({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);

  // 5. Estado de confirmação explícita de exclusão
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  // 6. Estado de confirmação genérica
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmAction | null>(null);

  // Sincroniza o temporizador a cada segundo quando estiver rodando
  useEffect(() => {
    if (timer.phase !== "running") return;

    const intervalId = window.setInterval(() => {
      setTimer((prevTimer) => {
        const nextTimer = tickSessionTimer(prevTimer);
        saveSessionTimer(nextTimer);
        return nextTimer;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timer.phase]);

  // Atalho de teclado: barra de espaço para alternar Iniciar / Pausar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      if (timer.phase === "running") {
        handlePause();
      } else if (timer.phase === "paused") {
        handleResume();
      } else {
        handleStart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timer]);

  // Controles do timer
  function handleStart() {
    const updated = startSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handlePause() {
    const updated = pauseSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleResume() {
    const updated = resumeSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleReset() {
    const updated = resetSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleResetCycles() {
    setPendingConfirm({
      type: "resetCycles",
      title: "Reiniciar Ciclos",
      description: "Deseja realmente zerar a contagem de ciclos concluídos e retornar ao primeiro ciclo de foco?",
      confirmLabel: "Reiniciar Ciclos",
    });
  }

  function handleSkipStage() {
    const updated = skipSessionStage(timer);
    setTimer(updated);
    saveSessionTimer(updated);
    setGlobalMessage(`Fase pulada com sucesso. Próxima fase: ${STAGE_LABELS[updated.stage]}.`);
  }

  function handleEndSession() {
    setPendingConfirm({
      type: "endSession",
      title: "Encerrar Sessão",
      description: "Deseja realmente encerrar a sessão ativa? O progresso do temporizador será removido.",
      confirmLabel: "Encerrar Sessão",
      isDestructive: true,
    });
  }

  function handleDiscardResumedSession() {
    setPendingConfirm({
      type: "discardResumedSession",
      title: "Descartar Sessão Retomada",
      description: "Deseja descartar a sessão ativa retomada? Os dados em andamento serão apagados sem contabilização de progresso e o preset será liberado.",
      confirmLabel: "Descartar Sessão",
      isDestructive: true,
    });
  }

  function handleExecuteConfirmedAction() {
    if (!pendingConfirm) return;

    if (pendingConfirm.type === "resetCycles") {
      const updated = resetCompletedCycles(timer);
      setTimer(updated);
      saveSessionTimer(updated);
      setGlobalMessage("Contador de ciclos de foco concluídos foi zerado.");
    } else if (pendingConfirm.type === "endSession" || pendingConfirm.type === "discardResumedSession") {
      clearSessionTimer();
      setIsResumedSession(false);

      const currentStoredPreset =
        getPresetById(timer.preset.id) ??
        getPresetById(activePresetId) ??
        loadPresets()[0]!;

      const updated = endSessionTimer(timer, currentStoredPreset);
      setTimer(updated);

      if (pendingConfirm.type === "discardResumedSession") {
        setGlobalMessage("Sessão retomada foi descartada com sucesso.");
      } else {
        setGlobalMessage("Sessão ativa encerrada.");
      }
    }

    setPendingConfirm(null);
  }

  // Troca de preset ativo
  function handleSelectActivePreset(id: string) {
    const target = getPresetById(id);
    if (!target) return;

    setActivePresetId(id);
    setActiveId(id);

    const newTimer = createSessionTimer(target);
    setTimer(newTimer);
    saveSessionTimer(newTimer);
    setGlobalMessage(`Preset ativo alterado para: "${target.name}".`);
  }

  // Prepara formulário para editar um preset existente
  function handleStartEdit(preset: TimerPreset) {
    setEditingId(preset.id);
    setFormData({
      name: preset.name,
      focusMinutes: preset.focusMinutes,
      shortBreakMinutes: preset.shortBreakMinutes,
      cyclesBeforeLongBreak: preset.cyclesBeforeLongBreak,
      longBreakMinutes: preset.longBreakMinutes,
    });
    setFormErrors({});
    setGlobalMessage(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  }

  // Salvar formulário (criar novo ou atualizar existente)
  function handleSavePreset(event: React.FormEvent) {
    event.preventDefault();
    setFormErrors({});
    setGlobalMessage(null);

    if (editingId) {
      // Atualização
      const result = updatePreset(editingId, formData);
      if (!result.isValid) {
        setFormErrors(result.errors);
        return;
      }

      const reloaded = loadPresets();
      setPresets(reloaded);

      setGlobalMessage(`Preset "${result.data.name}" atualizado com sucesso.`);
      handleCancelEdit();
    } else {
      // Criação
      const result = createPreset(formData);
      if (!result.isValid) {
        setFormErrors(result.errors);
        return;
      }

      const reloaded = loadPresets();
      setPresets(reloaded);
      setGlobalMessage(`Preset "${result.data.name}" criado com sucesso.`);
      setFormData(INITIAL_FORM_DATA);
    }
  }

  // Solicitação e confirmação de exclusão explícita
  function handleRequestDeletePreset(preset: TimerPreset) {
    setPendingDelete({
      type: "preset",
      id: preset.id,
      name: preset.name,
    });
  }

  function handleRequestDeleteTask(task: Task) {
    setPendingDelete({
      type: "task",
      id: task.id,
      name: task.title,
    });
  }

  function handleCancelDelete() {
    setPendingDelete(null);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;

    if (pendingDelete.type === "preset") {
      const result = deletePreset(pendingDelete.id);
      if (!result.success) {
        setGlobalMessage(`Erro: ${result.error}`);
        setPendingDelete(null);
        return;
      }

      const reloaded = loadPresets();
      const newActiveId = getActivePresetId();
      setPresets(reloaded);
      setActiveId(newActiveId);

      if (editingId === pendingDelete.id) {
        handleCancelEdit();
      }

      setGlobalMessage(`Preset "${pendingDelete.name}" excluído com sucesso.`);
    } else if (pendingDelete.type === "task") {
      const result = deleteTask(pendingDelete.id);
      if (!result.success) {
        setGlobalMessage(result.error);
        setPendingDelete(null);
        return;
      }

      setTasks(loadTasks());
      if (editingTaskId === pendingDelete.id) {
        handleCancelEditTask();
      }
      setGlobalMessage(`Tarefa "${pendingDelete.name}" excluída com sucesso.`);
    }

    setPendingDelete(null);
  }

  // Handlers para Gerenciamento de Tarefas
  function handleOpenCreateTaskDialog() {
    setEditingTaskId(null);
    setTaskFormData(INITIAL_TASK_FORM);
    setTaskFormErrors({});
    setIsTaskDialogOpen(true);
  }

  function handleTaskFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTaskFormErrors({});

    if (editingTaskId) {
      const result = updateTask(editingTaskId, taskFormData);
      if (!result.isValid) {
        setTaskFormErrors(result.errors);
        return;
      }

      setTasks(loadTasks());
      setEditingTaskId(null);
      setTaskFormData(INITIAL_TASK_FORM);
      setIsTaskDialogOpen(false);
      setGlobalMessage("Tarefa atualizada com sucesso.");
    } else {
      const result = createTask(taskFormData);
      if (!result.isValid) {
        setTaskFormErrors(result.errors);
        return;
      }

      setTasks(loadTasks());
      setTaskFormData(INITIAL_TASK_FORM);
      setIsTaskDialogOpen(false);
      setGlobalMessage("Tarefa criada com sucesso.");
    }
  }

  function handleEditTask(task: Task) {
    setEditingTaskId(task.id);
    setTaskFormData({
      title: task.title,
      state: task.state,
      priority: task.priority,
    });
    setTaskFormErrors({});
    setIsTaskDialogOpen(true);
  }

  function handleCancelEditTask() {
    setEditingTaskId(null);
    setTaskFormData(INITIAL_TASK_FORM);
    setTaskFormErrors({});
    setIsTaskDialogOpen(false);
  }

  function handleQuickChangeTaskState(id: string, newState: TaskState) {
    const result = updateTask(id, { state: newState });
    if (result.isValid) {
      setTasks(loadTasks());
      setGlobalMessage(`Estado da tarefa alterado para "${newState}".`);
    }
  }

  function handleQuickChangeTaskPriority(id: string, newPriority: TaskPriority) {
    const result = updateTask(id, { priority: newPriority });
    if (result.isValid) {
      setTasks(loadTasks());
      setGlobalMessage(`Prioridade da tarefa alterada para "${newPriority}".`);
    }
  }

  return (
    <ThemeProvider defaultTheme="system">
      <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
        {/* Cabeçalho da Aplicação */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Timer className="size-4.5" aria-hidden />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">Tomatimer</p>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Temporizador Pomodoro para estudos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Aviso de Sessão Ativa Retomada (UC10 / UC11) */}
        {isResumedSession && (timer.phase === "running" || timer.phase === "paused") && (
          <div className="border-b border-primary/20 bg-primary/10">
            <aside
              role="alert"
              className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-primary shrink-0" aria-hidden />
                <span>
                  <strong>Sessão retomada automaticamente:</strong> Uma sessão anterior do preset "
                  {timer.preset.name}" foi recuperada de onde parou.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardResumedSession}
                  className="rounded px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                >
                  Descartar sessão retomada
                </button>
                <button
                  type="button"
                  onClick={() => setIsResumedSession(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-sm"
                  aria-label="Dispensar aviso de retomada"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Mensagem global de status / notificação acessível */}
        {globalMessage && (
          <div className="border-b border-border bg-muted/40">
            <aside
              role="status"
              className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-xs text-foreground sm:px-6"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="size-3.5 text-primary shrink-0" aria-hidden />
                <span>{globalMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalMessage(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-sm"
                aria-label="Dispensar aviso"
              >
                <X className="size-3.5" />
              </button>
            </aside>
          </div>
        )}

        {/* Área Principal Responsiva: Temporizador na Esquerda, Tarefas na Direita (Abaixo em Mobile) */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          <h1 className="sr-only">Tomatimer — Temporizador Pomodoro de Estudos</h1>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            {/* Coluna 1: Painel do Temporizador */}
            <TimerPanel
              timer={timer}
              presets={presets}
              activePresetId={activePresetId}
              formData={formData}
              editingId={editingId}
              formErrors={formErrors}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onResetCycles={handleResetCycles}
              onSkipStage={handleSkipStage}
              onEndSession={handleEndSession}
              onSelectActivePreset={handleSelectActivePreset}
              onFormDataChange={setFormData}
              onSavePreset={handleSavePreset}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onRequestDeletePreset={handleRequestDeletePreset}
            />

            {/* Coluna 2: Painel de Tarefas */}
            <TaskPanel
              tasks={tasks}
              onOpenCreateDialog={handleOpenCreateTaskDialog}
              onEditTask={handleEditTask}
              onRequestDeleteTask={handleRequestDeleteTask}
              onQuickChangeState={handleQuickChangeTaskState}
              onQuickChangePriority={handleQuickChangeTaskPriority}
            />
          </div>
        </main>

        {/* Rodapé da Aplicação */}
        <footer className="mt-auto border-t border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>
              Técnica Pomodoro: blocos de foco intercalados com pausas curtas e uma pausa longa a cada ciclo.
            </p>
            <p>Seus dados ficam salvos exclusivamente neste navegador via localStorage.</p>
          </div>
        </footer>

        {/* Modal de Formulário de Tarefas */}
        <TaskDialog
          open={isTaskDialogOpen}
          editingTaskId={editingTaskId}
          formData={taskFormData}
          formErrors={taskFormErrors}
          onOpenChange={setIsTaskDialogOpen}
          onFormDataChange={setTaskFormData}
          onSubmit={handleTaskFormSubmit}
          onCancel={handleCancelEditTask}
        />

        {/* Diálogo de Confirmação Genérica (UC07, UC08, UC11) */}
        <ConfirmDialog
          action={pendingConfirm}
          onConfirm={handleExecuteConfirmedAction}
          onCancel={() => setPendingConfirm(null)}
        />

        {/* Diálogo de Confirmação de Exclusão (Preset / Tarefa) */}
        <DeleteDialog
          pendingDelete={pendingDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
