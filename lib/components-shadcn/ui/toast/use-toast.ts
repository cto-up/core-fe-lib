import { ref } from "vue";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export function useToast() {
  const toast = (options: Omit<Toast, "id">) => {
    const id = `toast-${++toastIdCounter}`;
    const duration = options.duration ?? 7000;

    const newToast: Toast = {
      id,
      ...options,
    };

    toasts.value.push(newToast);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  };

  const dismiss = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  return {
    toast,
    toasts,
    dismiss,
  };
}
