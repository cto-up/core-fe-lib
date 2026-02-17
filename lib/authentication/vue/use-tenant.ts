import { useTenantStore } from "core-fe-lib/stores/tenant-store";
import { computed } from "vue";
import { useKratosAuth } from "./use-kratos-auth";

export function useTenant() {
  const tenantStore = useTenantStore();
  const { session } = useKratosAuth();

  const canSignUp = computed(() => {
    return tenantStore.getTenant?.allow_sign_up;
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
    tenantID,
    subdomain,
    tenantName,
    hasTenant,
    currentSubdomain,
  };
}
