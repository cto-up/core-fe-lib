/**
 * The sentence a failed request carries, for a line that says what went wrong.
 * Generated ApiErrors keep the server's own words in `body.error` or
 * `body.message`, axios errors in `response.data`; anything else falls back to
 * its message, then to its text.
 */
export function errorReason(e: unknown): string {
  if (typeof e === "string") return e;
  const err = e as {
    body?: unknown;
    response?: { data?: unknown };
    message?: unknown;
    statusText?: unknown;
  } | null;
  for (const payload of [err?.body, err?.response?.data]) {
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload && typeof payload === "object") {
      const p = payload as { error?: unknown; message?: unknown };
      if (typeof p.error === "string" && p.error) return p.error;
      if (typeof p.message === "string" && p.message) return p.message;
    }
  }
  if (typeof err?.message === "string" && err.message) return err.message;
  if (typeof err?.statusText === "string" && err.statusText)
    return err.statusText;
  return String(e);
}
