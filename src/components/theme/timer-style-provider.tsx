"use client";

import * as React from "react";

export type TimerStyle = "ring" | "ticks" | "minimal";

export interface TimerStyleOption {
  id: TimerStyle;
  label: string;
  description: string;
}

export const TIMER_STYLE_OPTIONS: TimerStyleOption[] = [
  {
    id: "ring",
    label: "Anel",
    description: "Anel contínuo com brilho suave",
  },
  {
    id: "ticks",
    label: "Marcadores",
    description: "Linhas radiais de precisão com trilho",
  },
  {
    id: "minimal",
    label: "Apenas números",
    description: "Foco total na contagem sem anel",
  },
];

const TIMER_STYLE_STORAGE_KEY = "tomatimer-timer-style";

type TimerStyleContextType = {
  timerStyle: TimerStyle;
  setTimerStyle: (style: TimerStyle) => void;
};

const TimerStyleContext = React.createContext<TimerStyleContextType | undefined>(
  undefined
);

export function TimerStyleProvider({
  children,
  defaultStyle = "ring",
}: {
  children: React.ReactNode;
  defaultStyle?: TimerStyle;
}) {
  const [timerStyle, setTimerStyleState] = React.useState<TimerStyle>(() => {
    if (typeof window === "undefined") return defaultStyle;
    try {
      const stored = localStorage.getItem(TIMER_STYLE_STORAGE_KEY);
      if (stored === "ring" || stored === "ticks" || stored === "minimal") {
        return stored;
      }
    } catch {
      // fallback caso o storage esteja bloqueado
    }
    return defaultStyle;
  });

  const setTimerStyle = React.useCallback((newStyle: TimerStyle) => {
    try {
      localStorage.setItem(TIMER_STYLE_STORAGE_KEY, newStyle);
    } catch {
      // storage desabilitado ou sem espaço
    }
    setTimerStyleState(newStyle);
  }, []);

  return (
    <TimerStyleContext.Provider value={{ timerStyle, setTimerStyle }}>
      {children}
    </TimerStyleContext.Provider>
  );
}

export function useTimerStyle(): TimerStyleContextType {
  const context = React.useContext(TimerStyleContext);
  if (!context) {
    throw new Error(
      "useTimerStyle deve ser utilizado dentro de um TimerStyleProvider"
    );
  }
  return context;
}

