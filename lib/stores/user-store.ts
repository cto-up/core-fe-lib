import { type LoggedUser } from '../models/logged-user';
import { defineStore, getActivePinia, setActivePinia, createPinia } from 'pinia';

export const useInternalUserStore = defineStore('user', {
  state: () => {
    return {
      user: null as null | LoggedUser,
    };
  },
  getters: {
    isLogged: (state) => state.user != null,
    getUser: (state) => state.user,
    isAdmin: (state) => state.user?.roles?.includes('ADMIN'),
    isSuperAdmin: (state) => state.user?.roles?.includes('SUPER_ADMIN'),
  },
  actions: {
    setUser(user: LoggedUser | null) {
      this.user = user;
      persist: true; //<---------persists user state to local storage!
    },
  },
});

// Helper function to ensure Pinia is available
export function useUserStore() {
  let pinia = getActivePinia();
  if (!pinia) {
    pinia = createPinia();
    setActivePinia(pinia);
  }
  return useInternalUserStore();
}