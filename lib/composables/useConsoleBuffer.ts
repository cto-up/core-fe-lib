/**
 * A tiny in-memory ring buffer of console errors/warnings and uncaught
 * failures, so a support report can carry the last few lines that led to a
 * problem. Install it once at app boot (`installConsoleBuffer()`); nothing is
 * sent anywhere until the user submits a support request.
 */
export interface ConsoleEntry {
  ts: string;
  level: "error" | "warn" | "log";
  message: string;
}

const MAX_ENTRIES = 100;
const buffer: ConsoleEntry[] = [];
let installed = false;

function formatArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function push(level: ConsoleEntry["level"], args: unknown[]) {
  buffer.push({
    ts: new Date().toISOString(),
    level,
    message: args.map(formatArg).join(" "),
  });
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

export function installConsoleBuffer() {
  if (installed) return;
  installed = true;

  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: unknown[]) => {
    push("error", args);
    origError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    push("warn", args);
    origWarn.apply(console, args);
  };

  globalThis.addEventListener("error", (e) => {
    push("error", [e.message, e.filename, `${e.lineno}:${e.colno}`]);
  });
  globalThis.addEventListener("unhandledrejection", (e) => {
    push("error", ["unhandledrejection", e.reason]);
  });
}

export function useConsoleBuffer() {
  return {
    getEntries: (limit?: number): ConsoleEntry[] =>
      limit ? buffer.slice(-limit) : buffer.slice(),
    clear: () => {
      buffer.length = 0;
    },
  };
}
