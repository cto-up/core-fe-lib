import { describe, expect, it } from "vitest";
import type { RouteRecordRaw } from "vue-router";
import { Role } from "../../openapi/core/models/Role";
import { gateRoutes } from "./route-gate";
import type { HubModule } from "./types";

const layouts = { MainLayout: {} };

const module = (over: Partial<HubModule> = {}): HubModule => ({
  id: "test",
  name: "Test",
  navLinks: () => [],
  routes: () => ({
    path: "/test",
    children: [
      { path: "open", component: {} },
      {
        path: "lower",
        component: {},
        meta: { requiredPrivilege: Role.CUSTOMER_ADMIN },
      },
      {
        path: "higher",
        component: {},
        meta: { requiredPrivilege: Role.SUPER_ADMIN, requiresAuth: true },
      },
    ],
  }),
  ...over,
});

const privileges = (r: RouteRecordRaw): unknown[] => [
  r.meta?.requiredPrivilege,
  ...(r.children ?? []).flatMap(privileges),
];

describe("gateRoutes", () => {
  it("stamps the module's privilege on the root and every child", () => {
    const root = gateRoutes(module({ requiredPrivilege: Role.ADMIN })).routes(
      layouts
    );
    expect(privileges(root)).toEqual([
      Role.ADMIN,
      Role.ADMIN,
      // A child's lower privilege would override the root in to.meta.
      Role.ADMIN,
      Role.SUPER_ADMIN,
    ]);
  });

  it("keeps a child's other meta", () => {
    const root = gateRoutes(module({ adminOnly: true })).routes(layouts);
    expect(root.children?.[2].meta?.requiresAuth).toBe(true);
  });

  it("returns an ungated module unchanged", () => {
    const m = module();
    expect(gateRoutes(m)).toBe(m);
  });
});
