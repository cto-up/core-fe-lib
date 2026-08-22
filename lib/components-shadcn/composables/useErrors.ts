import { useToast } from "../ui/toast/use-toast";
import { extractKratosError } from "../../authentication/core/kratos-error-processor";
import { useI18n } from "vue-i18n";
import { notifyPlanLimit } from "./planLimit";

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
      toast({
        title: tr("common.errors.network", "Connection problem"),
        description: tr(
          "common.errors.networkDesc",
          "The request did not reach the server. Check your connection and try again."
        ),
        variant: "destructive",
      });
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
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    const bodyMsg = (error?.body?.error ?? error?.body?.message) as
      | string
      | undefined;
    const newError = extractKratosError(error);
    const msg = bodyMsg ?? newError?.message ?? error.message;

    if (error && typeof error.status === "number") {
      switch (error.status) {
        case 400:
          toast({
            title: tr("common.errors.badRequest", "Bad Request"),
            description:
              msg ||
              tr("common.errors.badRequestDesc", "Your request is malformed"),
            variant: "destructive",
          });
          break;
        case 401:
          toast({
            title: tr("common.errors.unauthorized", "Unauthorized"),
            description:
              msg ||
              tr(
                "common.errors.unauthorizedDesc",
                "You don't have the right permissions"
              ),
            variant: "destructive",
          });
          break;
        case 404:
          if (skip404) return;
          toast({
            title: tr("common.errors.notFound", "Not Found"),
            description:
              msg ||
              tr(
                "common.errors.notFoundDesc",
                "The requested resource was not found"
              ),
            variant: "destructive",
          });
          break;
        case 500:
          toast({
            title: tr("common.errors.serverError", "Server Error"),
            description:
              msg ||
              tr(
                "common.errors.serverErrorDesc",
                "An internal server error occurred"
              ),
            variant: "destructive",
          });
          break;
        default:
          toast({
            title: tr("common.errors.unexpected", "Error"),
            description:
              msg ||
              tr(
                "common.errors.unexpectedDesc",
                "An unexpected error occurred"
              ) +
                ": " +
                error.status,
            variant: "destructive",
          });
          console.error("Error:", JSON.stringify(error));
      }
    } else if (error instanceof Error) {
      toast({
        title: tr("common.errors.unexpected", "Error"),
        description:
          msg ||
          tr("common.errors.unexpectedDesc", "An unexpected error occurred"),
        variant: "destructive",
      });
    } else if (typeof error === "string") {
      toast({
        title: tr("common.errors.unexpected", "Error"),
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: tr("common.errors.unexpected", "Error"),
        description:
          msg ||
          tr("common.errors.unexpectedDesc", "An unexpected error occurred"),
        variant: "destructive",
      });
      console.error("Unknown error:", error);
    }
  };

  return { handleError };
}
