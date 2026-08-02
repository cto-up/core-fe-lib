import type { App, Component } from "vue";
import type { RouteRecordRaw } from "vue-router";
import type { Pinia } from "pinia";
import type { MenuLink } from "../types/menu-link";
import type { Role } from "../../openapi/core/models/Role";

export interface AppLayouts {
  MainLayout: Component;
  [key: string]: Component;
}

export interface AppContext {
  t: (key: string, ...args: unknown[]) => string;
  userStore: {
    isAdmin: boolean;
    isCustomerAdmin: boolean;
    isSuperAdmin: boolean;
    hasPrivilege: (role: unknown) => boolean;
  };
  tenantStore: {
    tenant: { features?: Record<string, boolean> } | null;
  };
  isTenantSubdomain: () => boolean;
}

export interface HubModule {
  /** Unique identifier, used as i18n namespace key */
  id: string;
  name: string;

  // Feature gating
  /** Key in tenant.features that must be truthy to enable this module */
  requiredFeature?: string;
  /** Minimum privilege level to see this module (hierarchical) */
  requiredPrivilege?: Role;
  /** Shorthand for `requiredPrivilege: Role.ADMIN` */
  adminOnly?: boolean;
  /** Shorthand for `requiredPrivilege: Role.SUPER_ADMIN` */
  superAdminOnly?: boolean;

  // Navigation — module owns its own sidebar links
  navLinks: (ctx: AppContext) => MenuLink[];

  // Routing — module owns its own routes
  routes: (layouts: AppLayouts) => RouteRecordRaw;

  // Post-login redirect
  /** Path to land on after login, e.g. '/care' */
  landingPath?: string;
  /** Lower value = higher priority when choosing the first enabled feature */
  landingPriority?: number;

  // i18n — module owns its own translation keys per locale
  messages?: Record<string, Record<string, unknown>>;

  // Lifecycle (optional)
  onInstall?: (app: App, pinia: Pinia) => void;
}
