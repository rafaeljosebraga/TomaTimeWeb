import { useState, useRef, useEffect } from "react";
import { Palette, Settings, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PresetsDialog } from "@/components/pomodoro/presets-dialog";
import { TimerStyleDialog } from "@/components/pomodoro/timer-style-dialog";
import {
  playPhaseEndAlert,
  primeAudioContext,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/audio/sound-alert";
import type { PresetValidationErrors, TimerPreset } from "@/types/domain";

type PresetFormData = {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
};

interface QuickActionSidebarProps {
  presets: TimerPreset[];
  activePresetId: string;
  formData: PresetFormData;
  editingId: string | null;
  formErrors: PresetValidationErrors;
  onFormDataChange: (data: PresetFormData) => void;
  onSavePreset: (e: React.FormEvent) => void;
  onSelectActivePreset: (id: string) => void;
  onStartEdit: (preset: TimerPreset) => void;
  onCancelEdit: () => void;
  onRequestDeletePreset: (preset: TimerPreset) => void;
}

export function QuickActionSidebar({
  presets,
  activePresetId,
  formData,
  editingId,
  formErrors,
  onFormDataChange,
  onSavePreset,
  onSelectActivePreset,
  onStartEdit,
  onCancelEdit,
  onRequestDeletePreset,
}: QuickActionSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const isDark = resolvedTheme === "dark";
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu móvel ao clicar/tocar fora ou pressionar ESC
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabledState(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      primeAudioContext();
      playPhaseEndAlert();
    }
  };

  return (
    <>
      {/* 1. Desktop (sm:): Pílula flutuante lateral esquerda fixa (z-[60] para ficar nítida à frente do backdrop) */}
      <aside
        aria-label="Ações rápidas e preferências"
        className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-[60] flex-col items-center gap-1.5 rounded-full border border-border/80 bg-card/85 p-1.5 shadow-xl dark:shadow-[0_15px_40px_rgba(0,0,0,0.85)] dark:border-border backdrop-blur-md transition-all hover:bg-card/95 hover:border-border"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsStyleDialogOpen((prev) => !prev)}
          className={`size-10 rounded-full transition-colors ${
            isStyleDialogOpen
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
          title={isStyleDialogOpen ? "Fechar estética" : "Estética (Estilo do temporizador)"}
          aria-label={isStyleDialogOpen ? "Fechar opções de estética" : "Personalizar estilo do temporizador"}
          aria-expanded={isStyleDialogOpen}
        >
          <Palette className="size-5 transition-transform hover:scale-110" />
        </Button>

        <div className="w-5 h-px bg-border/60 my-0.5" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSound}
          className={`size-10 rounded-full transition-colors ${
            !soundEnabled
              ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
          title={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
          aria-label={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
        >
          {soundEnabled ? (
            <Volume2 className="size-5 transition-transform hover:scale-110" />
          ) : (
            <VolumeX className="size-5 transition-transform hover:scale-110" />
          )}
        </Button>

        <div className="w-5 h-px bg-border/60 my-0.5" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsPresetsOpen(true);
            setIsStyleDialogOpen(false);
          }}
          className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Configurações de temporizadores (presets)"
          aria-label="Abrir configurações de temporizadores"
        >
          <Settings className="size-5 transition-transform hover:rotate-45" />
        </Button>
      </aside>

      {/* 2. Mobile (< sm): No cabeçalho: primeiro Lua/Sol, depois os 3 pontinhos (...) com espaçamento confortável */}
      <div className="sm:hidden fixed top-2 right-4 z-30 flex items-center gap-2">
        {/* Ícone da Lua / Sol com rotação animada */}
        <ThemeToggle />

        {/* Container relativo para os 3 pontinhos e o dropdown que desce */}
        <div ref={mobileMenuRef} className="relative flex flex-col items-end">
          {/* Botão dos 3 pontinhos (...) que abre/fecha */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`size-8 rounded-full transition-all ${
              isMobileMenuOpen
                ? "bg-neutral-200 text-neutral-900 ring-1 ring-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:ring-neutral-600 shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-label={isMobileMenuOpen ? "Fechar menu de opções" : "Abrir menu de opções"}
            title="Mais opções"
          >
            <MoreHorizontal className="size-4" />
          </Button>

          {/* Pílula que desce ABAIXO dos 3 pontinhos */}
          {isMobileMenuOpen && (
            <div
              className="absolute top-11 right-0 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsStyleDialogOpen((prev) => !prev);
                  setIsMobileMenuOpen(false);
                }}
                className={`size-8 rounded-full transition-colors ${
                  isStyleDialogOpen
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title="Estética (Estilo do temporizador)"
                aria-label="Personalizar estilo do temporizador"
                aria-expanded={isStyleDialogOpen}
              >
                <Palette className="size-4" />
              </Button>

              <div className="w-px h-4 bg-border/60" aria-hidden />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSound}
                className={`size-8 rounded-full transition-colors ${
                  !soundEnabled
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
                aria-label={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
              >
                {soundEnabled ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
              </Button>

              <div className="w-px h-4 bg-border/60" aria-hidden />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsPresetsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                title="Configurações"
                aria-label="Abrir configurações"
              >
                <Settings className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Card de Estética (Estilo do temporizador) */}
      <TimerStyleDialog
        open={isStyleDialogOpen}
        onOpenChange={setIsStyleDialogOpen}
      />

      {/* Modal de Configurações / Presets acionado pelo botão de Settings */}
      <PresetsDialog
        open={isPresetsOpen}
        onOpenChange={setIsPresetsOpen}
        showTrigger={false}
        presets={presets}
        activePresetId={activePresetId}
        formData={formData}
        editingId={editingId}
        formErrors={formErrors}
        onFormDataChange={onFormDataChange}
        onSavePreset={onSavePreset}
        onSelectActivePreset={onSelectActivePreset}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onRequestDeletePreset={onRequestDeletePreset}
      />
    </>
  );
}
