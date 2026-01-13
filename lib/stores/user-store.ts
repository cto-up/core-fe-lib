import { type LoggedUser } from '../models/logged-user';
import {
  defineStore,
  getActivePinia,
  setActivePinia,
  createPinia,
} from 'pinia';
import { Role } from '../openapi/core/models/Role';

export interface RoleDefinition {
  key: Role;
  privilegeLevel: number;
}

export const Roles: Record<Role, RoleDefinition> = {
  SUPER_ADMIN: {
    key: Role.SUPER_ADMIN,
    privilegeLevel: 100,
  },
  ADMIN: {
    key: Role.ADMIN,
    privilegeLevel: 90,
  },
  CUSTOMER_ADMIN: {
    key: Role.CUSTOMER_ADMIN,
    privilegeLevel: 50,
  },
};

/**
 * Check if any of the given roles has sufficient privilege.
 * @param userRoles - Array of role strings assigned to the user
 * @param requiredRole - The role to compare against
 * @returns boolean - true if any userRole has >= privilege than requiredRole
 */
export function hasPrivilege(userRoles: string[], requiredRole: Role): boolean {
  const requiredLevel = Roles[requiredRole].privilegeLevel;

  return userRoles.some((roleStr) => {
    const role = roleStr as Role;
    return Roles[role]?.privilegeLevel >= requiredLevel;
  });
}

export const useInternalUserStore = defineStore('user', {
  state: () => {
    return {
      user: null as null | LoggedUser,
    };
  },
  getters: {
    isLogged: (state) => state.user != null,
    getUser: (state) => state.user,
    isCustomerAdmin: (state) =>
      state.user?.roles?.includes(Role.CUSTOMER_ADMIN),
    isAdmin: (state) => state.user?.roles?.includes(Role.ADMIN),
    isSuperAdmin: (state) => state.user?.roles?.includes(Role.SUPER_ADMIN),
    hasRole: (state) => !!state.user?.roles?.length,
    hasPrivilege: (state) => (requiredRole: Role) =>
      hasPrivilege(state.user?.roles ?? [], requiredRole),
  },
  actions: {
    setUser(user: LoggedUser | null) {
      this.user = user;
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
