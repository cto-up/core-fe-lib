import type { RouteRecordRaw } from "vue-router";
import type { Role } from "../../openapi/core/models/Role";
import { Roles } from "../../stores/user-store";
import { modulePrivilege } from "./feature-gate";
import type { HubModule } from "./types";

function stricter(a: Role | undefined, b: Role): Role {
  return a && Roles[a].privilegeLevel > Roles[b].privilegeLevel ? a : b;
}

function raise(record: RouteRecordRaw, floor: Role): RouteRecordRaw {
  return {
    ...record,
    meta: {
      ...record.meta,
      requiredPrivilege: stricter(
        record.meta?.requiredPrivilege as Role | undefined,
        floor
      ),
    },
    ...(record.children && {
      children: record.children.map((c) => raise(c, floor)),
    }),
  } as RouteRecordRaw;
}

/**
 * Makes a module's privilege gate its routes as well as its nav.
 *
 * Opt-in, not the default: a module's privilege means "who sees the section",
 * and some modules deliberately keep routes for lower roles behind it —
 * credit is adminOnly yet serves /credit/buy and /credit/me/topups to every
 * user. The floor is stamped on every record, not just the root, because
 * vue-router lets a child's meta override its parent's, so a child declaring a
 * lower privilege would otherwise reopen what the root closed.
 */
export function gateRoutes(module: HubModule): HubModule {
  const floor = modulePrivilege(module);
  if (!floor) return module;
  return {
    ...module,
    routes: (layouts) => raise(module.routes(layouts), floor),
  };
}
