import { describe, expect, it, vi } from "vitest";

const submitLoginFlow = vi.fn();
vi.mock("./kratos-service", () => ({
  kratosService: {
    submitLoginFlow: (...args: unknown[]) => submitLoginFlow(...args),
  },
}));

import {
  Aal2Manager,
  aal2FailureReason,
  isAal2CodeRejected,
  type Aal2VerificationState,
} from "./aal2-manager";

function httpError(status: number, data: unknown) {
  return {
    isAxiosError: true,
    message: "Request failed",
    response: { status, data },
  };
}

function flowWithMessage(id: number, text: string) {
  return {
    id: "flow-1",
    type: "browser",
    ui: { nodes: [], messages: [{ id, text, type: "error" }] },
  };
}

function manager() {
  let state = {
    flowId: "flow-1",
    csrfToken: "csrf",
    totpCode: "123456",
    lookupCode: "abcd1234",
    error: "",
  } as unknown as Aal2VerificationState;
  const store = {
    getState: () => state,
    setState: (u: Partial<Aal2VerificationState>) => {
      state = { ...state, ...u };
    },
  };
  return { m: new Aal2Manager(store), state: () => state };
}

describe("AAL2 failures say what failed", () => {
  it("calls a rejected TOTP code an invalid code", async () => {
    submitLoginFlow.mockRejectedValueOnce(
      httpError(
        400,
        flowWithMessage(4000008, "The provided authentication code is invalid")
      )
    );
    const { m, state } = manager();
    await expect(m.submitTotp()).rejects.toBeTruthy();
    expect(state().error).toBe("Invalid code. Please try again.");
  });

  it("names an expired flow instead of calling it an invalid code", async () => {
    const expired = httpError(410, {
      error: {
        id: "self_service_flow_expired",
        code: 410,
        message: "The self-service flow expired 5 minutes ago",
      },
    });
    submitLoginFlow.mockRejectedValueOnce(expired);
    const { m, state } = manager();
    await expect(m.submitTotp()).rejects.toBeTruthy();
    expect(state().error).toContain("expired");
    expect(state().error).not.toContain("Invalid code");
    expect(isAal2CodeRejected(expired)).toBe(false);
  });

  it("names a dropped connection on the lookup path", async () => {
    submitLoginFlow.mockRejectedValueOnce(new Error("socket hang up"));
    const { m, state } = manager();
    await expect(m.submitLookup()).rejects.toBeTruthy();
    expect(state().error).toContain("socket hang up");
  });

  it("recognises a used recovery code as a rejected code", () => {
    expect(
      isAal2CodeRejected(
        httpError(400, flowWithMessage(4000017, "already been used"))
      )
    ).toBe(true);
    expect(aal2FailureReason(new Error("boom"))).toBe("boom");
  });
});
