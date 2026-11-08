import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App (Ambiente Base)", () => {
  it("deve renderizar o componente base sem erros", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /tomatimer/i })).toBeInTheDocument();
  });

  it("deve validar o acesso ao localStorage no ambiente de testes", () => {
    localStorage.setItem("test:key", "valor");
    expect(localStorage.getItem("test:key")).toBe("valor");
  });
});
