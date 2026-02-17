// src/composables/useErrors.ts
import createHttpError from "http-errors";
import { useQuasar } from "quasar";
import { extractKratosError } from "core-fe-lib/authentication/core/kratos-error-processor";

export function useErrors() {
  const $q = useQuasar();

  const handleError = (error: unknown, skip404 = false) => {
    const newError = extractKratosError(error);
    const msg = newError?.message ?? error.message;

    if (createHttpError.isHttpError(error)) {
      switch (error.status) {
        case 400:
          $q.notify({
            type: "negative",
            message: "Bad Request",
            caption: msg || "Your request is malformed",
          });
          break;
        case 401:
          $q.notify({
            type: "negative",
            message: "Unauthorized",
            caption: msg || "You don't have the right permissions",
          });
          break;
        case 404:
          if (skip404) {
            return;
          }
          $q.notify({
            type: "negative",
            message: "Not found",
            caption: msg || "The requested resource was not found",
          });
          break;
        case 500:
          $q.notify({
            type: "negative",
            message: "Server Error",
            caption: msg || "An internal server error occurred",
          });
          break;
        default:
          $q.notify({
            type: "negative",
            message:
              msg || "An unexpected error occurred " + JSON.stringify(error),
          });
          console.log("Error:", error.status, error.message);
      }
    } else if (error instanceof Error) {
      // Handle non-HTTP errors
      $q.notify({
        type: "negative",
        message: msg || "An unexpected error occurred",
      });
    } else if (typeof error === "string") {
      $q.notify({
        type: "negative",
        message: error,
      });
    } else {
      $q.notify({
        type: "negative",
        message: "Error",
        caption: msg || "An unexpected error occurred",
      });
    }
  };

  return {
    handleError,
  };
}
