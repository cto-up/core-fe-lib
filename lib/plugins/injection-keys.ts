/**
 * Vue 3 Injection Keys for UI Services
 * Provides type-safe dependency injection for framework-specific UI operations
 */

import { type InjectionKey } from "vue";
import type {
  NotificationService,
  DialogService,
  UIServices,
} from "../authentication/types/ui-services";

/**
 * Injection key for NotificationService
 * Usage: const notifications = inject(notificationServiceKey)!
 */
export const notificationServiceKey = Symbol(
  "notificationService"
) as InjectionKey<NotificationService>;

/**
 * Injection key for DialogService
 * Usage: const dialog = inject(dialogServiceKey)!
 */
export const dialogServiceKey = Symbol(
  "dialogService"
) as InjectionKey<DialogService>;

/**
 * Injection key for combined UIServices
 * Usage: const { notifications, dialog } = inject(uiServicesKey)!
 * Recommended: Use this when both services are needed
 */
export const uiServicesKey = Symbol("uiServices") as InjectionKey<UIServices>;
