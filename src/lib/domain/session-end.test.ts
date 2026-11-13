import { describe, expect, it } from "vitest";
import { getSessionEndConfirmation } from "./session-end";

describe("Confirmação de encerramento da sessão", () => {
  it("usa o contexto de encerramento normal para uma sessão iniciada na página", () => {
    expect(getSessionEndConfirmation(false)).toEqual({
      type: "endSession",
      title: "Encerrar Sessão",
      description:
        "Deseja realmente encerrar a sessão ativa? O progresso do temporizador será removido.",
      confirmLabel: "Encerrar Sessão",
      isDestructive: true,
    });
  });

  it("usa o contexto de sessão retomada após uma reabertura", () => {
    expect(getSessionEndConfirmation(true)).toEqual({
      type: "discardResumedSession",
      title: "Encerrar Sessão Retomada",
      description:
        "Deseja realmente encerrar a sessão retomada? O progresso da sessão restaurada será descartado e o preset será liberado.",
      confirmLabel: "Encerrar Sessão",
      isDestructive: true,
    });
  });
});
