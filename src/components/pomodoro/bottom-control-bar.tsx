import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Square,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionTimer } from "@/types/domain";

interface BottomControlBarProps {
  timer: SessionTimer;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onResetCycles: () => void;
  onSkipStage: () => void;
  onEndSession: () => void;
  isTasksOpen?: boolean;
  onToggleTasks?: () => void;
}

export function BottomControlBar({
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
  onResetCycles,
  onSkipStage,
  onEndSession,
  isTasksOpen,
  onToggleTasks,
}: BottomControlBarProps) {
  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-2 sm:px-4">
      {/* Barra Cápsula Flutuante Fixa Centralizada Embaixo que acompanha a largura proporcional e permite rolagem com indicador discreto */}
      <nav
        aria-label="Controles do temporizador"
        className="pointer-events-auto flex items-center gap-1 sm:gap-2.5 rounded-full border border-border/80 bg-card/95 px-2 py-1.5 sm:px-4 sm:py-2.5 shadow-2xl dark:shadow-[0_15px_40px_rgba(0,0,0,0.85)] dark:border-border backdrop-blur-md transition-all hover:bg-card hover:border-border max-w-full overflow-x-auto custom-scrollbar-h scroll-smooth"
      >
        {/* 1. Botão Secundário: Pular Fase */}
        <Button
          variant="ghost"
          size="sm"
          className="size-9 sm:h-10 sm:w-auto rounded-full p-0 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground shrink-0"
          onClick={onSkipStage}
          aria-label="Pular fase atual"
          title="Pular Fase"
        >
          <SkipForward className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Pular</span>
        </Button>

        {/* 2. Botão Secundário: Reiniciar Ciclo */}
        <Button
          variant="ghost"
          size="sm"
          className="size-9 sm:h-10 sm:w-auto rounded-full p-0 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground shrink-0"
          onClick={onResetCycles}
          aria-label="Reiniciar contagem de ciclos"
          title="Reiniciar Ciclo"
        >
          <RotateCcw className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Ciclos</span>
        </Button>

        {/* 3. BOTÃO PRINCIPAL DE DESTAQUE CENTRAL COM TOOLTIP FLUTUANTE (Largura fixa para não oscilar a barra) */}
        <div className="relative group/mainbtn flex items-center justify-center flex-1 min-w-0 sm:flex-initial">
          {timer.phase === "idle" && (
            <Button
              size="lg"
              className="h-11 sm:h-12 w-full sm:w-44 px-4 sm:px-8 rounded-full text-sm sm:text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={onStart}
              aria-label="Iniciar temporizador"
            >
              <Play className="size-4.5 sm:size-5 fill-current mr-0.5 sm:mr-1" />
              Começar
            </Button>
          )}

          {timer.phase === "running" && (
            <Button
              size="lg"
              className="h-11 sm:h-12 w-full sm:w-44 px-4 sm:px-8 rounded-full text-sm sm:text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={onPause}
              aria-label="Pausar temporizador"
            >
              <Pause className="size-4.5 sm:size-5 fill-current mr-0.5 sm:mr-1" />
              Pausar
            </Button>
          )}

          {timer.phase === "paused" && (
            <Button
              size="lg"
              className="h-11 sm:h-12 w-full sm:w-44 px-4 sm:px-8 rounded-full text-sm sm:text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={onResume}
              aria-label="Retomar temporizador"
            >
              <Play className="size-4.5 sm:size-5 fill-current mr-0.5 sm:mr-1" />
              Retomar
            </Button>
          )}

          {timer.phase === "completed" && (
            <Button
              size="lg"
              className="h-11 sm:h-12 w-full sm:w-44 px-4 sm:px-8 rounded-full text-sm sm:text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
              onClick={onStart}
              aria-label="Iniciar próxima fase"
            >
              <Play className="size-4.5 sm:size-5 fill-current mr-0.5 sm:mr-1" />
              Próxima Fase
            </Button>
          )}

          {/* Tooltip flutuante e discreto ao passar o mouse */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/80 bg-neutral-900/90 text-white dark:bg-neutral-100 dark:text-neutral-900 px-2.5 py-1 text-[11px] font-medium shadow-md backdrop-blur-xs opacity-0 translate-y-1 transition-all group-hover/mainbtn:opacity-100 group-hover/mainbtn:translate-y-0 duration-150 z-50">
            <span>
              {timer.phase === "running"
                ? "Pausar"
                : timer.phase === "paused"
                ? "Retomar"
                : "Começar"}
            </span>
            <kbd className="rounded border border-white/20 dark:border-neutral-900/20 bg-white/15 dark:bg-neutral-900/10 px-1 py-0.2 text-[10px] font-mono leading-tight">
              Espaço
            </kbd>
          </div>
        </div>

        {/* 4. Botão Secundário: Encerrar Sessão */}
        <Button
          variant="ghost"
          size="sm"
          className="size-9 sm:h-10 sm:w-auto rounded-full p-0 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:bg-red-500/15 transition-colors shrink-0"
          onClick={onEndSession}
          aria-label="Encerrar sessão ativa"
          title="Encerrar Sessão"
        >
          <Square className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Encerrar</span>
        </Button>

        {/* 5. Botão Secundário: Tarefas de Estudo */}
        {onToggleTasks && (
          <Button
            variant="ghost"
            size="sm"
            className={`size-9 sm:h-10 sm:w-auto rounded-full p-0 sm:px-3 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              isTasksOpen
                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={onToggleTasks}
            aria-label={isTasksOpen ? "Ocultar tarefas de estudo" : "Mostrar tarefas de estudo"}
            aria-expanded={isTasksOpen}
            title={isTasksOpen ? "Fechar tarefas" : "Abrir tarefas"}
          >
            <ListTodo className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Tarefas</span>
          </Button>
        )}
      </nav>
    </div>
  );
}

