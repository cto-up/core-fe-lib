/**
 * UI Service Abstractions
 * Framework-agnostic interfaces for UI operations
 */

/**
 * Toast notification options
 */
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

/**
 * Notification service interface
 * Decouples composables from specific toast implementations
 */
export interface NotificationService {
  notify(options: ToastOptions): void;
  success(title: string, description?: string): void;
  error(title: string, description?: string): void;
  info(title: string, description?: string): void;
}

/**
 * Dialog confirmation options
 */
export interface ConfirmDialogOptions {
  title: string;
  message: string;
  ok: string;
  cancel: string;
}

/**
 * Dialog service interface
 * Decouples composables from specific dialog implementations
 */
export interface DialogService {
  confirm(options: ConfirmDialogOptions): Promise<boolean>;
}

/**
 * Combined UI services (notifications + dialogs)
 */
export interface UIServices {
  notifications: NotificationService;
  dialog: DialogService;
}
