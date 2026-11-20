import { describe, expect, it } from "vitest";
import { ServerResponse, IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { noImmutableDevCache, revalidateImmutable } from "./dev-cache";

function response() {
  const req = new IncomingMessage(new Socket());
  const res = new ServerResponse(req);
  revalidateImmutable(req, res, () => {});
  return res;
}

describe("noImmutableDevCache", () => {
  it("turns Vite's immutable dependency header into a revalidation", () => {
    const res = response();
    res.setHeader("Cache-Control", "max-age=31536000,immutable");
    expect(res.getHeader("cache-control")).toBe("no-cache");
  });

  it("leaves every other header alone", () => {
    const res = response();
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/javascript");
    expect(res.getHeader("cache-control")).toBe("no-cache");
    expect(res.getHeader("content-type")).toBe("text/javascript");
  });

  it("only runs on the dev server", () => {
    expect(noImmutableDevCache().apply).toBe("serve");
  });
});
