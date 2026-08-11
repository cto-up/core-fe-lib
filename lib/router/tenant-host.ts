import { useUrl } from "../composables/useUrl";
import { useUserStore } from "../stores/user-store";

export interface TenantHost {
  isTenantLessHost(): boolean;
  isBrandRootHost(): boolean;
  defaultTenantOrigin(): string;
  tenantHostRedirect(path: string): string | null;
}

/**
 * Host semantics shared by every consumer app: which hosts carry a tenant,
 * where a signed-in visitor stranded on a tenant-less host has to go, and which
 * hosts a marketing CTA is allowed to leave.
 *
 * `defaultTenantSubdomain` is the one brand-specific bit — the tenant a signed-in
 * visitor is sent to (`app` for hub and care, `learn` for lms). Bind it once per
 * app in `src/router/tenant-host.ts` so the marketing CTAs, the landing top bar
 * and the router guard all resolve the same host.
 */
/**
 * True on a host that carries no tenant (apex, `www`, `admin`). Session-free
 * and synchronous, so callers can rule the whole redirect out before paying for
 * auth hydration.
 *
 * Standalone rather than a member of {@link TenantHost} because it is the one
 * host rule that owes nothing to the brand: a feature module asking "is there a
 * tenant here at all?" would otherwise have to be handed a
 * `defaultTenantSubdomain` it never uses, and modules that ship to hub, care and
 * lms alike have no business knowing one. `createTenantHost` re-exposes it on
 * the returned object so existing callers are unaffected.
 *
 * Returns false on a host with no registrable domain (`localhost`, an IP) —
 * there is nowhere to put a tenant subdomain, so local dev is treated as
 * tenanted, matching what the backend resolves there.
 */
export function isTenantLessHost(): boolean {
  const { isTenantSubdomain, getDomain } = useUrl();
  return !isTenantSubdomain() && hasRegistrableDomain(getDomain());
}

export function createTenantHost(defaultTenantSubdomain: string): TenantHost {
  /**
   * True on the brand's front door — the apex and `www`, the only hosts with no
   * subdomain of their own to keep. A CTA into the app has to name a tenant host
   * from there; from anywhere else (the default tenant, `admin`, a tenant
   * subdomain) it stays on the current origin and lets `tenantHostRedirect`
   * decide, which is what keeps a super admin on `admin`.
   *
   * Narrower than {@link isTenantLessHost} on purpose: `admin` is tenant-less
   * but it is not a front door.
   */
  function isBrandRootHost(): boolean {
    const { getSubdomain, getDomain } = useUrl();
    const subdomain = getSubdomain();
    return (
      (!subdomain || subdomain === "www") && hasRegistrableDomain(getDomain())
    );
  }

  /** Absolute origin of the default tenant, e.g. `https://app.taskfactory.eu`. */
  function defaultTenantOrigin(): string {
    const { getDomain } = useUrl();
    const { protocol, port } = globalThis.location;
    return `${protocol}//${defaultTenantSubdomain}.${getDomain()}${
      port ? `:${port}` : ""
    }`;
  }

  /**
   * Where a signed-in visitor should continue when the current host carries no
   * tenant (apex, `www`, `admin`): they have no tenant, no features and no
   * enrolments there, so in-app routing can only drop them on an empty shell.
   * Returns null whenever they should stay put — anonymous visitors included,
   * since the tenant-less host IS the public marketing site.
   *
   * Super admins are the exception — the cross-tenant admin surface exists ONLY
   * off-tenant (cf. MainAppLayout's super-admin section), so never move them.
   *
   * A host with no registrable domain (`localhost`, an IP) has nowhere to put a
   * tenant subdomain, which is also what keeps this inert in local dev.
   */
  function tenantHostRedirect(path: string): string | null {
    const userStore = useUserStore();

    if (!isTenantLessHost()) return null;
    if (!userStore.isLogged || userStore.isSuperAdmin) return null;

    return defaultTenantOrigin() + path;
  }

  return {
    isTenantLessHost,
    isBrandRootHost,
    defaultTenantOrigin,
    tenantHostRedirect,
  };
}

// A tenant subdomain prefixes a name, not an address: an alphabetic last label
// rules out both `localhost` (no dot) and `127.0.0.1` (numeric TLD).
function hasRegistrableDomain(domain: string): boolean {
  const labels = domain.split(".");
  return labels.length > 1 && /^[a-z]{2,}$/i.test(labels.at(-1) ?? "");
}
