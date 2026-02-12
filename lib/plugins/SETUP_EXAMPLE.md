````ts
/**
 * Example: Setting up UI Services Plugin in main.ts
 *
 * This example shows how to initialize the Provide/Inject pattern
 * for ui-framework-specific services in your Vue application.
 *
 * Copy and adapt this to your main.ts or app setup file.
 */

import { createApp } from "vue";
import { createUiServicesPlugin } from "@/authentication/plugins/ui-services-plugin";
import { useToast } from "@/components/ui/toast/use-toast";
import { useDialog } from "@/composables/useDialog";
import App from "./App.vue";

// Create Vue app
const app = createApp(App);

// Method 1: Using framework-specific handlers (Recommended)
// This keeps your composables framework-agnostic while delegating to your UI library
const uiServicesPlugin = createUiServicesPlugin({
  // Pass your toast implementation
  toastHandler: useToast,

  // Pass your dialog implementation
  dialogHandler: async (options) => {
    const { confirmDialog } = useDialog();
    return await confirmDialog(options);
  },
});

app.use(uiServicesPlugin);

// Method 2: Manual service provision (Advanced)
// If you need custom logic or don't have composable-based handlers
//
// ```typescript
// import { notificationServiceKey, dialogServiceKey } from '@/authentication/injection-keys';
// import type { NotificationService, DialogService } from '@/authentication/types/ui-services';
//
// const customNotificationService: NotificationService = {
//   notify(options) {
//     // Custom notification logic
//     console.log('Notification:', options);
//   },
//   success(title, description?) {
//     console.log('Success:', title, description);
//   },
//   error(title, description?) {
//     console.error('Error:', title, description);
//   },
//   info(title, description?) {
//     console.info('Info:', title, description);
//   },
// };
//
// const customDialogService: DialogService = {
//   async confirm(options) {
//     // Custom dialog logic
//     return window.confirm(`${options.title}: ${options.message}`);
//   },
// };
//
// app.provide(notificationServiceKey, customNotificationService);
// app.provide(dialogServiceKey, customDialogService);
// ```

// Method 3: Direct service objects (Simple)
// Use this if you already have service objects ready
//
// ```typescript
// const uiServicesPlugin = createUiServicesPlugin({
//   notificationService: yourNotificationService,
//   dialogService: yourDialogService,
// });
//
// app.use(uiServicesPlugin);
// ```

// Continue with other app setup...
// app.router...
// app.mount('#app')...
````
