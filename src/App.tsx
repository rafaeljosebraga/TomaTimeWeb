// src/App.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { TomatimerIcon } from "@/components/icons/tomatimer-icon";
import { primeAudioContext, playPhaseEndAlert } from "@/lib/audio/sound-alert";
import {
  STAGE_DISPLAY_NAMES,
  type PresetValidationErrors,
  type SessionStage,
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
import { getSessionEndConfirmation } from "@/lib/domain/session-end";
import {
  createPreset,
  deletePreset,
  getActivePresetId,
  getPresetById,
  loadPresets,
  setActivePresetId,
  updatePreset,
  DEFAULT_PRESETS,
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
import { TimerStyleProvider } from "@/components/theme/timer-style-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TimerPanel } from "@/components/pomodoro/timer-panel";
import { TaskPanel } from "@/components/pomodoro/task-panel";
import { TaskDialog } from "@/components/pomodoro/task-dialog";
import { DeleteDialog } from "@/components/pomodoro/delete-dialog";
import { ConfirmDialog, type ConfirmAction } from "@/components/pomodoro/confirm-dialog";
import { QuickActionSidebar } from "@/components/pomodoro/quick-action-sidebar";
import { BottomControlBar } from "@/components/pomodoro/bottom-control-bar";
import { PresetEditorDialog } from "@/components/pomodoro/preset-editor-dialog";

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

const STAGE_LABELS: Record<SessionStage, string> = {
  TF: `${STAGE_DISPLAY_NAMES.TF} (TF)`,
  TPC: `${STAGE_DISPLAY_NAMES.TPC} (TPC)`,
  TPL: `${STAGE_DISPLAY_NAMES.TPL} (TPL)`,
};

export function App() {
  const [presets, setPresets] = useState<TimerPreset[]>(() => loadPresets());
  const [activePresetId, setActiveId] = useState<string>(() =>
    getActivePresetId()
  );

  const hasNoPresets = presets.length === 0;

  const [isResumedSession, setIsResumedSession] = useState<boolean>(() =>
    hasStoredActiveSession()
  );

  const [timer, setTimer] = useState<SessionTimer>(() => {
    const loaded = loadPresets();
    const active = getPresetById(getActivePresetId()) ?? loaded[0] ?? DEFAULT_PRESETS[0]!;
    return loadSessionTimer(active);
  });

  const [formData, setFormData] = useState<PresetFormData>(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<PresetValidationErrors>({});
  const [isPresetEditorOpen, setIsPresetEditorOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(INITIAL_TASK_FORM);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormErrors, setTaskFormErrors] = useState<TaskValidationErrors>({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState<boolean>(false);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState<boolean>(false);
  const dragStartYRef = useRef<number | null>(null);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const [pendingConfirm, setPendingConfirm] = useState<ConfirmAction | null>(null);

  // Sincroniza o temporizador a cada segundo quando estiver rodando
  useEffect(() => {
    if (timer.phase !== "running") return;

    const intervalId = window.setInterval(() => {
      setTimer((prevTimer) => {
        const nextTimer = tickSessionTimer(prevTimer);
        // Emite alerta sonoro assim que a fase atual é zerada / concluída
        if (prevTimer.phase === "running" && nextTimer.phase === "completed") {
          playPhaseEndAlert();
        }
        saveSessionTimer(nextTimer);
        return nextTimer;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timer.phase]);

  // Atalho de teclado: barra de espaço para alternar Iniciar / Pausar ou Adicionar Preset
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      if (hasNoPresets) {
        handleStartCreatePreset();
        return;
      }
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
  }, [timer, hasNoPresets]);

  // Controles do timer
  function handleStart() {
    if (hasNoPresets) return;
    primeAudioContext();
    const updated = startSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handlePause() {
    if (hasNoPresets) return;
    const updated = pauseSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleResume() {
    if (hasNoPresets) return;
    primeAudioContext();
    const updated = resumeSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleReset() {
    if (hasNoPresets) return;
    const updated = resetSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
  }

  function handleResetCycles() {
    if (hasNoPresets) return;
    setPendingConfirm({
      type: "resetCycles",
      title: "Reiniciar Ciclos",
      description: "Deseja realmente zerar a contagem de ciclos concluídos e retornar ao primeiro ciclo de foco?",
      confirmLabel: "Reiniciar Ciclos",
    });
  }

  function handleSkipStage() {
    if (hasNoPresets) return;
    const updated = skipSessionStage(timer);
    setTimer(updated);
    saveSessionTimer(updated);
    setGlobalMessage(`Fase pulada com sucesso. Próxima fase: ${STAGE_LABELS[updated.stage]}.`);
  }

  function handleEndSession() {
    if (hasNoPresets) return;
    setPendingConfirm(getSessionEndConfirmation(isResumedSession));
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
        setGlobalMessage("Sessão retomada foi encerrada com sucesso.");
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
    setIsPresetEditorOpen(true);
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

  function handleStartCreatePreset() {
    setIsPresetEditorOpen(true);
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setGlobalMessage(null);
  }

  function handleCancelEdit() {
    setIsPresetEditorOpen(false);
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
      handleCancelEdit();

      if (hasNoPresets || !activePresetId) {
        setActivePresetId(result.data.id);
        setActiveId(result.data.id);
        const newTimer = createSessionTimer(result.data);
        setTimer(newTimer);
        saveSessionTimer(newTimer);
      }
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

      if (reloaded.length === 0) {
        clearSessionTimer();
        setIsResumedSession(false);
      } else if (newActiveId) {
        const nextPreset = getPresetById(newActiveId);
        if (nextPreset && timer.preset.id === pendingDelete.id) {
          const newTimer = createSessionTimer(nextPreset);
          setTimer(newTimer);
          saveSessionTimer(newTimer);
        }
      }

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

  function handleSaveTaskTitle(id: string, newTitle: string) {
    const result = updateTask(id, { title: newTitle });
    if (result.isValid) {
      setTasks(loadTasks());
      setGlobalMessage("Tarefa atualizada com sucesso.");
    }
  }

  return (
    <ThemeProvider defaultTheme="system">
      <TimerStyleProvider>
        <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200 selection:bg-primary/20">
        {/* Textura sutil de fundo radial no centro da tela */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(120,119,198,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(255,255,255,0.04),transparent)]"
        />

        {/* Cabeçalho da Aplicação */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Fio de gradiente decorativo na borda inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent pointer-events-none" />
          <div className="mx-auto flex h-12 sm:h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="group flex items-center gap-2 sm:gap-2.5 select-none cursor-pointer">
              {/* Ícone com animação interativa de cronômetro */}
              <TomatimerIcon
                className="size-6 sm:size-7 shrink-0 text-foreground transition-all duration-300"
                isRunning={timer.phase === "running"}
                aria-hidden
              />
              <p className="text-sm font-bold tracking-tight transition-colors group-hover:text-foreground/80">Tomatimer</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Área Principal Responsiva: Centralizada Perfeitamente na Vertical e Horizontal sem scroll */}
        <main className="mx-auto w-full max-w-6xl flex-1 flex flex-col justify-center px-3 py-3 pb-24 sm:px-6 sm:py-3 sm:pb-24 lg:py-4 lg:pb-24 overflow-x-hidden">
          <h1 className="sr-only">Tomatimer — Temporizador Pomodoro de Estudos</h1>

          {/* Barra Flutuante Lateral Estilo Pomodoro Online (Cor e Configurações) */}
          <QuickActionSidebar />

          {/* Layout Principal com Transição do Painel de Tarefas */}
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
            {/* Coluna 1: Painel do Temporizador Central */}
            <div className={`w-full transition-all duration-300 ease-in-out flex flex-col ${isTasksPanelOpen ? "lg:max-w-xl xl:max-w-2xl" : "max-w-3xl lg:max-w-4xl mx-auto"}`}>
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
                onCreatePreset={handleStartCreatePreset}
                onFormDataChange={setFormData}
                onSavePreset={handleSavePreset}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onRequestDeletePreset={handleRequestDeletePreset}
              />
            </div>

            {/* Coluna 2 (Desktop): Painel de Tarefas Deslizando da Direita para a Esquerda e Recolhendo Suavemente */}
            <div
              className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
                isTasksPanelOpen
                  ? "w-[400px] xl:w-[440px] opacity-100"
                  : "w-0 opacity-0 pointer-events-none overflow-hidden"
              }`}
            >
              <div className="w-[400px] xl:w-[440px] h-full flex flex-col">
                <TaskPanel
                  tasks={tasks}
                  onOpenCreateDialog={handleOpenCreateTaskDialog}
                  onEditTask={handleEditTask}
                  onRequestDeleteTask={handleRequestDeleteTask}
                  onQuickChangeState={handleQuickChangeTaskState}
                  onQuickChangePriority={handleQuickChangeTaskPriority}
                  onUpdateTaskTitle={handleSaveTaskTitle}
                  onClose={() => setIsTasksPanelOpen(false)}
                />
              </div>
            </div>
          </div>

          {/* Drawer / Bottom Sheet Mobile: Tarefas surgindo de Baixo para Cima sobrepondo a tela (renderizado exclusivamente em telas menores que lg) */}
          <div
            className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 lg:hidden ${
              isTasksPanelOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
            }`}
          >
            {/* Backdrop escuro com blur com transição de opacidade suave */}
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
                isTasksPanelOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setIsTasksPanelOpen(false)}
              aria-hidden="true"
            />
            {/* Conteúdo deslizando de baixo para cima com transition translate-y */}
            <aside
              role="dialog"
              aria-label="Painel de Tarefas"
              aria-modal="true"
              style={{
                transform: isTasksPanelOpen
                  ? `translateY(${dragOffsetY}px)`
                  : "translateY(100%)",
                transition: isDraggingSheet ? "none" : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="relative z-10 w-full max-h-[88vh] rounded-t-3xl border-t border-border bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 px-4 pt-3 pb-6 shadow-2xl flex flex-col overflow-hidden will-change-transform"
            >
              {/* Alça visual de arrasto no topo: clique fecha, arrastar para baixo fecha */}
              <button
                type="button"
                aria-label="Puxador: arraste para baixo ou clique para fechar tarefas"
                title="Fechar tarefas"
                onClick={() => {
                  setDragOffsetY(0);
                  setIsTasksPanelOpen(false);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  dragStartYRef.current = touch.clientY;
                  setIsDraggingSheet(true);
                }}
                onTouchMove={(e) => {
                  if (dragStartYRef.current === null) return;
                  const touch = e.touches[0];
                  if (!touch) return;
                  const currentY = touch.clientY;
                  const deltaY = currentY - dragStartYRef.current;
                  if (deltaY > 0) {
                    setDragOffsetY(deltaY);
                  }
                }}
                onTouchEnd={() => {
                  setIsDraggingSheet(false);
                  if (dragOffsetY > 80) {
                    setDragOffsetY(0);
                    setIsTasksPanelOpen(false);
                  } else {
                    setDragOffsetY(0);
                  }
                  dragStartYRef.current = null;
                }}
                onMouseDown={(e) => {
                  dragStartYRef.current = e.clientY;
                  setIsDraggingSheet(true);
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    if (dragStartYRef.current === null) return;
                    const deltaY = moveEvent.clientY - dragStartYRef.current;
                    if (deltaY > 0) {
                      setDragOffsetY(deltaY);
                    }
                  };
                  const handleMouseUp = () => {
                    setIsDraggingSheet(false);
                    setDragOffsetY((currentOffset) => {
                      if (currentOffset > 80) {
                        setIsTasksPanelOpen(false);
                      }
                      return 0;
                    });
                    dragStartYRef.current = null;
                    window.removeEventListener("mousemove", handleMouseMove);
                    window.removeEventListener("mouseup", handleMouseUp);
                  };
                  window.addEventListener("mousemove", handleMouseMove);
                  window.addEventListener("mouseup", handleMouseUp);
                }}
                className="mx-auto -mt-1 mb-2.5 flex h-6 w-full items-center justify-center cursor-pointer touch-none select-none group border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30 transition-all group-hover:bg-muted-foreground/60 group-hover:w-14" />
              </button>

              <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                <TaskPanel
                  tasks={tasks}
                  onOpenCreateDialog={handleOpenCreateTaskDialog}
                  onEditTask={handleEditTask}
                  onRequestDeleteTask={handleRequestDeleteTask}
                  onQuickChangeState={handleQuickChangeTaskState}
                  onQuickChangePriority={handleQuickChangeTaskPriority}
                  onUpdateTaskTitle={handleSaveTaskTitle}
                  onClose={() => {
                    setDragOffsetY(0);
                    setIsTasksPanelOpen(false);
                  }}
                />
              </div>
            </aside>
          </div>

          {/* Barra Flutuante de Controles Abaixo do Card com Botão de Tarefas ao Lado */}
          <BottomControlBar
            timer={timer}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onResetCycles={handleResetCycles}
            onSkipStage={handleSkipStage}
            onEndSession={handleEndSession}
            isTasksOpen={isTasksPanelOpen}
            onToggleTasks={() => setIsTasksPanelOpen((prev) => !prev)}
            hasNoPresets={hasNoPresets}
            onAddPreset={handleStartCreatePreset}
          />
        </main>

        {/* Rodapé da Aplicação */}
        {/* <footer className="mt-auto border-t border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>
              Técnica Pomodoro: blocos de foco intercalados com pausas curtas e uma pausa longa a cada ciclo.
            </p>
            <p>Seus dados ficam salvos exclusivamente neste navegador via localStorage.</p>
          </div>
        </footer> */}

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

        <PresetEditorDialog
          open={isPresetEditorOpen}
          editingId={editingId}
          formData={formData}
          formErrors={formErrors}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit();
            } else {
              setIsPresetEditorOpen(true);
            }
          }}
          onFormDataChange={setFormData}
          onSave={handleSavePreset}
          onCancel={handleCancelEdit}
        />

        {/* Diálogo de Confirmação de Ações da Sessão */}
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
      </TimerStyleProvider>
    </ThemeProvider>
  );
}

export default App;
