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

  return userRoles.some(roleStr => {
    const role = roleStr as Role;
    return Roles[role]?.privilegeLevel >= requiredLevel;
  });
}