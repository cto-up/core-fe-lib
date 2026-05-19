import type { RouteRecordRaw } from "vue-router";
import type { AppLayouts, HubModule } from "./types";

/**
 * Builds the route records for all registered modules.
 * The result is spread into the top-level routes array.
 */
export function buildModuleRoutes(
  modules: HubModule[],
  layouts: AppLayouts
): RouteRecordRaw[] {
  return modules.map((m) => m.routes(layouts));
}
