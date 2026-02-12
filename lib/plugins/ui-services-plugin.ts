/**
 * UI Services Plugin
 *
 * Provides NotificationService and DialogService to the Vue app via dependency injection.
 * This decouples composables from framework-specific UI implementations.
 *
 * Usage in main.ts:
 * ```typescript
 * import { createUiServicesPlugin } from '@/authentication/plugins/ui-services-plugin';
 * import { useToast } from '@/components/ui/toast/use-toast';
 * import { useDialog } from '@/composables/useDialog';
 *
 * const uiServicesPlugin = createUiServicesPlugin({
 *   toastHandler: useToast,
 *   dialogHandler: useDialog,
 * });
 *
 * app.use(uiServicesPlugin);
 * ```
 */

import { type App } from "vue";
import { notificationServiceKey, dialogServiceKey } from "./injection-keys";
import type {
  NotificationService,
  DialogService,
  ToastOptions,
  ConfirmDialogOptions,
} from "../authentication/types/ui-services";
import { useI18n } from "vue-i18n";

/**
 * Configuration for UI services plugin
 */
interface UiServicesPluginConfig {
  /**
   * Toast implementation handler (e.g., useToast from your UI library)
   * Should implement the ability to show notifications
   */
  toastHandler?: () => {
    toast: (options: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => void;
  };

  /**
   * Dialog implementation handler (e.g., useDialog from your UI library)
   * Should implement the ability to show confirmation dialogs
   */
  dialogHandler?: (options: ConfirmDialogOptions) => Promise<boolean>;

  /**
   * Alternative: Provide pre-configured services directly
   */
  notificationService?: NotificationService;
  dialogService?: DialogService;
}

/**
 * Create UI Services plugin
 * @param config Plugin configuration
 * @returns Vue plugin
 */
export function createUiServicesPlugin(config: UiServicesPluginConfig) {
  return {
    install(app: App) {
      const { t } = useI18n();

      // Create notification service
      let notificationService: NotificationService;

      if (config.notificationService) {
        // Use provided service
        notificationService = config.notificationService;
      } else if (config.toastHandler) {
        // Create service from toast handler
        const toastHandler = config.toastHandler();
        notificationService = {
          notify(options: ToastOptions) {
            toastHandler.toast({
              title: options.title,
              description: options.description,
              variant: options.variant || "default",
            });
          },
          success(title: string, description?: string) {
            toastHandler.toast({
              title,
              description,
              variant: "default",
            });
          },
          error(title: string, description?: string) {
            toastHandler.toast({
              title,
              description,
              variant: "destructive",
            });
          },
          info(title: string, description?: string) {
            toastHandler.toast({
              title,
              description,
              variant: "default",
            });
          },
        };
      } else {
        // Fallback: no-op service
        notificationService = {
          notify() {},
          success() {},
          error() {},
          info() {},
        };
        console.warn(
          "⚠️ No notification handler provided. Notifications will be silenced."
        );
      }

      // Create dialog service
      let dialogService: DialogService;

      if (config.dialogService) {
        // Use provided service
        dialogService = config.dialogService;
      } else if (config.dialogHandler) {
        // Create service from dialog handler
        dialogService = {
          async confirm(options: ConfirmDialogOptions) {
            return await config.dialogHandler!(options);
          },
        };
      } else {
        // Fallback: return true (no dialog shown)
        dialogService = {
          async confirm() {
            console.warn(
              "⚠️ No dialog handler provided. Dialogs will auto-confirm."
            );
            return true;
          },
        };
      }

      // Provide services to the app
      app.provide(notificationServiceKey, notificationService);
      app.provide(dialogServiceKey, dialogService);
    },
  };
}

/**
 * Helper: Create a simple in-memory notification service for testing
 * Stores all notifications in an array instead of displaying them
 * @returns NotificationService
 */
export function createTestNotificationService(): NotificationService & {
  notifications: Array<{ level: string; title: string; description?: string }>;
} {
  const notifications: Array<{
    level: string;
    title: string;
    description?: string;
  }> = [];

  return {
    notifications,
    notify(options) {
      notifications.push({
        level: options.variant || "default",
        title: options.title || "",
        description: options.description,
      });
    },
    success(title, description?) {
      notifications.push({ level: "success", title, description });
    },
    error(title, description?) {
      notifications.push({ level: "error", title, description });
    },
    info(title, description?) {
      notifications.push({ level: "info", title, description });
    },
  };
}

/**
 * Helper: Create a simple in-memory dialog service for testing
 * Accepts all dialogs by default
 * @returns DialogService
 */
export function createTestDialogService(
  defaultResult = true
): DialogService & { lastPrompt?: ConfirmDialogOptions } {
  return {
    lastPrompt: undefined,
    async confirm(options) {
      (this as any).lastPrompt = options;
      return defaultResult;
    },
  };
}
