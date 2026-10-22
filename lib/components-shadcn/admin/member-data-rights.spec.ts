// @vitest-environment happy-dom
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import MemberLeaveDialog from "./MemberLeaveDialog.vue";
import MemberCloseAccountDialog from "./MemberCloseAccountDialog.vue";
import { refusalText } from "./member-data-rights";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import { LeaveImpact } from "../../openapi/core/models/LeaveImpact";
import type { LeaveTenantPreview } from "../../openapi/core/models/LeaveTenantPreview";
import enUS from "../i18n/en-US";
import fr from "../i18n/fr";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": enUS, fr },
});
const t = (key: string, params?: Record<string, unknown>) =>
  i18n.global.t(key, params ?? {});

const member = { id: "u-ada", name: "Ada" };

const preview: LeaveTenantPreview = {
  canLeaveNow: false,
  dormantUntil: "2027-01-20T00:00:00Z",
  impacts: [
    { key: "lms.enrollments", severity: LeaveImpact.severity.INFO, count: 3 },
    {
      key: "lms.authoredPublishedCourses",
      severity: LeaveImpact.severity.DECISION,
      count: 2,
      actions: ["keep", "unpublish"] as never,
    },
  ],
};

const otherTenants = {
  status: 409,
  body: { reason: "member_of_other_tenants", message: "fallback" },
};

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.restoreAllMocks();
});

const body = () => document.body;
const button = (label: string) =>
  [...body().querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label)
  )!;

async function mountDialog(
  component: typeof MemberLeaveDialog | typeof MemberCloseAccountDialog,
  props: Record<string, unknown> = {}
) {
  wrapper = mount(component as never, {
    attachTo: document.body,
    props: { open: true, member, ...props },
    global: { plugins: [i18n] },
  });
  await flushPromises();
  return wrapper;
}

describe("MemberLeaveDialog", () => {
  it("shows the member's impacts and asks their decisions before removing", async () => {
    vi.spyOn(DefaultService, "getMemberLeavePreview").mockResolvedValue(
      preview as never
    );
    const leave = vi
      .spyOn(DefaultService, "leaveTenantForMember")
      .mockResolvedValue(undefined as never);
    const w = await mountDialog(MemberLeaveDialog);

    expect(body().textContent).toContain("Remove Ada from the organization?");
    expect(body().textContent).toContain("3 course(s)");
    expect(body().textContent).toContain("Unless Ada returns before");

    const confirm = body().querySelector<HTMLButtonElement>(
      '[data-testid="member-leave-confirm"]'
    )!;
    expect(confirm.disabled).toBe(true);

    button("Leave them with the organization").click();
    await flushPromises();
    expect(confirm.disabled).toBe(false);
    confirm.click();
    await flushPromises();

    expect(leave).toHaveBeenCalledWith("u-ada", {
      decisions: [{ key: "lms.authoredPublishedCourses", action: "keep" }],
    });
    expect(w.emitted("left")).toHaveLength(1);
  });

  it("names the tenant on the super-admin surface", async () => {
    const get = vi
      .spyOn(DefaultService, "getMemberLeavePreviewFromSuperAdmin")
      .mockResolvedValue({ ...preview, impacts: [] } as never);
    await mountDialog(MemberLeaveDialog, { tenantId: "t-1" });
    expect(get).toHaveBeenCalledWith("t-1", "u-ada");
  });
});

describe("MemberCloseAccountDialog", () => {
  it("states the deletion date and reports the server's", async () => {
    const close = vi
      .spyOn(DefaultService, "scheduleMemberAccountDeletion")
      .mockResolvedValue({
        status: "scheduled",
        scheduledFor: "2026-11-21T10:00:00Z",
      } as never);
    const w = await mountDialog(MemberCloseAccountDialog);

    const inThirtyDays = new Date(
      Date.now() + 30 * 24 * 3600_000
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(body().textContent).toContain(`deleted on ${inThirtyDays}`);

    body()
      .querySelector<HTMLButtonElement>('[data-testid="member-close-confirm"]')!
      .click();
    await flushPromises();
    expect(close).toHaveBeenCalledWith("u-ada", {});
    expect(w.emitted("closed")?.[0]).toEqual(["2026-11-21T10:00:00Z"]);
  });

  it("shows why a member of another organization cannot be closed here", async () => {
    vi.spyOn(DefaultService, "scheduleMemberAccountDeletion").mockRejectedValue(
      otherTenants
    );
    const w = await mountDialog(MemberCloseAccountDialog);
    body()
      .querySelector<HTMLButtonElement>('[data-testid="member-close-confirm"]')!
      .click();
    await flushPromises();

    const alert = body().querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain(
      "Ada also belongs to another organization"
    );
    expect(alert.textContent).toContain("A platform administrator can do it");
    expect(w.emitted("closed")).toBeUndefined();
  });
});

describe("refusalText", () => {
  it("words each refusal in the reader's language", () => {
    expect(refusalText(t, otherTenants, "Ada")).toContain(
      "Ada also belongs to another organization"
    );
    i18n.global.locale.value = "fr";
    expect(refusalText(t, otherTenants, "Ada")).toContain(
      "Ada appartient aussi à une autre organisation"
    );
    expect(
      refusalText(
        t,
        { status: 409, body: { reason: "deletion_already_scheduled" } },
        "Ada"
      )
    ).toContain("déjà programmé");
    i18n.global.locale.value = "en-US";
  });

  it("leaves anything that is not a refusal to the generic handling", () => {
    expect(refusalText(t, { status: 500, body: {} }, "Ada")).toBeNull();
    expect(refusalText(t, new Error("network"), "Ada")).toBeNull();
  });
});
