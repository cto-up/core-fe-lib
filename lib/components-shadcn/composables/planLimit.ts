// Bridge for plan-limit (402 PLAN_LIMIT_REACHED) handling. core-fe-lib stays
// generic: the consumer app registers a handler at boot (e.g. open an upgrade
// dialog). When none is registered, useErrors falls back to a toast.

export interface PlanLimitInfo {
  code: string;
  key: string;
  limit?: number;
  planKey?: string;
  upgradeTo?: string;
}

let handler: ((info: PlanLimitInfo) => void) | null = null;

export function setPlanLimitHandler(
  fn: ((info: PlanLimitInfo) => void) | null
) {
  handler = fn;
}

// Returns true when a handler consumed the event (so the caller skips its
// fallback toast).
export function notifyPlanLimit(info: PlanLimitInfo): boolean {
  if (handler) {
    handler(info);
    return true;
  }
  return false;
}
