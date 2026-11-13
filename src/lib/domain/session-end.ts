export type SessionEndConfirmation = {
  type: "endSession" | "discardResumedSession";
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive: true;
};

export function getSessionEndConfirmation(
  isResumedSession: boolean,
): SessionEndConfirmation {
  if (isResumedSession) {
    return {
      type: "discardResumedSession",
      title: "Encerrar Sessão Retomada",
      description:
        "Deseja realmente encerrar a sessão retomada? O progresso da sessão restaurada será descartado e o preset será liberado.",
      confirmLabel: "Encerrar Sessão",
      isDestructive: true,
    };
  }

  return {
    type: "endSession",
    title: "Encerrar Sessão",
    description:
      "Deseja realmente encerrar a sessão ativa? O progresso do temporizador será removido.",
    confirmLabel: "Encerrar Sessão",
    isDestructive: true,
  };
}
