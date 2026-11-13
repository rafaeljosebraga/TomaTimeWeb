import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PresetSelector } from "./preset-selector";
import type { TimerPreset } from "@/types/domain";

const presets: TimerPreset[] = [
  {
    id: "classic",
    name: "Clássico 25/5",
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  },
  {
    id: "extended",
    name: "Foco Estendido",
    focusMinutes: 50,
    shortBreakMinutes: 10,
    cyclesBeforeLongBreak: 3,
    longBreakMinutes: 20,
  },
];

function renderSelector(overrides: Partial<React.ComponentProps<typeof PresetSelector>> = {}) {
  return render(
    <PresetSelector
      presets={presets}
      activePresetId="classic"
      onSelect={vi.fn()}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      {...overrides}
    />,
  );
}

describe("PresetSelector", () => {
  it("exibe os presets e a opção de criar no dropdown", () => {
    renderSelector();

    const trigger = screen.getByRole("button", { name: "Selecionar preset do timer" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    expect(screen.getByRole("menuitem", { name: /Clássico 25\/5/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Foco Estendido/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Criar novo preset/ })).toBeInTheDocument();
  });

  it("troca para o botão de criação quando não há presets", () => {
    const onCreate = vi.fn();
    renderSelector({ presets: [], onCreate });

    fireEvent.click(screen.getByRole("button", { name: /Criar/ }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Selecionar preset do timer" })).not.toBeInTheDocument();
  });
});
