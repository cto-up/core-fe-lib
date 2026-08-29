import { useToast, type ToastVariant } from "../ui/toast/use-toast";
import { extractKratosError } from "../../authentication/core/kratos-error-processor";
import { useI18n } from "vue-i18n";
import { notifyPlanLimit } from "./planLimit";
import {
  captureForReport,
  isErrorReportable,
  mintReference,
  reportError,
} from "../support/errorReport";
import type { SupportErrorContext } from "../support/types";

/**
 * How much of a failure is ours to fix — which decides whether the toast
 * offers to report it.
 *
 *  - `user`      Working as designed: a validation refusal, a sign-in prompt,
 *                a plan limit, a missing page. Offering "report this" here
 *                trains people to report non-bugs and buries the real ones.
 *  - `ambiguous` Could be either — a permission rule that looks wrong to the
 *                user, a conflict, a dropped connection (a deploy closing
 *                in-flight requests is a real source). Report is offered.
 *  - `ours`      A defect: a 5xx, or a failure with no HTTP status at all.
 */
type ErrorClass = "user" | "ambiguous" | "ours";

/** The parts of a failure worth quoting in a report. Structural rather than
 *  `any`, because what reaches `handleError` is anything from a generated
 *  ApiError to a bare string. */
interface ReportableError {
  status?: unknown;
  message?: string;
  body?: { error?: string; message?: string };
  request?: { method?: string; url?: string };
}

/**
 * Tone follows the same classification as the Report button. A refusal the user
 * can act on must not look like a system failure — and a system failure is ours
 * to fix, so it has no business shouting at the person who merely tripped over
 * it. Solid red is left to `destructive`, for a consequence they caused and
 * cannot undo.
 */
const VARIANT_FOR: Record<ErrorClass, ToastVariant> = {
  user: "warning",
  ambiguous: "warning",
  ours: "fault",
};

function classify(status?: number): ErrorClass {
  if (status === undefined) return "ours";
  if (status >= 500) return "ours";
  if (status === 400 || status === 401 || status === 402 || status === 404)
    return "user";
  return "ambiguous";
}

export function useErrors() {
  const { toast } = useToast();
  let t: ((key: string, named?: Record<string, unknown>) => string) | null;
  try {
    t = useI18n().t;
  } catch {
    t = null;
  }

  // Titles used to be hardcoded English, so a French user got an English toast —
  // or, worse, the browser machine-translated the page to produce one, which is
  // how "Network Error" reached a French learner as "Erreur réseau". `t` is null
  // when handleError is called outside an i18n context, hence the fallback.
  const tr = (key: string, fallback: string): string => (t ? t(key) : fallback);

  const buildErrorContext = (error: ReportableError): SupportErrorContext => {
    const eventId = captureForReport(error);
    const status = typeof error?.status === "number" ? error.status : undefined;
    // The generated clients' ApiError keeps the request options, whose `url` is
    // the route TEMPLATE (`/api/v1/courses/{id}`) rather than the resolved
    // path — so no ids or tokens end up in the draft the user is about to mail.
    const method = error?.request?.method;
    const template = error?.request?.url;
    return {
      reference: mintReference(eventId),
      eventId,
      status,
      endpoint: template
        ? `${(method ?? "GET").toUpperCase()} ${template}`
        : undefined,
      serverMessage:
        error?.body?.error ?? error?.body?.message ?? error?.message,
    };
  };

  /**
   * The single toast used by every branch below. Adds the Report affordance
   * only when the failure is plausibly ours AND the app registered a support
   * desk — apps that never call `setErrorReportHandler` are unchanged.
   */
  const errorToast = (
    title: string,
    description: string,
    error: unknown,
    cls: ErrorClass
  ) => {
    const variant = VARIANT_FOR[cls];
    if (cls === "user" || !isErrorReportable()) {
      toast({ title, description, variant });
      return;
    }
    const ctx = buildErrorContext(error as ReportableError);
    ctx.toastId = toast({
      title,
      description,
      variant,
      // Reportable errors stay until dismissed. At the default 7s the Report
      // button disappears while the user is still reading the message it
      // belongs to, which is worse than not offering it at all.
      duration: 0,
      // Same failure, same endpoint → one toast. Without this a page whose
      // parallel requests all fail stacks a column of identical, permanent
      // toasts over the content the user is trying to get back to.
      dedupeKey: `${ctx.status ?? "none"}|${ctx.endpoint ?? title}`,
      reference: ctx.reference,
      action: {
        label: tr("support.reportAction", "Report this problem"),
        onClick: () => reportError(ctx),
      },
    });
  };

  const handleError = (error: any, skip404 = false) => {
    if (error?.name === "CancelError" || error?.isCancelled === true) return;

    // A request that never got a response: no HTTP status, and axios' own
    // English `message` ("Network Error") would otherwise become the toast body.
    // Deploys are one real source — an in-flight request dropped when the server
    // force-closes connections — so say something a user can act on.
    if (
      error?.status === undefined &&
      (error?.code === "ERR_NETWORK" ||
        error?.code === "ECONNABORTED" ||
        error?.message === "Network Error")
    ) {
      // Deliberately `ambiguous`, not `ours`: usually the user's connection,
      // but a deploy dropping in-flight requests looks identical from here.
      errorToast(
        tr("common.errors.network", "Connection problem"),
        tr(
          "common.errors.networkDesc",
          "The request did not reach the server. Check your connection and try again."
        ),
        error,
        "ambiguous"
      );
      return;
    }

    if (
      error &&
      error.status === 402 &&
      error.body &&
      error.body.code === "INSUFFICIENT_CREDITS"
    ) {
      const meter = error.body.meter ?? "";
      toast({
        title: t
          ? t("credit.errors.insufficient.title")
          : "Insufficient credits",
        description: t
          ? t("credit.errors.insufficient.description", { meter })
          : `You're out of credits for ${meter}.`,
        variant: "warning",
      });
      return;
    }

    if (
      error &&
      error.status === 402 &&
      error.body &&
      error.body.code === "PLAN_LIMIT_REACHED"
    ) {
      // Prefer the app-registered handler (contextual upgrade dialog); fall
      // back to a toast when none is wired.
      if (notifyPlanLimit(error.body)) return;
      toast({
        title: t ? t("credit.errors.planLimit.title") : "Plan limit reached",
        description: t
          ? t("credit.errors.planLimit.description")
          : "You've reached your plan's limit. Upgrade your plan to add more.",
        variant: "warning",
      });
      return;
    }

    const bodyMsg = (error?.body?.error ?? error?.body?.message) as
      | string
      | undefined;
    const newError = extractKratosError(error);
    const msg = bodyMsg ?? newError?.message ?? error.message;

    if (error && typeof error.status === "number") {
      const cls = classify(error.status);
      switch (error.status) {
        case 400:
          errorToast(
            tr("common.errors.badRequest", "Bad Request"),
            msg ||
              tr("common.errors.badRequestDesc", "Your request is malformed"),
            error,
            cls
          );
          break;
        case 401:
          errorToast(
            tr("common.errors.unauthorized", "Unauthorized"),
            msg ||
              tr(
                "common.errors.unauthorizedDesc",
                "You don't have the right permissions"
              ),
            error,
            cls
          );
          break;
        case 404:
          if (skip404) return;
          errorToast(
            tr("common.errors.notFound", "Not Found"),
            msg ||
              tr(
                "common.errors.notFoundDesc",
                "The requested resource was not found"
              ),
            error,
            cls
          );
          break;
        case 500:
          errorToast(
            tr("common.errors.serverError", "Server Error"),
            msg ||
              tr(
                "common.errors.serverErrorDesc",
                "An internal server error occurred"
              ),
            error,
            cls
          );
          break;
        default:
          errorToast(
            tr("common.errors.unexpected", "Error"),
            msg ||
              tr(
                "common.errors.unexpectedDesc",
                "An unexpected error occurred"
              ) +
                ": " +
                error.status,
            error,
            cls
          );
          console.error("Error:", JSON.stringify(error));
      }
    } else if (error instanceof Error) {
      errorToast(
        tr("common.errors.unexpected", "Error"),
        msg ||
          tr("common.errors.unexpectedDesc", "An unexpected error occurred"),
        error,
        "ours"
      );
    } else if (typeof error === "string") {
      errorToast(
        tr("common.errors.unexpected", "Error"),
        error,
        error,
        "ambiguous"
      );
    } else {
      errorToast(
        tr("common.errors.unexpected", "Error"),
        msg ||
          tr("common.errors.unexpectedDesc", "An unexpected error occurred"),
        error,
        "ours"
      );
      console.error("Unknown error:", error);
    }
  };

  return { handleError };
}
