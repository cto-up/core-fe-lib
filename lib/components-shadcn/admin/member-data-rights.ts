import { DefaultService } from "../../openapi/core/services/DefaultService";
import { MemberActionRefusal } from "../../openapi/core/models/MemberActionRefusal";
import type { LeaveDecision } from "../../openapi/core/models/LeaveDecision";

/** The member an admin acts for. */
export type Member = { id: string; name: string };

/**
 * A member's data-protection rights, exercised by an admin (ctoup/gordon#98).
 * With a tenantId the super-admin surface names the tenant; without one the
 * request's host is the tenant.
 */
export function memberDataRights(tenantId?: string) {
  return {
    exportData: (userId: string) =>
      tenantId
        ? DefaultService.exportMemberDataFromSuperAdmin(tenantId, userId)
        : DefaultService.exportMemberData(userId),
    leavePreview: (userId: string) =>
      tenantId
        ? DefaultService.getMemberLeavePreviewFromSuperAdmin(tenantId, userId)
        : DefaultService.getMemberLeavePreview(userId),
    leave: (userId: string, decisions: LeaveDecision[]) =>
      tenantId
        ? DefaultService.leaveTenantForMemberFromSuperAdmin(tenantId, userId, {
            decisions,
          })
        : DefaultService.leaveTenantForMember(userId, { decisions }),
    closeAccount: (userId: string, reason?: string) => {
      const body = reason ? { reason } : {};
      return tenantId
        ? DefaultService.scheduleMemberAccountDeletionFromSuperAdmin(
            tenantId,
            userId,
            body
          )
        : DefaultService.scheduleMemberAccountDeletion(userId, body);
    },
  };
}

type Failure = { status?: number; body?: Partial<MemberActionRefusal> };

/**
 * The plain-words reason for a refused action, or null when the failure is not
 * a refusal (left to the generic error handling).
 */
export function refusalText(
  t: (key: string, params?: Record<string, unknown>) => string,
  error: unknown,
  name: string
): string | null {
  const err = error as Failure;
  if (err?.status !== 409) return null;
  switch (err.body?.reason) {
    case MemberActionRefusal.reason.MEMBER_OF_OTHER_TENANTS:
      return t("core.user.dataRights.refused.otherTenants", { name });
    case MemberActionRefusal.reason.DELETION_ALREADY_SCHEDULED:
      return t("core.user.dataRights.refused.alreadyScheduled", { name });
    default:
      return err.body?.message ?? null;
  }
}
