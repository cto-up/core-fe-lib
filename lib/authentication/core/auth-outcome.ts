/**
 * What a session probe's result actually means.
 *
 * `KratosService.fetchSession` already draws the line correctly — a 401 returns
 * null ("no session"), anything else throws — and every caller that flattens
 * that back into a boolean re-introduces the same bug:
 *
 *   catch (error) { await updateUserFromSession(null); }
 *
 * That treats "we could not ask" as "there is no session" and signs the user
 * out on a failed fetch. It is the single highest-consequence defect in the
 * auth path, because the two cases look identical from the outside — every
 * request fails — and demand opposite behaviour.
 *
 * Retaining a session we could not confirm grants nothing: the backend
 * re-validates every request independently, so the worst case is one 401 that
 * the existing handler recovers from. Clearing one we could not confirm
 * destroys whatever the user had in flight. The asymmetry is the whole
 * argument, and it is why the unknown case fails toward "keep".
 */
export type AuthOutcome =
  | "authenticated"
  | "unauthenticated"
  | "network-unavailable";

function statusOf(x: unknown): number | undefined {
  if (typeof x !== "object" || x === null) return undefined;
  const record = x as Record<string, unknown>;

  // axios shape
  const response = record.response;
  if (typeof response === "object" && response !== null) {
    const status = (response as Record<string, unknown>).status;
    if (typeof status === "number") return status;
  }
  // fetch Response shape
  if (typeof record.status === "number") return record.status;

  return undefined;
}

function looksLikeSession(x: unknown): boolean {
  if (typeof x !== "object" || x === null) return false;
  const record = x as Record<string, unknown>;
  return typeof record.id === "string" && record.identity != null;
}

export function classifyAuthResponse(x: unknown): AuthOutcome {
  // fetchSession() resolves null for a 401: "no session", not "something broke".
  if (x === null) return "unauthenticated";
  if (x === undefined) return "network-unavailable";

  const status = statusOf(x);
  if (status !== undefined) {
    if (status === 401 || status === 403) return "unauthenticated";
    // 5xx included: a backend outage must not sign every user out.
    return "network-unavailable";
  }

  if (looksLikeSession(x)) return "authenticated";

  // Fail SAFE on the axis that matters — see the note above.
  return "network-unavailable";
}
