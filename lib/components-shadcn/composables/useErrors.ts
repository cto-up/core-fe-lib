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

  const handleError = (error: any, skip404 = false) => {
    if (error?.name === "CancelError" || error?.isCancelled === true) return;

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
            title: "Bad Request",
            description: msg || "Your request is malformed",
            variant: "destructive",
          });
          break;
        case 401:
          toast({
            title: "Unauthorized",
            description: msg || "You don't have the right permissions",
            variant: "destructive",
          });
          break;
        case 404:
          if (skip404) return;
          toast({
            title: "Not Found",
            description: msg || "The requested resource was not found",
            variant: "destructive",
          });
          break;
        case 500:
          toast({
            title: "Server Error",
            description: msg || "An internal server error occurred",
            variant: "destructive",
          });
          break;
        default:
          toast({
            title: "Error",
            description: msg || "An unexpected error occurred: " + error.status,
            variant: "destructive",
          });
          console.error("Error:", JSON.stringify(error));
      }
    } else if (error instanceof Error) {
      toast({
        title: "Error",
        description: msg || "An unexpected error occurred",
        variant: "destructive",
      });
    } else if (typeof error === "string") {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: msg || "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Unknown error:", error);
    }
  };

  return { handleError };
}
