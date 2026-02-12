import { useTenantStore } from "core-fe-lib/stores/tenant-store";
import { computed } from "vue";
import { useKratosAuth } from "./useKratosAuth";

export function useTenant() {
  const tenantStore = useTenantStore();
  const { session } = useKratosAuth();

  const canSignUp = computed(() => {
    // get tenant config from store
    return tenantStore.getTenant?.allow_sign_up;
  });

  // Get tenant information from Kratos session metadata
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

  // Get tenant from subdomain in URL
  const currentSubdomain = computed(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");

    // If localhost or IP, no subdomain
    if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    // If more than 2 parts, first part is subdomain
    if (parts.length > 2) {
      return parts[0];
    }

    return null;
  });

  return {
    canSignUp,
    tenantID,
    subdomain,
    tenantName,
    hasTenant,
    currentSubdomain,
  };
}
