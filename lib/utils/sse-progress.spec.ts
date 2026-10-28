import type { AxiosProgressEvent } from "axios";
import { describe, expect, it, vi } from "vitest";
import { flushSSEProgress, handleSSEProgress } from "./sseHandler";

function progressOf(responseText: string): AxiosProgressEvent {
  return {
    event: { target: { responseText } },
  } as unknown as AxiosProgressEvent;
}

const frame = (body: object) =>
  `event:message\ndata:${JSON.stringify(body)}\n\n`;

describe("handleSSEProgress across chunks", () => {
  it("keeps an event name whose data arrives in the next chunk", () => {
    const onInfo = vi.fn();
    const pos = { current: 0 };
    const full = { current: "" };
    const all = frame({ eventType: "INFO", message: "uri:/f/1", progress: 50 });
    const split = all.indexOf("data:");

    handleSSEProgress(progressOf(all.slice(0, split)), pos, full, { onInfo });
    handleSSEProgress(progressOf(all), pos, full, { onInfo });

    expect(onInfo).toHaveBeenCalledWith("uri:/f/1");
  });

  it("reports an unreadable data line instead of dropping it", () => {
    const onError = vi.fn();
    handleSSEProgress(
      progressOf("event:message\ndata:{not json\n\n"),
      { current: 0 },
      { current: "" },
      { onError }
    );
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("does not report an ERROR as progress 100", () => {
    const onError = vi.fn();
    const onProgress = vi.fn();
    handleSSEProgress(
      progressOf(
        frame({ eventType: "ERROR", message: "disk full", progress: 100 })
      ),
      { current: 0 },
      { current: "" },
      { onError, onProgress }
    );
    expect(onError).toHaveBeenCalledWith("disk full");
    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe("flushSSEProgress", () => {
  it("reads a last event left without a trailing newline", () => {
    const onProgress = vi.fn();
    const text =
      'event:message\ndata:{"eventType":"INFO","message":"ok","progress":100}';
    const pos = { current: 0 };
    const full = { current: "" };
    handleSSEProgress(progressOf(text), pos, full, { onProgress });
    expect(onProgress).not.toHaveBeenCalled();

    flushSSEProgress(text, pos, full, { onProgress });
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it("reports a truncated tail through onError", () => {
    const onError = vi.fn();
    const text = 'event:message\ndata:{"eventType":"INF';
    const pos = { current: 0 };
    handleSSEProgress(progressOf(text), pos, { current: "" }, { onError });
    flushSSEProgress(text, pos, { current: "" }, { onError });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
