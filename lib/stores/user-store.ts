import { type LoggedUser } from '../models/logged-user';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
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
