import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import * as presetsStorage from "@/lib/storage/presets-storage";
import * as sessionStorageModule from "@/lib/storage/session-storage";
import * as sessionTimer from "@/lib/domain/session-timer";
import * as validatePreset from "@/lib/domain/validate-preset";

// Em desenvolvimento, expõe utilitários no console para testes manuais via DevTools
if (import.meta.env.DEV) {
  (window as unknown as { tomatimer: unknown }).tomatimer = {
    ...presetsStorage,
    ...sessionStorageModule,
    ...sessionTimer,
    ...validatePreset,
  };
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz #root não encontrado no DOM.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
