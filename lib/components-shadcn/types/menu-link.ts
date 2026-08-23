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
  /** Section label. Omitted only by a shared-section contributor, which
   *  declares `sectionId` instead and lets the shell supply the label; every
   *  link the shell hands to the sidebar has one. */
  title?: string;
  caption?: string;
  icon: string;
  items?: MenuItem[];
  link?: string;
  hasExpansion?: boolean;
  /** Stamped by the shell with the originating module's id; consumers can use
   *  it to drive hub-side grouping/reordering transforms. */
  moduleId?: string;
  /** Marks this link as a contribution to a shared section: every link
   *  declaring the same id is merged into one sidebar section, positioned
   *  where the first contributor sits. `title`/`caption` are then supplied by
   *  the shell from `layout.navigation.<sectionId>`, not by the contributors —
   *  two modules cannot agree on one label, and left to themselves they ship
   *  two sections with the same name. */
  sectionId?: string;
  /** Sort key among contributions to the same `sectionId` (ascending, default
   *  0, ties keep registration order). Item order inside a shared section is a
   *  product decision, and registration order cannot express it: the section
   *  itself is anchored at its first contributor, so reordering the registry to
   *  move an item also moves the whole section. */
  sectionOrder?: number;
}
