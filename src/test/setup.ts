import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Garante uma implementação padrão e estável de localStorage para o ambiente de testes
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }
}

const mockStorage = new LocalStorageMock();

Object.defineProperty(window, "localStorage", {
  value: mockStorage,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
