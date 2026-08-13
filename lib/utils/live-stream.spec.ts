import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openLiveStream } from "./sseHandler";

// A controllable EventSource. The real one is driven by the network, and the
// behaviour under test IS the network going wrong, so the fake has to be able
// to fail on command.
class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  closed = false;
  private listeners = new Map<string, Array<(e: unknown) => void>>();

  constructor(
    public url: string,
    public init?: { withCredentials?: boolean }
  ) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(name: string, cb: (e: unknown) => void) {
    const list = this.listeners.get(name) ?? [];
    list.push(cb);
    this.listeners.set(name, list);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(name: string, e: unknown = {}) {
    for (const cb of this.listeners.get(name) ?? []) cb(e);
  }

  /** The browser reconnected by itself and succeeded. */
  open() {
    this.readyState = FakeEventSource.OPEN;
    this.emit("open");
  }

  /** A drop the browser will retry on its own — the wrapper must not act. */
  transientError() {
    this.readyState = FakeEventSource.CONNECTING;
    this.emit("error");
  }

  /** A fatal close: the browser has given up for good. */
  fatalError() {
    this.readyState = FakeEventSource.CLOSED;
    this.emit("error");
  }
}

const original = globalThis.EventSource;

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.useFakeTimers();
  (globalThis as { EventSource: unknown }).EventSource = FakeEventSource;
});

afterEach(() => {
  vi.useRealTimers();
  (globalThis as { EventSource: unknown }).EventSource = original;
});

describe("openLiveStream", () => {
  it("wires listeners on the connection it opens", () => {
    const wire = vi.fn();
    openLiveStream("/events", wire);

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(wire).toHaveBeenCalledWith(FakeEventSource.instances[0]);
    expect(FakeEventSource.instances[0]!.init).toEqual({
      withCredentials: true,
    });
  });

  it("does not report the first open as a reconnect", () => {
    const onReconnect = vi.fn();
    openLiveStream("/events", () => {}, onReconnect);

    FakeEventSource.instances[0]!.open();
    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("reports the browser's own silent retry as a reconnect", () => {
    // The native retry reuses the same instance and just fires `open` again.
    // Nothing is replayed across that gap, so a caller that never hears about
    // it goes on showing state that changed while it was not listening.
    const onReconnect = vi.fn();
    openLiveStream("/events", () => {}, onReconnect);

    const es = FakeEventSource.instances[0]!;
    es.open();
    es.transientError();
    es.open();

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("leaves a transient error to the browser", () => {
    openLiveStream("/events", () => {});
    FakeEventSource.instances[0]!.transientError();
    vi.advanceTimersByTime(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]!.closed).toBe(false);
  });

  it("reconnects after a fatal close, which a bare EventSource never does", () => {
    const wire = vi.fn();
    const onReconnect = vi.fn();
    openLiveStream("/events", wire, onReconnect);

    FakeEventSource.instances[0]!.open();
    FakeEventSource.instances[0]!.fatalError();
    expect(FakeEventSource.instances).toHaveLength(1); // waiting out the backoff

    vi.advanceTimersByTime(1000);
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(wire).toHaveBeenCalledTimes(2); // listeners re-wired on the new one

    FakeEventSource.instances[1]!.open();
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("backs off on repeated failures and caps the delay", () => {
    openLiveStream("/events", () => {});

    const fail = (afterMs: number) => {
      FakeEventSource.instances.at(-1)!.fatalError();
      vi.advanceTimersByTime(afterMs - 1);
      const before = FakeEventSource.instances.length;
      vi.advanceTimersByTime(1);
      expect(FakeEventSource.instances.length).toBe(before + 1);
    };

    fail(1000);
    fail(2000);
    fail(4000);
    fail(8000);
    fail(15000); // capped — 16000 would exceed it
    fail(15000);
  });

  it("resets the backoff once a connection is healthy again", () => {
    openLiveStream("/events", () => {});

    FakeEventSource.instances[0]!.fatalError();
    vi.advanceTimersByTime(1000);
    FakeEventSource.instances[1]!.fatalError();
    vi.advanceTimersByTime(2000);
    FakeEventSource.instances[2]!.open(); // healthy

    FakeEventSource.instances[2]!.fatalError();
    vi.advanceTimersByTime(1000);
    expect(FakeEventSource.instances).toHaveLength(4);
  });

  it("stops for good once disposed", () => {
    const dispose = openLiveStream("/events", () => {});
    const es = FakeEventSource.instances[0]!;

    dispose();
    expect(es.closed).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("does not reconnect when disposed while waiting out a backoff", () => {
    const dispose = openLiveStream("/events", () => {});
    FakeEventSource.instances[0]!.fatalError();

    dispose();
    vi.advanceTimersByTime(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);
  });
});
