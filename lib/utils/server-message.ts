import axios from "axios";

/**
 * The server's own message from a failed axios request, or from a generated
 * ApiError. A toast that shows only "Request failed with status code 500"
 * drops what the server said, and the user cannot act on a cause they never
 * see. Null when the failure has nothing to quote (a dropped connection).
 */
export function serverMessageOf(error: unknown): string | null {
  const body = (error as { body?: { message?: unknown; error?: unknown } })
    ?.body;
  if (typeof body?.message === "string" && body.message) return body.message;
  if (typeof body?.error === "string" && body.error) return body.error;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;
    if (typeof data?.message === "string" && data.message) return data.message;
    if (typeof data?.error === "string" && data.error) return data.error;
    return null;
  }
  if (
    error instanceof Error &&
    !(error as { status?: unknown }).status &&
    error.message !== "Network Error"
  ) {
    return error.message;
  }
  return null;
}
