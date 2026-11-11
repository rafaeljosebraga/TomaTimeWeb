import { useState } from "react";
import { Palette, Settings, MoreHorizontal, Sun, Moon, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { PresetsDialog } from "@/components/pomodoro/presets-dialog";
import { playPhaseEndAlert, primeAudioContext } from "@/lib/audio/sound-alert";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* 1. Desktop (sm:): Pílula flutuante lateral esquerda fixa */}
      <aside
        aria-label="Ações rápidas e preferências"
        className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1.5 rounded-full border border-border/80 bg-card/85 p-1.5 shadow-xl dark:shadow-[0_15px_40px_rgba(0,0,0,0.85)] dark:border-border backdrop-blur-md transition-all hover:bg-card/95 hover:border-border"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          <Palette className="size-5 transition-transform hover:scale-110" />
        </Button>

        <div className="w-5 h-px bg-border/60 my-0.5" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            primeAudioContext();
            playPhaseEndAlert();
          }}
          className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Testar alarme sonoro (alerta de fim de fase)"
          aria-label="Testar alarme sonoro de fim de fase"
        >
          <Volume2 className="size-5 transition-transform hover:scale-110" />
        </Button>

        <div className="w-5 h-px bg-border/60 my-0.5" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPresetsOpen(true)}
          className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Configurações de temporizadores (presets)"
          aria-label="Abrir configurações de temporizadores"
        >
          <Settings className="size-5 transition-transform hover:rotate-45" />
        </Button>
      </aside>

      {/* 2. Mobile (< sm): No cabeçalho: primeiro Lua/Sol, depois os 3 pontinhos (...) */}
      <div className="sm:hidden fixed top-2.5 right-4 z-30 flex items-center gap-1">
        {/* Ícone da Lua / Sol (ThemeToggle mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="size-8 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={isDark ? "Tema claro" : "Tema escuro"}
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        {/* Container relativo para os 3 pontinhos e o dropdown que desce */}
        <div className="relative flex flex-col items-end">
          {/* Botão dos 3 pontinhos (...) que abre/fecha */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`size-8 rounded-full transition-colors ${
              isMobileMenuOpen
                ? "bg-muted text-foreground"
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
                  setTheme(isDark ? "light" : "dark");
                }}
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                title="Alternar tema"
                aria-label="Alternar tema"
              >
                <Palette className="size-4" />
              </Button>

              <div className="w-px h-4 bg-border/60" aria-hidden />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  primeAudioContext();
                  playPhaseEndAlert();
                }}
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                title="Testar alarme sonoro"
                aria-label="Testar alarme sonoro"
              >
                <Volume2 className="size-4" />
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
