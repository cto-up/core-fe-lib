export enum EventType {
  INFO = "INFO",
  MSG = "MSG",
  ERROR = "ERROR",
}

export interface ReceivedEvent {
  eventType: EventType;
  message: string;
}

export interface ReceivedProgressEvent extends ReceivedEvent {
  progress: number;
}

export function ExtractJSONObject(rawData: string): ReceivedProgressEvent[] {
  const lines = rawData.split(/[\n\r]/g);

  const eventArray = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.replace("data:", "")));

  if (eventArray.length <= 0) {
    throw new Error("Unable to locate JSON data.");
  }

  return eventArray;
}

// Re-export the shared SSE reader so in-repo callers can import it via
// `@/shell/events` alongside the legacy `ExtractJSONObject`. The actual
// implementation lives in `core-fe-lib/utils/sseHandler` — see
// CLAUDE.md § SSE helpers for the decision tree.
export { readSSEStream, type SSEMessage } from "../../utils/sseHandler";
