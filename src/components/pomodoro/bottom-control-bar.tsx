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
  onOpenTasks?: () => void;
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
  onOpenTasks,
}: BottomControlBarProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
      {/* Barra Cápsula Flutuante Fixa Centralizada Embaixo */}
      <nav
        aria-label="Controles do temporizador"
        className="pointer-events-auto flex items-center justify-center gap-1.5 sm:gap-2.5 rounded-full border border-border/80 bg-card/95 px-3.5 py-2 shadow-2xl backdrop-blur-md transition-all hover:bg-card hover:border-border"
      >
        {/* 1. Botão Secundário: Pular Fase */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
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
          className="h-10 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onResetCycles}
          aria-label="Reiniciar contagem de ciclos"
          title="Reiniciar Ciclo"
        >
          <RotateCcw className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Ciclos</span>
        </Button>

        {/* 3. BOTÃO PRINCIPAL DE DESTAQUE CENTRAL (Preto no Claro / Branco no Escuro) */}
        {timer.phase === "idle" && (
          <Button
            size="lg"
            className="h-12 rounded-full px-7 sm:px-9 text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={onStart}
            aria-label="Iniciar temporizador"
          >
            <Play className="size-5 fill-current mr-1" />
            Começar
          </Button>
        )}

        {timer.phase === "running" && (
          <Button
            size="lg"
            className="h-12 rounded-full px-7 sm:px-9 text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={onPause}
            aria-label="Pausar temporizador"
          >
            <Pause className="size-5 fill-current mr-1" />
            Pausar
          </Button>
        )}

        {timer.phase === "paused" && (
          <Button
            size="lg"
            className="h-12 rounded-full px-7 sm:px-9 text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={onResume}
            aria-label="Retomar temporizador"
          >
            <Play className="size-5 fill-current mr-1" />
            Retomar
          </Button>
        )}

        {timer.phase === "completed" && (
          <Button
            size="lg"
            className="h-12 rounded-full px-7 sm:px-9 text-base font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={onStart}
            aria-label="Iniciar próxima fase"
          >
            <Play className="size-5 fill-current mr-1" />
            Próxima Fase
          </Button>
        )}

        {/* 4. Botão Secundário: Zerar Fase Atual */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onReset}
          aria-label="Reiniciar tempo da fase atual"
          title="Zerar Fase"
        >
          <RotateCcw className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Zerar</span>
        </Button>

        {/* 5. Botão Secundário: Encerrar Sessão */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-destructive"
          onClick={onEndSession}
          aria-label="Encerrar sessão ativa"
          title="Encerrar Sessão"
        >
          <Square className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Encerrar</span>
        </Button>

        {/* Atalho de Tarefas no Mobile se houver */}
        {onOpenTasks && (
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-10 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={onOpenTasks}
            aria-label="Rolar para tarefas"
            title="Ver Tarefas"
          >
            <ListTodo className="size-4" />
          </Button>
        )}
      </nav>
    </div>
  );
}

