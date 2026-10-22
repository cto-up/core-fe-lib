// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { createI18n } from "vue-i18n";
import { beforeEach, describe, expect, it } from "vitest";
import DataProtectionPage from "./DataProtectionPage.vue";
import {
  coreDataProtectionSections,
  type DataProtectionSection,
} from "./data-protection";
import { useUserStore } from "../../stores/user-store";
import { Role } from "../../openapi/core/models/Role";
import enUS from "../i18n/en-US";
import fr from "../i18n/fr";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": enUS, fr },
});
const t = (key: string) => i18n.global.t(key);

const appSection: DataProtectionSection = {
  title: "Retention",
  lines: [
    {
      label: "Preparations",
      value: "7 days",
      to: "/tenant-configs",
      requires: Role.ADMIN,
    },
  ],
};

async function mountAs(roles: string[], sections: DataProtectionSection[]) {
  useUserStore().setUser({ roles } as never);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:p(.*)*", component: { render: () => null } }],
  });
  await router.push("/admin/data-protection");
  const wrapper = mount(DataProtectionPage, {
    props: { sections },
    global: { plugins: [router, i18n] },
  });
  await flushPromises();
  return wrapper;
}

const line = (wrapper: Awaited<ReturnType<typeof mountAs>>, label: string) =>
  wrapper
    .findAll('[data-testid="data-protection-line"]')
    .find((li) => li.text().includes(label))!;

describe("DataProtectionPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("renders each section's lines with their value", async () => {
    const wrapper = await mountAs(["ADMIN"], [appSection]);
    expect(wrapper.text()).toContain("Retention");
    expect(line(wrapper, "Preparations").text()).toContain("7 days");
  });

  it("links a line the viewer can open", async () => {
    const wrapper = await mountAs(["ADMIN"], [appSection]);
    const a = line(wrapper, "Preparations").find("a");
    expect(a.attributes("href")).toBe("/tenant-configs");
  });

  it("shows a line the viewer lacks the role for as plain text", async () => {
    const wrapper = await mountAs(["CUSTOMER_ADMIN"], [appSection]);
    const li = line(wrapper, "Preparations");
    expect(li.find("a").exists()).toBe(false);
    expect(li.text()).toContain("7 days");
  });

  it("links the accounts pending deletion for an ADMIN only", async () => {
    const admin = await mountAs(["ADMIN"], coreDataProtectionSections(t));
    expect(
      line(admin, "Accounts pending deletion").find("a").attributes("href")
    ).toBe("/admin/pending-deletions");
    const customerAdmin = await mountAs(
      ["CUSTOMER_ADMIN"],
      coreDataProtectionSections(t)
    );
    expect(
      line(customerAdmin, "Accounts pending deletion").find("a").exists()
    ).toBe(false);
  });

  it("opens an external href in a new tab", async () => {
    const wrapper = await mountAs(
      ["CUSTOMER_ADMIN"],
      coreDataProtectionSections(t)
    );
    const a = line(wrapper, "Privacy policy").find("a");
    expect(a.attributes("href")).toBe("/privacy");
    expect(a.attributes("target")).toBe("_blank");
    expect(a.attributes("rel")).toContain("noopener");
  });
});

describe("coreDataProtectionSections", () => {
  it("covers rights, lifecycle windows and legal pages in both locales", () => {
    for (const locale of ["en-US", "fr"] as const) {
      i18n.global.locale.value = locale;
      const sections = coreDataProtectionSections(t);
      const lines = sections.flatMap((s) => s.lines);
      expect(
        lines.filter((l) => l.to === "/user/me/organizations")
      ).toHaveLength(3);
      expect(lines.map((l) => l.href).filter(Boolean)).toEqual([
        "/privacy",
        "/terms",
        "/cookies",
      ]);
      // An untranslated key comes back as itself.
      for (const s of sections) {
        expect(s.title).not.toContain("core.dataProtection");
        for (const l of s.lines) {
          expect(l.label).not.toContain("core.dataProtection");
          expect(l.value ?? "").not.toContain("core.dataProtection");
        }
      }
    }
    i18n.global.locale.value = "en-US";
  });
});
