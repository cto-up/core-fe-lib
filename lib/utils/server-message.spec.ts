import { describe, expect, it } from "vitest";
import axios, { AxiosError } from "axios";
import { serverMessageOf } from "./server-message";

describe("serverMessageOf", () => {
  it("reads the server's message off a generated ApiError", () => {
    expect(
      serverMessageOf({
        status: 402,
        body: { message: "no credits left on this meter" },
      })
    ).toBe("no credits left on this meter");
  });

  it("reads the server's error key when that is all it sent", () => {
    expect(
      serverMessageOf({ status: 400, body: { error: "title is required" } })
    ).toBe("title is required");
  });

  it("reads the response body of a raw axios error, not 'status code 500'", () => {
    const error = new AxiosError(
      "Request failed with status code 500",
      "ERR_BAD_RESPONSE",
      undefined,
      null,
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: { headers: {} } as never,
        data: { message: "the upload root is not writable" },
      }
    );
    expect(serverMessageOf(error)).toBe("the upload root is not writable");
  });

  it("returns null when nothing quotable traveled with the failure", () => {
    const network = new AxiosError("Network Error", "ERR_NETWORK");
    expect(axios.isAxiosError(network)).toBe(true);
    expect(serverMessageOf(network)).toBeNull();
    expect(serverMessageOf(undefined)).toBeNull();
  });

  it("keeps a plain Error's own message", () => {
    expect(serverMessageOf(new Error("the cropper had no canvas"))).toBe(
      "the cropper had no canvas"
    );
  });
});
