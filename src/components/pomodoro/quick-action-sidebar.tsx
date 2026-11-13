import { useState, useRef, useEffect } from "react";
import { Palette, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TimerStyleDialog } from "@/components/pomodoro/timer-style-dialog";
import {
  playPhaseEndAlert,
  primeAudioContext,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/audio/sound-alert";

export function QuickActionSidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosingMobileMenu, setIsClosingMobileMenu] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const isDark = resolvedTheme === "dark";
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCloseMobileMenu = () => {
    if (isClosingMobileMenu || !isMobileMenuOpen) return;
    setIsClosingMobileMenu(true);
    closeTimeoutRef.current = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsClosingMobileMenu(false);
    }, 160);
  };

  const handleToggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      handleCloseMobileMenu();
    } else {
      setIsClosingMobileMenu(false);
      setIsMobileMenuOpen(true);
    }
  };

  // Limpa timer se o componente desmontar
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Fecha o menu móvel ao clicar/tocar fora ou pressionar ESC
  useEffect(() => {
    if (!isMobileMenuOpen || isClosingMobileMenu) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        handleCloseMobileMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseMobileMenu();
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
  }, [isMobileMenuOpen, isClosingMobileMenu]);

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
      <aside
        aria-label="Ações rápidas e preferências"
        className={`hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-border/80 bg-card/85 p-1.5 shadow-xl dark:shadow-[0_15px_40px_rgba(0,0,0,0.85)] dark:border-border backdrop-blur-md transition-all hover:bg-card/95 hover:border-border ${
          isStyleDialogOpen ? "z-[60]" : "z-30"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsStyleDialogOpen((prev) => !prev)}
          className={`size-10 rounded-full transition-all duration-300 ease-out active:scale-90 ${
            isStyleDialogOpen
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
          title={isStyleDialogOpen ? "Fechar estética" : "Estética (Estilo do temporizador)"}
          aria-label={isStyleDialogOpen ? "Fechar opções de estética" : "Personalizar estilo do temporizador"}
          aria-expanded={isStyleDialogOpen}
        >
          <Palette
            className={`size-5 transition-transform duration-300 ease-out ${
              isStyleDialogOpen ? "-rotate-45 scale-110" : "rotate-0 scale-100 hover:scale-110"
            }`}
          />
        </Button>

        <div className="w-5 h-px bg-border/60 my-0.5" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSound}
          className={`relative size-10 rounded-full transition-all duration-300 ease-out active:scale-90 overflow-hidden ${
            !soundEnabled
              ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
          title={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
          aria-label={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
        >
          <Volume2
            className={`size-5 transition-all duration-300 ease-in-out ${
              soundEnabled
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0 absolute"
            }`}
          />
          <VolumeX
            className={`size-5 transition-all duration-300 ease-in-out ${
              soundEnabled
                ? "rotate-90 scale-0 opacity-0 absolute"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
        </Button>

      </aside>

      <div className="sm:hidden fixed top-2 right-4 z-30 flex items-center gap-2">
        {/* Ícone da Lua / Sol com rotação animada */}
        <ThemeToggle />

        {/* Container relativo para os 3 pontinhos e o dropdown que desce */}
        <div ref={mobileMenuRef} className="relative flex flex-col items-end">
          {/* Botão dos 3 pontinhos (...) que abre/fecha */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMobileMenu}
            className={`size-8 rounded-full transition-all duration-200 active:scale-90 ${
              isMobileMenuOpen
                ? "bg-neutral-200 text-neutral-900 ring-1 ring-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:ring-neutral-600 shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-label={isMobileMenuOpen ? "Fechar menu de opções" : "Abrir menu de opções"}
            title="Mais opções"
          >
            <MoreHorizontal className="size-4" />
          </Button>

          {/* Pílula que desce ABAIXO dos 3 pontinhos com animação fluida de entrada e saída */}
          {isMobileMenuOpen && (
            <div
              className={`absolute top-11 right-0 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur-md will-change-transform ${
                isClosingMobileMenu ? "mobile-pill-out" : "mobile-pill-in"
              }`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsStyleDialogOpen((prev) => !prev);
                  handleCloseMobileMenu();
                }}
                className={`size-8 rounded-full transition-all duration-300 ease-out active:scale-90 ${
                  isStyleDialogOpen
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title="Estética (Estilo do temporizador)"
                aria-label="Personalizar estilo do temporizador"
                aria-expanded={isStyleDialogOpen}
              >
                <Palette
                  className={`size-4 transition-transform duration-300 ease-out ${
                    isStyleDialogOpen ? "-rotate-45 scale-110" : "rotate-0 scale-100"
                  }`}
                />
              </Button>

              <div className="w-px h-4 bg-border/60" aria-hidden />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSound}
                className={`relative size-8 rounded-full transition-all duration-300 ease-out active:scale-90 overflow-hidden ${
                  !soundEnabled
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
                aria-label={soundEnabled ? "Desativar som do alarme" : "Ativar som do alarme"}
              >
                <Volume2
                  className={`size-4 transition-all duration-300 ease-in-out ${
                    soundEnabled
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-0 opacity-0 absolute"
                  }`}
                />
                <VolumeX
                  className={`size-4 transition-all duration-300 ease-in-out ${
                    soundEnabled
                      ? "rotate-90 scale-0 opacity-0 absolute"
                      : "rotate-0 scale-100 opacity-100"
                  }`}
                />
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

    </>
  );
}
