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
  const dragStartYRef = React.useRef<number | null>(null);

  const handleSelect = (id: TimerStyle) => {
    setTimerStyle(id);
  };

  const handleClose = React.useCallback(() => {
    setDragOffsetY(0);
    onOpenChange(false);
  }, [onOpenChange]);

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

  if (!open) return null;

  return (
    <>
      {/* Backdrop escuro com DESFOQUE (backdrop-blur-sm / backdrop-blur-md) em z-40:
          O fundo da página fica ofuscado/desfocado, mas a barra lateral de 3 botões (em z-50)
          permanece à frente, 100% nítida e visível junto com o card de Estética! */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* CARD FLUTUANTE DE ESTÉTICA (z-50):
          - Desktop (sm:): Fica ao lado da barra lateral (left-[72px] top-1/2 -translate-y-1/2),
            ambos em z-50, nítidos juntos em cima do fundo desfocado!
          - Mobile (<sm): Bottom Sheet ergonômico no rodapé com drag-to-dismiss. */}
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
        className="fixed z-50 w-full sm:w-[500px] md:w-[540px] max-h-[85vh] sm:max-h-[85vh] inset-x-0 bottom-0 sm:inset-auto sm:left-[88px] md:sm:left-[96px] sm:top-1/2 sm:-translate-y-1/2 rounded-t-3xl sm:rounded-3xl border border-border/90 bg-card/95 text-card-foreground shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl flex flex-col overflow-hidden will-change-transform animate-in slide-in-from-bottom sm:slide-in-from-left-4 fade-in-50 duration-200 ease-out"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {TIMER_STYLE_OPTIONS.map((option) => {
              const isSelected = timerStyle === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`group relative flex flex-col items-stretch overflow-hidden rounded-2xl border text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "border-primary/80 ring-2 ring-primary/40 shadow-md bg-accent/40"
                      : "border-border/70 hover:border-border hover:bg-muted/40 bg-card/60"
                  }`}
                >
                  {/* Badge de Check no canto superior direito quando selecionado */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 flex size-4 sm:size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-2.5 sm:size-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Prévia visual em miniatura */}
                  <div className="flex h-24 sm:h-28 items-center justify-center p-2 bg-muted/20">
                    {option.id === "ring" && (
                      <div className="relative flex size-16 sm:size-20 items-center justify-center">
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
                        <span className="absolute font-mono text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}

                    {option.id === "ticks" && (
                      <div className="relative flex size-16 sm:size-20 items-center justify-center">
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
                        <span className="absolute font-mono text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}

                    {option.id === "minimal" && (
                      <div className="flex items-center justify-center">
                        <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-foreground">
                          25:00
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Faixa inferior com o nome do estilo */}
                  <div
                    className={`px-2 py-1.5 sm:py-2 text-center text-xs transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 text-muted-foreground group-hover:text-foreground font-medium"
                    }`}
                  >
                    <span className="truncate block">
                      {option.label}
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
