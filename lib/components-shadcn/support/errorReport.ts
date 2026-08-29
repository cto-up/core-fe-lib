/**
 * Bridge between `useErrors` and the host app's support desk / error tracker.
 *
 * core-fe-lib stays generic: it has no package.json and must not take a hard
 * `@sentry/*` dependency, or every future consumer inherits one. So the app
 * registers implementations at boot and core calls them if present. Same
 * pattern as `composables/planLimit.ts`.
 *
 * Nothing registered → no Report action is offered, and every consumer that
 * hasn't opted in behaves exactly as before.
 */
import type { SupportErrorContext } from "./types";

let reportHandler: ((ctx: SupportErrorContext) => void) | null = null;
let capture: ((error: unknown) => string | undefined) | null = null;

/** Registered by the app (see `MainAppLayout`) to open the support dialog
 *  pre-filled with the failure. Pass `null` to unregister. */
export function setErrorReportHandler(
  fn: ((ctx: SupportErrorContext) => void) | null
) {
  reportHandler = fn;
}

/** Whether a Report action can be offered at all. */
export function isErrorReportable(): boolean {
  return reportHandler !== null;
}

/** Returns true when a handler consumed the report. */
export function reportError(ctx: SupportErrorContext): boolean {
  if (!reportHandler) return false;
  reportHandler(ctx);
  return true;
}

/** Registered by the app at boot, e.g. `setErrorCapture(Sentry.captureException)`.
 *  Must return the tracker's event id so the user-visible reference and the
 *  tracked event are the same object. */
export function setErrorCapture(
  fn: ((error: unknown) => string | undefined) | null
) {
  capture = fn;
}

export function captureForReport(error: unknown): string | undefined {
  if (!capture) return undefined;
  try {
    return capture(error) || undefined;
  } catch {
    // Reporting must never be the thing that breaks error handling.
    return undefined;
  }
}

/**
 * A short reference the user can quote out loud and you can grep for.
 *
 * Prefers the tracker's event id so the toast and the tracked event line up;
 * the *full* id still travels in the report body, because searching Sentry by
 * id needs all 32 characters.
 */
export function mintReference(eventId?: string): string {
  const raw = (eventId ?? "").replace(/[^0-9a-f]/gi, "");
  const seed =
    raw.length >= 8
      ? raw.slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `ERR-${seed.toUpperCase()}`;
}
