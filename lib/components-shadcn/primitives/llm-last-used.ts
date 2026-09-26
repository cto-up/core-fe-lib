// The model this browser last saved an LLM choice with. A new record starts
// from it rather than from a hard-coded default, which may be a model the
// workspace holds no key for (hub#252).
export const LAST_USED_LLM_STORAGE_KEY = "lastUsedLLM";

export function readLastUsedLLM(): string {
  try {
    return localStorage.getItem(LAST_USED_LLM_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberLastUsedLLM(llmKey: string) {
  if (!llmKey) return;
  try {
    localStorage.setItem(LAST_USED_LLM_STORAGE_KEY, llmKey);
  } catch {
    // Private window or blocked storage: the next form starts from the list.
  }
}
