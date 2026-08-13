import { type AxiosProgressEvent } from "axios";

// ---------------------------------------------------------------------------
// Three SSE helpers live in this file, covering three distinct transports.
// Keep them side-by-side so the "which one do I use?" decision is visible
// in one place:
//
//   - `handleSSEProgress`  →  axios POST with `onDownloadProgress`. Wraps
//     a chat-specific payload shape (`{eventType: "MSG"|"INFO"|"ERROR"}`)
//     and handles only the `message` event name. Used by chat streams.
//
//   - `readSSEStream`      →  `fetch` POST with `ReadableStream` body.
//     Payload-agnostic async generator — the caller decides how to parse
//     `data` for each event name. Used anywhere the producer emits a
//     custom event-name vocabulary (e.g. `chunk` / `done` / `error`).
//
//   - `openLiveStream`     →  `EventSource` GET, for a stream that stays
//     open across the life of a view. This file used to say EventSource
//     needed no helper — "instantiate it directly". It does need one: a
//     bare EventSource stops retrying for good after one fatal close, and
//     a long-lived surface then looks connected while receiving nothing.
// ---------------------------------------------------------------------------

export interface SSEEvent {
  eventType: string;
  message: string;
  progress?: number;
}

export interface SSEHandlerOptions<T> {
  onMessage?: (content: string) => void;
  onInfo?: (message: string) => void;
  onError?: (message: string) => void;
  onProgress?: (progress: number) => void;
  stateUpdater?: (updater: (prev: T) => T) => void;
  getStateValue?: (state: T) => string | null;
  stateKey?: keyof T;
}

export function handleSSEProgress<T>(
  progressEvent: AxiosProgressEvent,
  lastProcessedPosition: { current: number },
  fullResponseText: { current: string },
  options: SSEHandlerOptions<T>
) {
  const xhr = progressEvent.event.target as XMLHttpRequest;
  const responseText = xhr.responseText;

  // Handle partial responses. A network chunk may end mid-line, so only
  // consume bytes up to the last newline and leave any partial tail in the
  // XHR buffer to be re-read on the next progress event. Without this, an
  // SSE `data:` line split across chunks is silently dropped.
  const pending = responseText.slice(lastProcessedPosition.current);
  const lastNewline = pending.lastIndexOf("\n");
  if (lastNewline === -1) {
    return;
  }
  const newData = pending.slice(0, lastNewline + 1);
  lastProcessedPosition.current += lastNewline + 1;
  fullResponseText.current += newData;

  try {
    // Each chunk might contain multiple SSE messages
    const lines = newData.split("\n");
    let currentEvent = "";
    let jsonData = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("event:")) {
        currentEvent = line.substring(6).trim();
      } else if (line.startsWith("data:")) {
        jsonData = line.substring(5).trim();

        // Process this event if we have both event type and data
        if (currentEvent === "message" && jsonData) {
          try {
            const event = JSON.parse(jsonData) as SSEEvent;

            switch (event.eventType) {
              case "MSG":
                if (
                  options.stateUpdater &&
                  options.stateKey !== undefined &&
                  options.getStateValue
                ) {
                  options.stateUpdater((prev) => {
                    const currentContent = options.getStateValue!(prev) || "";
                    // Set loading to false if progress is 100%
                    const isLoading = event.progress
                      ? event.progress < 100
                      : true;
                    return {
                      ...prev,
                      [options.stateKey as keyof T]: {
                        loading: isLoading,
                        content: currentContent + (event.message || ""),
                        error: null,
                      },
                    };
                  });
                }
                options.onMessage?.(event.message);
                break;
              case "INFO":
                options.onInfo?.(event.message);
                break;
              case "ERROR":
                console.error("Error:", event.message);
                if (
                  options.stateUpdater &&
                  options.stateKey !== undefined &&
                  options.getStateValue
                ) {
                  options.stateUpdater((prev) => ({
                    ...prev,
                    [options.stateKey as keyof T]: {
                      loading: false,
                      content: options.getStateValue?.(prev),
                      error: event.message,
                    },
                  }));
                }
                options.onError?.(event.message);
                break;
              default:
                break;
            }

            if (event.progress !== undefined) {
              options.onProgress?.(event.progress);
            }
          } catch (parseErr) {
            console.error("Error parsing JSON data:", parseErr, jsonData);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error processing SSE data:", err);
    console.debug("Problematic data:", newData);
  }
}

// ---------------------------------------------------------------------------
// readSSEStream — generic SSE reader for `fetch` + `ReadableStream`
// ---------------------------------------------------------------------------

/**
 * One decoded SSE message. `event` defaults to `""` when the producer
 * omits the `event:` line (the WHATWG spec treats this as the default
 * "message" event). `data` is the concatenation of all `data:` lines
 * in the block, joined with `\n` — callers that expect JSON should
 * `JSON.parse` it themselves.
 */
export interface SSEMessage {
  event: string;
  data: string;
  id?: string;
}

/**
 * Read a Server-Sent Events stream from a `fetch` Response, yielding
 * one `SSEMessage` per `event + data` block. Implements the WHATWG
 * HTML Living Standard parsing rules: strip exactly one space after
 * the field colon, join multi-line `data` with "\n", treat blank
 * lines as block separators, ignore comment lines starting with ":".
 *
 * Why this helper exists alongside `handleSSEProgress`: `EventSource`
 * is GET-only so it can't hit POST endpoints, and `handleSSEProgress`
 * is axios-bound with a fixed payload shape. This one covers the
 * remaining case — a POST `fetch` with a streamed body and an
 * application-defined event vocabulary.
 *
 * Usage:
 * ```ts
 * const res = await fetch(url, {
 *   method: "POST",
 *   headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
 *   body: JSON.stringify(payload),
 * });
 * if (!res.ok) throw new Error(`HTTP ${res.status}`);
 * for await (const { event, data } of readSSEStream(res)) {
 *   if (event === "chunk") handleChunk(data);
 *   else if (event === "done") return JSON.parse(data);
 * }
 * ```
 *
 * Responsibilities kept by the caller:
 *   - HTTP error handling BEFORE iterating (`res.ok`).
 *   - Abort via AbortController on the fetch — the generator surfaces
 *     the rejected `reader.read()` as an exception on the next
 *     iteration.
 *   - Parsing `data` as JSON when the producer emits JSON (some
 *     servers send raw text tokens, others send JSON structures, so
 *     this helper stays payload-agnostic).
 */
export async function* readSSEStream(
  response: Response
): AsyncGenerator<SSEMessage> {
  if (!response.body) {
    throw new Error("ReadableStream not supported in this environment");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Flush a trailing block that wasn't terminated by "\n\n"
        // (well-behaved servers emit it; tolerant here for safety).
        if (buffer.length > 0) {
          const msg = parseSSEBlock(buffer);
          if (msg) yield msg;
        }
        return;
      }
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const msg = parseSSEBlock(block);
        if (msg) yield msg;
      }
    }
  } finally {
    reader.releaseLock?.();
  }
}

function parseSSEBlock(block: string): SSEMessage | null {
  let event = "";
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line === "") continue;
    if (line.startsWith(":")) continue; // comment

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const rawValue = colon === -1 ? "" : line.slice(colon + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    switch (field) {
      case "event":
        event = value;
        break;
      case "data":
        dataLines.push(value);
        break;
      case "id":
        id = value;
        break;
      // `retry` is intentionally ignored: this reader doesn't reconnect.
      // Callers that need reconnection semantics can wrap readSSEStream.
    }
  }

  if (dataLines.length === 0) return null;
  return id !== undefined
    ? { event, data: dataLines.join("\n"), id }
    : { event, data: dataLines.join("\n") };
}

// ---------------------------------------------------------------------------
// openLiveStream — EventSource with app-level reconnection
// ---------------------------------------------------------------------------

/**
 * Open a long-lived `EventSource` that keeps reconnecting, and tell the caller
 * when it had to.
 *
 * Native `EventSource` only auto-retries a *network* drop (readyState →
 * CONNECTING). On a *fatal* close — a transient non-200 on a reconnect attempt,
 * or a response that isn't `text/event-stream` (e.g. a proxy hiccup) — it goes
 * to CLOSED and NEVER retries again. A live stream that silently dies for good
 * after one blip is worse than no live stream at all: the surface goes on
 * looking connected while it has stopped receiving anything. This wrapper
 * re-creates the connection with capped backoff and re-runs `wire` on the fresh
 * one.
 *
 * `onReconnect` fires on every successful open EXCEPT the first, covering both
 * the browser's own retry and this wrapper's. Nothing is replayed across a gap,
 * so a caller whose server only emits deltas MUST use this to re-read its state
 * — the interesting change is precisely the one that happened while it was not
 * listening. Callers whose server re-emits a snapshot on connect can ignore it.
 *
 * `wire` registers the listeners; it is called once per connection, so register
 * them there rather than on the returned handle.
 *
 * Usage:
 * ```ts
 * const dispose = openLiveStream(
 *   `${import.meta.env.VITE_HTTP_API ?? ""}/api/v1/thing/${id}/events`,
 *   (es) => {
 *     es.addEventListener("tally", (e) => onTally(JSON.parse(e.data)));
 *   },
 *   () => void refetch()
 * );
 * onUnmounted(dispose);
 * ```
 *
 * @returns a disposer that permanently closes the stream (no further retries).
 */
export function openLiveStream(
  url: string,
  wire: (es: EventSource) => void,
  onReconnect?: () => void
): () => void {
  let es: EventSource | null = null;
  let disposed = false;
  let opened = false;
  let backoff = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (disposed) return;
    es = new EventSource(url, { withCredentials: true });

    es.addEventListener("open", () => {
      // A healthy open resets the backoff so the next blip retries quickly.
      backoff = 1000;
      if (opened) onReconnect?.();
      opened = true;
    });

    es.addEventListener("error", () => {
      // CONNECTING → the browser will retry itself; leave it alone. Only step
      // in once it has permanently given up (CLOSED).
      if (!es || es.readyState !== EventSource.CLOSED) return;
      es.close();
      es = null;
      if (disposed) return;
      retryTimer = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 15000);
    });

    wire(es);
  };
  connect();

  return () => {
    disposed = true;
    if (retryTimer) clearTimeout(retryTimer);
    es?.close();
    es = null;
  };
}
