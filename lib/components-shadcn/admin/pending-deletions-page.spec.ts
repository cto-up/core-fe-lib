// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PendingDeletionsPage from "./PendingDeletionsPage.vue";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import { PendingDeletion } from "../../openapi/core/models/PendingDeletion";
import { useUserStore } from "../../stores/user-store";
import enUS from "../i18n/en-US";
import fr from "../i18n/fr";

// The ticket's example: A asked to close, B was warned for inactivity.
const rows: PendingDeletion[] = [
  {
    userId: "a",
    email: "a@example.com",
    name: "Alice",
    stage: PendingDeletion.stage.CLOSURE_REQUESTED,
    reason: "moving on",
    requestedAt: "2026-10-20T09:00:00Z",
    deletesOn: "2026-11-19T09:00:00Z",
    tenants: ["Acme"],
  },
  {
    userId: "b",
    email: "b@example.com",
    name: "Bob",
    stage: PendingDeletion.stage.INACTIVITY_WARNED,
    warnedAt: "2026-10-22T03:00:00Z",
    lastSeenAt: "2023-11-21T08:00:00Z",
    deletesOn: "2026-12-21T03:00:00Z",
    tenants: ["Acme", "Globex"],
  },
];

async function mountAs(
  roles: string[],
  locale: "en-US" | "fr" = "en-US",
  list: () => Promise<PendingDeletion[]> = async () => rows
) {
  useUserStore().setUser({ roles } as never);
  vi.spyOn(DefaultService, "listPendingDeletions").mockImplementation(
    list as never
  );
  const i18n = createI18n({
    legacy: false,
    locale,
    messages: { "en-US": enUS, fr },
  });
  const wrapper = mount(PendingDeletionsPage, {
    global: { plugins: [i18n] },
  });
  await flushPromises();
  return wrapper;
}

const rowTexts = (wrapper: Awaited<ReturnType<typeof mountAs>>) =>
  wrapper.findAll('[data-testid="pending-deletion-row"]').map((r) => r.text());

describe("PendingDeletionsPage", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("lists each account in the order served, with its stage and dates", async () => {
    const wrapper = await mountAs(["ADMIN"]);
    const [a, b] = rowTexts(wrapper);
    expect(a).toContain("Alice");
    expect(a).toContain("Closure requested");
    expect(a).toContain("moving on");
    expect(a).toContain("Requested Oct 20, 2026");
    expect(a).toContain("Nov 19, 2026");
    expect(b).toContain("Inactive since Nov 21, 2023");
    expect(b).toContain("Warned Oct 22, 2026");
    expect(b).toContain("Dec 21, 2026");
    expect(b).toContain("unless they sign in");
  });

  it("shows organizations to a super-admin only", async () => {
    const admin = await mountAs(["ADMIN"]);
    expect(admin.text()).not.toContain("Organizations");
    const superAdmin = await mountAs(["SUPER_ADMIN"]);
    expect(superAdmin.text()).toContain("Organizations");
    expect(rowTexts(superAdmin)[1]).toContain("Acme, Globex");
  });

  it("names an account closed by the inactivity rule", async () => {
    const wrapper = await mountAs(["ADMIN"], "en-US", async () => [
      { ...rows[0], reason: "inactivity" },
    ]);
    const [a] = rowTexts(wrapper);
    expect(a).toContain("Closed for inactivity");
    expect(a).not.toContain("inactivity,");
  });

  it("speaks French", async () => {
    const wrapper = await mountAs(["ADMIN"], "fr");
    expect(wrapper.text()).toContain("Comptes en attente de suppression");
    const [a, b] = rowTexts(wrapper);
    expect(a).toContain("Fermeture demandée");
    expect(b).toContain("sauf s'il se reconnecte");
  });

  it("says when nothing is pending, and when the list failed", async () => {
    const empty = await mountAs(["ADMIN"], "en-US", async () => []);
    expect(empty.text()).toContain("No account is pending deletion.");
    const failed = await mountAs(["ADMIN"], "en-US", async () => {
      throw new Error("boom");
    });
    expect(failed.find('[role="alert"]').text()).toContain(
      "could not be loaded"
    );
  });
});
