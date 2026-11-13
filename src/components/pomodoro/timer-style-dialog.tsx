"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  useTimerStyle,
  TIMER_STYLE_OPTIONS,
  type TimerStyle,
} from "@/components/theme/timer-style-provider";

interface TimerStyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimerStyleDialog({ open, onOpenChange }: TimerStyleDialogProps) {
  const { timerStyle, setTimerStyle } = useTimerStyle();
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const dragStartYRef = React.useRef<number | null>(null);

  const handleSelect = (id: TimerStyle) => {
    setTimerStyle(id);
  };

  const handleClose = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragOffsetY(0);
      onOpenChange(false);
    }, 240);
  }, [isClosing, onOpenChange]);

  // Fecha com a tecla ESC
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  if (!open && !isClosing) return null;

  return (
    <>
      {/* Backdrop escuro com DESFOQUE:
          - No desktop (sm:z-40): desfoca a página, mas deixa a barra lateral fixa (em z-[60]) 100% nítida!
          - No mobile (z-50): cobre o conteúdo da página sob o bottom sheet (em z-[60]) */}
      <div
        className={`fixed inset-0 z-50 sm:z-40 bg-black/60 backdrop-blur-sm transition-opacity ${
          isClosing ? "overlay-animate-out" : "overlay-animate-in"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* CARD FLUTUANTE DE ESTÉTICA (z-[60]):
          - Desktop (sm:): Fica ao lado da barra lateral (left-[88px] md:left-[96px] top-1/2 -translate-y-1/2)
          - Mobile (<sm): Bottom Sheet deslizando de baixo para cima com animação nativa fluida */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Personalizar estética do temporizador"
        style={{
          transform:
            dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: isDraggingSheet
            ? "none"
            : "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={`fixed z-[60] w-full sm:w-[500px] md:w-[540px] max-h-[85vh] sm:max-h-[85vh] inset-x-0 bottom-0 sm:inset-auto sm:left-[88px] md:sm:left-[96px] sm:top-1/2 sm:-translate-y-1/2 rounded-t-3xl sm:rounded-3xl border border-border/90 bg-card/95 text-card-foreground shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl flex flex-col overflow-hidden will-change-transform ${
          isDraggingSheet
            ? ""
            : isClosing
            ? "sheet-animate-out"
            : "sheet-animate-in"
        }`}
      >
        {/* Puxador para mobile (arrastar para baixo fecha) */}
        <button
          type="button"
          aria-label="Puxador: arraste para baixo ou clique para fechar"
          title="Fechar"
          onClick={handleClose}
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
            const deltaY = touch.clientY - dragStartYRef.current;
            if (deltaY > 0) {
              setDragOffsetY(deltaY);
            }
          }}
          onTouchEnd={() => {
            setIsDraggingSheet(false);
            if (dragOffsetY > 80) {
              handleClose();
            } else {
              setDragOffsetY(0);
            }
            dragStartYRef.current = null;
          }}
          className="sm:hidden mx-auto mt-2 mb-1 flex h-6 w-full items-center justify-center cursor-pointer touch-none select-none border-0 bg-transparent p-0 outline-none"
        >
          <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Estética
          </h2>
        </div>

        {/* Conteúdo com os Estilos Lado a Lado */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-5 custom-scrollbar">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {TIMER_STYLE_OPTIONS.map((option) => {
              const isSelected = timerStyle === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`group relative flex flex-col items-stretch overflow-hidden rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "border-primary/80 ring-2 ring-primary/40 shadow-md bg-accent/40"
                      : "border-border/70 hover:border-border hover:bg-muted/40 bg-card/60"
                  }`}
                >
                  {/* Badge de Check no canto superior direito quando selecionado */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex size-4 sm:size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-2.5 sm:size-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Prévia visual em miniatura */}
                  <div className="flex h-20 sm:h-28 items-center justify-center p-1.5 sm:p-2 bg-muted/20">
                    {option.id === "ring" && (
                      <div className="relative flex size-14 sm:size-20 items-center justify-center">
                        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            className="text-muted-foreground/25"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={(2 * Math.PI * 32) * 0.25}
                            className="text-primary"
                          />
                        </svg>
                        <span className="absolute font-sans text-[11px] sm:text-sm font-bold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}

                    {option.id === "ticks" && (
                      <div className="relative flex size-14 sm:size-20 items-center justify-center">
                        <svg viewBox="0 0 80 80" className="size-full">
                          {Array.from({ length: 36 }).map((_, i) => {
                            const angle = (i * 360) / 36;
                            const isFilled = i < 9;
                            return (
                              <line
                                key={i}
                                x1="40"
                                y1="5"
                                x2="40"
                                y2="11"
                                transform={`rotate(${angle} 40 40)`}
                                stroke="currentColor"
                                strokeWidth={isFilled ? "2.2" : "1"}
                                strokeLinecap="round"
                                className={
                                  isFilled
                                    ? "text-primary stroke-primary"
                                    : "text-muted-foreground/35"
                                }
                              />
                            );
                          })}
                        </svg>
                        <span className="absolute font-sans text-[11px] sm:text-sm font-bold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}

                    {option.id === "minimal" && (
                      <div className="relative flex size-14 sm:size-20 items-center justify-center rounded-full border border-dashed border-border/60 bg-muted/10">
                        <span className="font-sans text-[11px] sm:text-sm font-bold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Faixa inferior com o nome do estilo */}
                  <div
                    className={`px-1 py-1.5 sm:px-2 sm:py-2 text-center text-xs transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 text-muted-foreground group-hover:text-foreground font-medium"
                    }`}
                  >
                    <span className="block text-[10px] sm:text-xs leading-tight font-medium">
                      {option.id === "minimal" ? (
                        <>
                          <span className="sm:hidden">Números</span>
                          <span className="hidden sm:inline">Apenas números</span>
                        </>
                      ) : (
                        option.label
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
