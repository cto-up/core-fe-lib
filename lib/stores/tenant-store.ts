import { defineStore } from "pinia";
import { type PublicTenantSchema } from "../openapi/core";
import { useUrl } from "../composables/useUrl";

export const useTenantStore = defineStore("tenant", {
  state: () => {
    return {
      tenant: {} as PublicTenantSchema,
    };
  },
  getters: {
    getTenant: (state) => state.tenant,
    getTitle: (state) => {
      const { isTenantSubdomain } = useUrl();
      let title = "";
      const isTenant = isTenantSubdomain();
      if (isTenant) {
        title = state.tenant?.profile?.displayName;
      } else {
        title = "CTO";
      }
      return title;
    },
    isReseller: (state) => state.tenant?.is_reseller ?? false,
  },
  actions: {
    setTenant(tenant: PublicTenantSchema) {
      this.tenant = { ...tenant };
    },
  },
});
