import { describe, expect, it } from "vitest";
import { Role } from "../../openapi/core/models/Role";
import { hasPrivilege } from "../../stores/user-store";
import { isModuleEnabledForUser } from "./feature-gate";
import { visibleItems } from "./nav-factory";
import type { HubModule } from "./types";

const can = (roles: string[]) => (role: Role) => hasPrivilege(roles, role);

const module = (over: Partial<HubModule> = {}): HubModule => ({
  id: "test",
  name: "Test",
  navLinks: () => [],
  routes: () => ({ path: "/test" }),
  ...over,
});

describe("hasPrivilege", () => {
  it("ranks roles hierarchically", () => {
    expect(hasPrivilege(["SUPER_ADMIN"], Role.CUSTOMER_ADMIN)).toBe(true);
    expect(hasPrivilege(["ADMIN"], Role.CUSTOMER_ADMIN)).toBe(true);
    expect(hasPrivilege(["CUSTOMER_ADMIN"], Role.ADMIN)).toBe(false);
  });

  it("handles USER, which is in the Role enum", () => {
    expect(hasPrivilege(["USER"], Role.USER)).toBe(true);
    expect(hasPrivilege(["USER"], Role.CUSTOMER_ADMIN)).toBe(false);
    expect(hasPrivilege(["ADMIN"], Role.USER)).toBe(true);
  });

  it("does not grant on an unknown role", () => {
    expect(hasPrivilege(["WHATEVER"], Role.USER)).toBe(false);
  });
});

describe("isModuleEnabledForUser", () => {
  it("lets a CUSTOMER_ADMIN into a CUSTOMER_ADMIN module", () => {
    const m = module({ requiredPrivilege: Role.CUSTOMER_ADMIN });
    expect(isModuleEnabledForUser(m, {}, can(["CUSTOMER_ADMIN"]))).toBe(true);
    expect(isModuleEnabledForUser(m, {}, can(["USER"]))).toBe(false);
  });

  it("treats adminOnly / superAdminOnly as privilege shorthand", () => {
    const admin = module({ adminOnly: true });
    expect(isModuleEnabledForUser(admin, {}, can(["SUPER_ADMIN"]))).toBe(true);
    expect(isModuleEnabledForUser(admin, {}, can(["CUSTOMER_ADMIN"]))).toBe(
      false
    );

    const superOnly = module({ superAdminOnly: true });
    expect(isModuleEnabledForUser(superOnly, {}, can(["ADMIN"]))).toBe(false);
  });

  it("still honours requiredFeature", () => {
    const m = module({ requiredFeature: "flag" });
    expect(isModuleEnabledForUser(m, {}, can(["SUPER_ADMIN"]))).toBe(false);
    expect(isModuleEnabledForUser(m, { flag: true }, can(["USER"]))).toBe(true);
  });
});

describe("visibleItems", () => {
  const pipelineItems = [
    { title: "Runs", link: "/pipeline/runs", requiredPrivilege: Role.ADMIN },
    {
      title: "AI Providers",
      link: "/pipeline/llm-providers",
      requiredPrivilege: Role.CUSTOMER_ADMIN,
    },
    { title: "Cost", link: "/pipeline/cost", requiredPrivilege: Role.ADMIN },
  ];

  it("leaves a CUSTOMER_ADMIN only the entries they may open", () => {
    expect(
      visibleItems(pipelineItems, can(["CUSTOMER_ADMIN"]))?.map((i) => i.title)
    ).toEqual(["AI Providers"]);
  });

  it("keeps everything for an ADMIN", () => {
    expect(visibleItems(pipelineItems, can(["ADMIN"]))).toHaveLength(3);
  });

  it("filters nested groups and drops the ones left empty", () => {
    const items = [
      {
        title: "Group",
        items: [
          { title: "Seed", link: "/seed", requiredPrivilege: Role.ADMIN },
        ],
      },
      { title: "Plain", link: "/plain" },
    ];
    expect(
      visibleItems(items, can(["CUSTOMER_ADMIN"]))?.map((i) => i.title)
    ).toEqual(["Plain"]);
    expect(visibleItems(items, can(["ADMIN"]))?.map((i) => i.title)).toEqual([
      "Group",
      "Plain",
    ]);
  });
});
