// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import ActivityList from "./ActivityList.vue";
import AuditLogPage from "../admin/AuditLogPage.vue";
import {
  actionWords,
  actorWords,
  changeWords,
  describeActivity,
  viaWords,
} from "./activity";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import type { ActivityEntry } from "../../openapi/core/models/ActivityEntry";
import enUS from "../i18n/en-US";
import fr from "../i18n/fr";

const row = (over: Partial<ActivityEntry> = {}): ActivityEntry => ({
  id: "a1",
  occurredAt: "2026-11-21T10:00:00Z",
  actorId: "ada",
  actorName: "Ada",
  via: "web",
  action: "page.renamed",
  target: { kind: "page", id: "p1" },
  changes: { title: ["Refunds", "Refund policy"] },
  ...over,
});

const i18n = (locale = "en-US") =>
  createI18n({ legacy: false, locale, messages: { "en-US": enUS, fr } });
const t = i18n().global.t as (k: string) => string;

afterEach(() => vi.restoreAllMocks());

describe("activity wording (office#201)", () => {
  it("says what happened in generic words unless the app gives its own", () => {
    expect(actionWords("page.version_restored")).toBe("version restored page");
    expect(changeWords(row())).toBe("title: Refunds → Refund policy");
    expect(changeWords(row({ changes: { owner: [null, "Bob"] } }))).toBe(
      "owner: Bob"
    );
    expect(describeActivity(row(), t)).toBe(
      "renamed page — title: Refunds → Refund policy"
    );
    expect(describeActivity(row(), t, () => "Renamed the page")).toBe(
      "Renamed the page"
    );
    expect(
      describeActivity(row({ changes: undefined }), t, () => undefined)
    ).toBe("renamed page");
  });

  it("says who and how, or why nobody", () => {
    expect(actorWords(row(), t)).toBe("Ada");
    expect(
      actorWords(
        row({ actorId: undefined, actorName: undefined, via: "job" }),
        t
      )
    ).toBe("Automatic job");
    expect(
      actorWords(row({ actorId: undefined, actorName: undefined }), t)
    ).toBe("Deleted user");
    expect(viaWords("api_key", t)).toBe("API key");
    expect(viaWords("carrier-pigeon", t)).toBe("Unknown");
  });
});

describe("ActivityList (office#201)", () => {
  it("lists one target's rows and loads more from the last one", async () => {
    const list = vi
      .spyOn(DefaultService, "listActivity")
      .mockResolvedValueOnce([row({ id: "a1" }), row({ id: "a2" })] as never)
      .mockResolvedValueOnce([
        row({ id: "a3", action: "page.moved", changes: undefined }),
      ] as never);
    const w = mount(ActivityList, {
      props: { target: { kind: "page", id: "p1" }, pageSize: 2 },
      global: { plugins: [i18n()] },
    });
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith(
      "page",
      "p1",
      undefined,
      undefined,
      undefined,
      2
    );
    expect(w.findAll('[data-testid="activity-item"]')).toHaveLength(2);
    expect(w.text()).toContain("Ada · Web ·");
    await w.get('[data-testid="activity-more"]').trigger("click");
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith(
      "page",
      "p1",
      undefined,
      undefined,
      "a2",
      2
    );
    expect(w.findAll('[data-testid="activity-item"]')).toHaveLength(3);
    expect(w.find('[data-testid="activity-more"]').exists()).toBe(false);
  });

  it("says when nothing is recorded, and when it failed", async () => {
    vi.spyOn(DefaultService, "listActivity").mockResolvedValueOnce([] as never);
    const w = mount(ActivityList, {
      props: { scope: { kind: "notebook", id: "n1" } },
      global: { plugins: [i18n("fr")] },
    });
    await flushPromises();
    expect(w.get('[data-testid="activity-empty"]').text()).toBe(
      "Rien d'enregistré pour l'instant."
    );
    vi.spyOn(DefaultService, "listActivity").mockRejectedValueOnce(
      new Error("404") as never
    );
    await w.setProps({ scope: { kind: "notebook", id: "n2" } });
    await flushPromises();
    expect(w.get('[data-testid="activity-empty"]').attributes("role")).toBe(
      "alert"
    );
  });
});

describe("AuditLogPage (office#201)", () => {
  it("lists the tenant's rows, filters them, and narrows to one person", async () => {
    const list = vi
      .spyOn(DefaultService, "listTenantActivity")
      .mockResolvedValue([
        row(),
        row({
          id: "a2",
          actorId: undefined,
          actorName: undefined,
          via: "job",
          action: "page.archived",
          changes: undefined,
        }),
      ] as never);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/:p(.*)", component: { template: "<div/>" } }],
    });
    const w = mount(AuditLogPage, {
      props: {
        targetLink: (r: { kind: string; id: string }) =>
          r.kind === "page" ? `/kb/p/${r.id}` : undefined,
      },
      global: { plugins: [i18n(), router] },
    });
    await flushPromises();
    const rows = w.findAll('[data-testid="audit-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain("Ada");
    expect(rows[0].text()).toContain("Web");
    expect(rows[0].text()).toContain(
      "renamed page — title: Refunds → Refund policy"
    );
    expect(rows[0].find("a").attributes("href")).toBe("/kb/p/p1");
    expect(rows[1].text()).toContain("Automatic job");

    await w.get('[data-testid="audit-kind"]').setValue("page");
    await w.get('[data-testid="audit-from"]').setValue("2026-11-01");
    await w.get('[data-testid="audit-filters"]').trigger("submit");
    await flushPromises();
    const [kind, action, actor, from, to] = list.mock.lastCall!;
    expect([kind, action, actor, to]).toEqual([
      "page",
      undefined,
      undefined,
      undefined,
    ]);
    expect(new Date(from as string).getDate()).toBe(1);

    await w.get('[data-testid="audit-person"]').trigger("click");
    await flushPromises();
    expect(list.mock.lastCall![2]).toBe("ada");
    expect(w.text()).toContain("Only Ada");
    await w.get('[data-testid="audit-clear-person"]').trigger("click");
    await flushPromises();
    expect(list.mock.lastCall![2]).toBeUndefined();
  });
});
