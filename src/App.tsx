// src/App.tsx
// Interface simples em HTML nativo para exercitar as capacidades do Tomatimer.
import { useEffect, useState } from "react";
import {
  TASK_PRIORITIES,
  TASK_STATES,
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
  getLongBreakStatusMessage,
  getRemainingSeconds,
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
  loadSessionTimer,
  saveSessionTimer,
} from "@/lib/storage/session-storage";
import {
  createTask,
  deleteTask,
  loadTasks,
  updateTask,
} from "@/lib/storage/tasks-storage";

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

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function App() {
  // 1. Estado de presets e seleção
  const [presets, setPresets] = useState<TimerPreset[]>(() => loadPresets());
  const [activePresetId, setActiveId] = useState<string>(() =>
    getActivePresetId(),
  );

  // 2. Estado do temporizador de sessão (restaura do storage ou cria novo)
  const [timer, setTimer] = useState<SessionTimer>(() => {
    const active = getPresetById(getActivePresetId()) ?? loadPresets()[0]!;
    return loadSessionTimer(active);
  });

  // 3. Estado do formulário de criação/edição
  const [formData, setFormData] = useState<PresetFormData>(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<PresetValidationErrors>({});
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  // 4. Estado de Tarefas (Tasks)
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(INITIAL_TASK_FORM);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormErrors, setTaskFormErrors] = useState<TaskValidationErrors>({});

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
    const updated = resetCompletedCycles(timer);
    setTimer(updated);
    saveSessionTimer(updated);
    setGlobalMessage("Contador de ciclos de foco concluídos foi zerado.");
  }

  function handleSkipStage() {
    const updated = skipSessionStage(timer);
    setTimer(updated);
    saveSessionTimer(updated);
    setGlobalMessage(`Fase pulada com sucesso. Próxima fase: ${stageLabels[updated.stage]}.`);
  }

  function handleEndSession() {
    const updated = endSessionTimer(timer);
    setTimer(updated);
    saveSessionTimer(updated);
    setGlobalMessage("Sessão ativa encerrada.");
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

      // Se editou o preset atualmente ativo na sessão, recarrega os dados dele
      if (editingId === activePresetId) {
        setTimer((prev) => ({
          ...prev,
          preset: result.data,
        }));
      }

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

  // Exclusão de preset
  function handleDeletePreset(id: string) {
    const result = deletePreset(id);
    if (!result.success) {
      setGlobalMessage(`Erro: ${result.error}`);
      return;
    }

    const reloaded = loadPresets();
    const newActiveId = getActivePresetId();
    setPresets(reloaded);
    setActiveId(newActiveId);

    // Se o ativo foi excluído, carrega o novo ativo no timer
    if (timer.preset.id === id) {
      const newActivePreset = getPresetById(newActiveId) ?? reloaded[0]!;
      const newTimer = createSessionTimer(newActivePreset);
      setTimer(newTimer);
      saveSessionTimer(newTimer);
    }

    if (editingId === id) {
      handleCancelEdit();
    }

    setGlobalMessage("Preset excluído com sucesso.");
  }

  // Handlers para Gerenciamento de Tarefas
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
      setGlobalMessage("Tarefa atualizada com sucesso.");
    } else {
      const result = createTask(taskFormData);
      if (!result.isValid) {
        setTaskFormErrors(result.errors);
        return;
      }

      setTasks(loadTasks());
      setTaskFormData(INITIAL_TASK_FORM);
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
  }

  function handleCancelEditTask() {
    setEditingTaskId(null);
    setTaskFormData(INITIAL_TASK_FORM);
    setTaskFormErrors({});
  }

  function handleDeleteTask(id: string) {
    const result = deleteTask(id);
    if (!result.success) {
      setGlobalMessage(result.error);
      return;
    }

    setTasks(loadTasks());
    if (editingTaskId === id) {
      handleCancelEditTask();
    }
    setGlobalMessage("Tarefa excluída com sucesso.");
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

  const remainingSecs = getRemainingSeconds(timer);
  const remainingFormatted = formatSeconds(remainingSecs);

  const stageLabels: Record<string, string> = {
    TF: "Tempo de Foco (TF)",
    TPC: "Tempo de Pausa Curta (TPC)",
    TPL: "Tempo de Pausa Longa (TPL)",
  };

  const phaseLabels: Record<string, string> = {
    idle: "Parado (Pronto)",
    running: "Em andamento",
    paused: "Pausado",
    completed: "Estágio Concluído!",
  };


  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <header>
        <h1>Tomatimer</h1>
        <p>
          Temporizador Pomodoro com suporte a Presets personalizados, baseado em
          timestamps e persistido exclusivamente em <code>localStorage</code>.
        </p>
      </header>

      {/* AVISO: AMBIENTE DE TESTES / INTERFACE PROVISÓRIA */}
      <aside
        role="note"
        style={{
          background: "#fff3cd",
          border: "2px solid #ffeeba",
          color: "#856404",
          padding: "16px",
          marginBottom: "20px",
          borderRadius: "4px",
          fontSize: "15px",
          lineHeight: "1.5",
        }}
      >
        <strong>⚠️ AVISO IMPORTANTE:</strong> Esta página HTML é estritamente um
        ambiente provisório de rascunho para testes manuais e depuração das
        funcionalidades do temporizador, presets e tarefas. Esta tela <strong>deve ser completamente refeita</strong> na
        etapa de interface definitiva.
      </aside>

      {globalMessage && (
        <aside
          role="status"
          style={{
            background: "#f0f0f0",
            padding: "10px",
            marginBottom: "16px",
            borderLeft: "4px solid #333",
          }}
        >
          {globalMessage}
        </aside>
      )}

      <hr />

      {/* SEÇÃO 1: TEMPORIZADOR DA SESSÃO */}
      <section aria-labelledby="timer-heading">
        <h2 id="timer-heading">Temporizador da Sessão</h2>

        <div>
          <p>
            <strong>Preset Carregado:</strong> {timer.preset.name} (TF:{" "}
            {timer.preset.focusMinutes}m | TPC: {timer.preset.shortBreakMinutes}m
            | TPL: {timer.preset.longBreakMinutes}m | Meta:{" "}
            {timer.preset.cyclesBeforeLongBreak} ciclos)
          </p>
          <p>
            <strong>Estágio Atual:</strong> {stageLabels[timer.stage]}
          </p>
          <p>
            <strong>Status:</strong> {phaseLabels[timer.phase]}
          </p>
          <p>
            <strong>Ciclos de Foco Concluídos:</strong> {timer.completedCycles}
            <button
              type="button"
              onClick={handleResetCycles}
              style={{ marginLeft: "12px", fontSize: "12px" }}
              title="Zerar a contagem de ciclos concluídos"
            >
              Zerar Ciclos
            </button>
          </p>
          <p>
            <strong>Para a próxima Pausa Longa:</strong>{" "}
            {getLongBreakStatusMessage(timer)}
          </p>
        </div>

        {/* Display grande */}
        <div style={{ margin: "20px 0" }}>
          <output
            aria-live="polite"
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              fontFamily: "monospace",
              display: "block",
            }}
          >
            {remainingFormatted}
          </output>
          <small>
            Controle por timestamp (Fim previsto:{" "}
            {timer.endsAt ? new Date(timer.endsAt).toLocaleTimeString() : "Nenhum"})
          </small>
        </div>

        {/* Botões nativos de controle */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {timer.phase === "idle" && (
            <button type="button" onClick={handleStart}>
              Iniciar
            </button>
          )}

          {timer.phase === "running" && (
            <button type="button" onClick={handlePause}>
              Pausar
            </button>
          )}

          {timer.phase === "paused" && (
            <>
              <button type="button" onClick={handleResume}>
                Retomar
              </button>
              <button type="button" onClick={handleReset}>
                Reiniciar
              </button>
            </>
          )}

          {timer.phase === "completed" && (
            <>
              <button type="button" onClick={handleStart}>
                Iniciar Próximo Estágio
              </button>
              <button type="button" onClick={handleReset}>
                Reiniciar
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSkipStage}
            title="Avançar manualmente para a próxima fase prevista"
          >
            Pular Fase ⏭
          </button>

          <button
            type="button"
            onClick={handleEndSession}
            title="Finalizar a sessão ativa a qualquer momento"
          >
            Encerrar Sessão ⏹
          </button>
        </div>
      </section>

      <hr />

      {/* SEÇÃO 2: SELETOR E LISTA DE PRESETS */}
      <section aria-labelledby="presets-heading">
        <h2 id="presets-heading">Presets Salvos no Navegador</h2>

        <table border={1} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Nome</th>
              <th>Foco (TF)</th>
              <th>Pausa Curta (TPC)</th>
              <th>Ciclos Meta</th>
              <th>Pausa Longa (TPL)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {presets.map((preset) => {
              const isActive = preset.id === activePresetId;
              return (
                <tr key={preset.id} style={{ background: isActive ? "#eef" : "transparent" }}>
                  <td style={{ textAlign: "center" }}>
                    {isActive ? <strong>ATIVO</strong> : "—"}
                  </td>
                  <td>{preset.name}</td>
                  <td>{preset.focusMinutes} min</td>
                  <td>{preset.shortBreakMinutes} min</td>
                  <td>{preset.cyclesBeforeLongBreak}</td>
                  <td>{preset.longBreakMinutes} min</td>
                  <td>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSelectActivePreset(preset.id)}
                        style={{ marginRight: "6px" }}
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(preset)}
                      style={{ marginRight: "6px" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <hr />

      {/* SEÇÃO 3: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
      <section aria-labelledby="form-heading">
        <h2 id="form-heading">
          {editingId ? "Editar Preset" : "Criar Novo Preset"}
        </h2>

        <form onSubmit={handleSavePreset} style={{ maxWidth: "450px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="name-input" style={{ display: "block" }}>
              Nome do preset (1 a 40 caracteres):
            </label>
            <input
              id="name-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: "100%", padding: "6px" }}
            />
            {formErrors.name && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {formErrors.name.join(" ")}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="focus-input" style={{ display: "block" }}>
              Tempo de foco (TF: 1 a 120 min):
            </label>
            <input
              id="focus-input"
              type="number"
              min={1}
              max={120}
              value={formData.focusMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  focusMinutes: Number(e.target.value),
                })
              }
              style={{ width: "100%", padding: "6px" }}
            />
            {formErrors.focusMinutes && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {formErrors.focusMinutes.join(" ")}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="short-break-input" style={{ display: "block" }}>
              Tempo de pausa curta (TPC: 1 a 60 min):
            </label>
            <input
              id="short-break-input"
              type="number"
              min={1}
              max={60}
              value={formData.shortBreakMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shortBreakMinutes: Number(e.target.value),
                })
              }
              style={{ width: "100%", padding: "6px" }}
            />
            {formErrors.shortBreakMinutes && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {formErrors.shortBreakMinutes.join(" ")}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="cycles-input" style={{ display: "block" }}>
              Quantidade de ciclos antes da pausa longa (1 a 12):
            </label>
            <input
              id="cycles-input"
              type="number"
              min={1}
              max={12}
              value={formData.cyclesBeforeLongBreak}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cyclesBeforeLongBreak: Number(e.target.value),
                })
              }
              style={{ width: "100%", padding: "6px" }}
            />
            {formErrors.cyclesBeforeLongBreak && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {formErrors.cyclesBeforeLongBreak.join(" ")}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="long-break-input" style={{ display: "block" }}>
              Tempo de pausa longa (TPL: 1 a 60 min):
            </label>
            <input
              id="long-break-input"
              type="number"
              min={1}
              max={60}
              value={formData.longBreakMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  longBreakMinutes: Number(e.target.value),
                })
              }
              style={{ width: "100%", padding: "6px" }}
            />
            {formErrors.longBreakMinutes && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {formErrors.longBreakMinutes.join(" ")}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit">
              {editingId ? "Salvar Alterações" : "Cadastrar Preset"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </section>

      <hr />

      {/* SEÇÃO 4: GERENCIAMENTO DE TAREFAS (TASKS) */}
      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading">Tarefas (Tasks)</h2>
        <p>
          Gerenciamento e persistência de tarefas no <code>localStorage</code> com
          regras de negócio e valores estritamente em português.
        </p>

        {/* Formulário de Tarefa */}
        <form
          onSubmit={handleTaskFormSubmit}
          style={{
            background: "#f9f9f9",
            border: "1px solid #ccc",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <h3>{editingTaskId ? "Editar Tarefa" : "Cadastrar Nova Tarefa"}</h3>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="task-title-input" style={{ display: "block", fontWeight: "bold" }}>
              Título da tarefa (1 a 100 caracteres):
            </label>
            <input
              id="task-title-input"
              type="text"
              value={taskFormData.title}
              onChange={(e) =>
                setTaskFormData({ ...taskFormData, title: e.target.value })
              }
              placeholder="Ex: Estudar regras do módulo de tarefas"
              maxLength={100}
              style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
            />
            {taskFormErrors.title && (
              <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                {taskFormErrors.title.join(" ")}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="task-state-select" style={{ display: "block", fontWeight: "bold" }}>
                Estado da tarefa:
              </label>
              <select
                id="task-state-select"
                value={taskFormData.state}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    state: e.target.value as TaskState,
                  })
                }
                style={{ width: "100%", padding: "6px" }}
              >
                {TASK_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {taskFormErrors.state && (
                <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                  {taskFormErrors.state.join(" ")}
                </p>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="task-priority-select" style={{ display: "block", fontWeight: "bold" }}>
                Prioridade da tarefa:
              </label>
              <select
                id="task-priority-select"
                value={taskFormData.priority}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    priority: e.target.value as TaskPriority,
                  })
                }
                style={{ width: "100%", padding: "6px" }}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {taskFormErrors.priority && (
                <p role="alert" style={{ color: "red", margin: "4px 0" }}>
                  {taskFormErrors.priority.join(" ")}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit">
              {editingTaskId ? "Salvar Alterações da Tarefa" : "Criar Tarefa"}
            </button>
            {editingTaskId && (
              <button type="button" onClick={handleCancelEditTask}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>

        {/* Listagem de Tarefas */}
        {tasks.length === 0 ? (
          <p>
            <em>Nenhuma tarefa cadastrada no navegador até o momento.</em>
          </p>
        ) : (
          <table
            border={1}
            cellPadding={8}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#eee" }}>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridade</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.title}</strong>
                  </td>
                  <td>
                    <select
                      value={task.state}
                      onChange={(e) =>
                        handleQuickChangeTaskState(
                          task.id,
                          e.target.value as TaskState,
                        )
                      }
                      title="Alterar estado da tarefa rapidamente"
                    >
                      {TASK_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        handleQuickChangeTaskPriority(
                          task.id,
                          e.target.value as TaskPriority,
                        )
                      }
                      title="Alterar prioridade da tarefa rapidamente"
                    >
                      {TASK_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <small>
                      {new Date(task.createdAt).toLocaleString()}
                    </small>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleEditTask(task)}
                      style={{ marginRight: "6px" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default App;
