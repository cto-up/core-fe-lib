import { useTenantStore } from "core-fe-lib/stores/tenant-store";
import { computed } from "vue";
import { useKratosAuth } from "./use-kratos-auth";

export function useTenant() {
  const tenantStore = useTenantStore();
  const { session } = useKratosAuth();

  const canSignUp = computed(() => {
    return tenantStore.getTenant?.allow_sign_up;
  });

  /**
   * Per-tenant switch for the social sign-in buttons.
   *
   * Opt-IN, like every other entry in `features`: the super-admin features page
   * initialises any key it does not find to `false` and persists that on save,
   * so a flag that defaulted to on would be switched off the first time anyone
   * saved that page — silently, and nowhere near this code.
   *
   * Lives on the tenant's `features` map because that map is part of the
   * PUBLIC tenant payload, fetched anonymously at startup. Tenant *configs*
   * sit behind `/api`, and the sign-in page has no session to read them with.
   */
  const socialSignInEnabled = computed(() => {
    return tenantStore.getTenant?.features?.social_signin === true;
  });

  const tenantID = computed(() => {
    return session.value?.identity.metadata_public?.tenant_id || null;
  });

  const subdomain = computed(() => {
    return session.value?.identity.metadata_public?.subdomain || null;
  });

  const tenantName = computed(() => {
    return session.value?.identity.metadata_public?.tenant_name || null;
  });

  const hasTenant = computed(() => {
    return !!tenantID.value;
  });

  const currentSubdomain = computed(() => {
    const hostname = globalThis.location.hostname;
    const parts = hostname.split(".");

    if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    if (parts.length > 2) {
      return parts[0];
    }

    return null;
  });

  return {
    canSignUp,
    socialSignInEnabled,
    tenantID,
    subdomain,
    tenantName,
    hasTenant,
    currentSubdomain,
  };
}
