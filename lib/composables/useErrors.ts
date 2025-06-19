// src/composables/useErrors.ts
import createHttpError from 'http-errors';
import { useQuasar } from 'quasar';

export function useErrors() {
  const $q = useQuasar();

  const handleError = (error: unknown, skip404 = false) => {
    //err.response?.data ? err.response.data?.message : err.message
    if (createHttpError.isHttpError(error)) {
      switch (error.status) {
        case 400:
          $q.notify({ type: 'negative', message: error.message });
          break;
        case 401:
          $q.notify({ type: 'negative', message: 'Don\'t have the right' });
          break;
        case 404:
          if (skip404) {
            return;
          }
          $q.notify({ type: 'negative', message: 'Not found' });
          break;
        default:
          $q.notify({ type: 'negative', message: 'An unexpected error occurred ' + JSON.stringify(error) });
          console.log('Error:', error.status, error.message);
      }
    } else if (error instanceof Error) {
      // Handle non-HTTP errors
      $q.notify({
        type: 'negative',
        message: error.message || 'An unexpected error occurred',
      });
    } else if (typeof error === 'string') {
      $q.notify({
        type: 'negative',
        message: error,
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'An unexpected error occurred',
      });
    }
  };

  return {
    handleError,
  };
}
