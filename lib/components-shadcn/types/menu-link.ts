import { type Role } from "../../openapi/core/models/Role";

export interface MenuItem {
  title: string;
  caption?: string;
  icon?: string;
  link: string;
  requiredPrivilege?: Role;
  linkType?: string;
  badge?: number;
}

export interface MenuLink {
  title: string;
  caption?: string;
  icon: string;
  items?: MenuItem[];
  link?: string;
  hasExpansion?: boolean;
}
