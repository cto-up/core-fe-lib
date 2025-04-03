import { defineStore } from 'pinia';
import { type PublicTenantSchema } from '../openapi/core';
import { useUrl } from '../composables/useUrl';

export const useTenantStore = defineStore('tenant', {
  state: () => {
    return {
      tenant: {} as PublicTenantSchema,
    };
  },
  getters: {
    getTenant: (state) => state.tenant,
    getTitle: (state) => {
      const { isTenantSubdomain } = useUrl();
      let title = '';
      const isTenant = isTenantSubdomain();
      if (isTenant) {
        title = state.tenant?.profile?.displayName;
      } else {
        title = 'CTO';
      }
      return title
    },
    // Feature getters
    isMeetingsEnabled: (state) => state.tenant?.features?.recruitment ?? false,
    isProjectsEnabled: (state) => state.tenant?.features?.projects ?? false,
    isSeriousGamesEnabled: (state) => state.tenant?.features?.seriousGames ?? false,
    isRAGDocumentsEnabled: (state) => state.tenant?.features?.RAGDocuments ?? false,
    isDemoComponentsEnabled: (state) => state.tenant?.features?.demoComponents ?? false,
    isDemoLearningEnabled: (state) => state.tenant?.features?.demoLearning ?? false,
    isAutomationEnabled: (state) => state.tenant?.features?.automation ?? false,
    isSkeellscoachEnabled: (state) => state.tenant?.features?.skeellscoach ?? false,
  },
  actions: {
    setTenant(tenant: PublicTenantSchema) {
      this.tenant = { ...tenant };
    },
  },
});
