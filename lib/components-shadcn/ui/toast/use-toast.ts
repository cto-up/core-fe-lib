import { ref } from "vue";

// "warning" is for a state the user can act on — a refusal that is expected and
// reversible. "fault" is for what broke on our side: serious, but not the solid
// fill of "destructive", which is reserved for a consequence the user caused and
// cannot undo. None of the three is red: red belongs to the button that is about
// to destroy something, and a red toast for every guard trains people to ignore
// red.
export type ToastVariant = "default" | "destructive" | "warning" | "fault";

/** An affordance rendered inside the toast, e.g. "Report this problem". */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** `0` keeps the toast up until dismissed. Use it whenever the toast carries
   *  an `action` — a button that vanishes mid-read is a broken promise. */
  duration?: number;
  action?: ToastAction;
  /** Collapses repeats: while a toast with this key is on screen, further
   *  toasts carrying it are dropped. A page firing five failing requests is
   *  one incident, not five — and with `duration: 0` the copies would never
   *  leave on their own. */
  dedupeKey?: string;
  /** Short error id shown as a copyable chip, e.g. `ERR-8F3A21C0`. */
  reference?: string;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export function useToast() {
  const toast = (options: Omit<Toast, "id">) => {
    if (options.dedupeKey) {
      const existing = toasts.value.find(
        (t) => t.dedupeKey === options.dedupeKey
      );
      if (existing) return existing.id;
    }
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
