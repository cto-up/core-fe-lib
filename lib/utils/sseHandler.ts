import { type AxiosProgressEvent } from "axios";

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
