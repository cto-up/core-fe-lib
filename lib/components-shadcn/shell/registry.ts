import type { HubModule } from "./types";

let _modules: HubModule[] = [];

export function registerModules(modules: HubModule[]): void {
  _modules = [...modules];
}

export function getModules(): HubModule[] {
  return _modules;
}
