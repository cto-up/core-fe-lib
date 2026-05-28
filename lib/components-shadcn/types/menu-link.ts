import { type Role } from "../../openapi/core/models/Role";

export interface MenuItem {
  title: string;
  caption?: string;
  icon?: string;
  link?: string;
  requiredPrivilege?: Role;
  linkType?: string;
  badge?: number;
  items?: MenuItem[];
}

export interface MenuLink {
  title: string;
  caption?: string;
  icon: string;
  items?: MenuItem[];
  link?: string;
  hasExpansion?: boolean;
  /** Stamped by the shell with the originating module's id; consumers can use
   *  it to drive hub-side grouping/reordering transforms. */
  moduleId?: string;
}
