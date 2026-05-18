import { ref } from "vue";

export interface DialogOptions {
  message: string;
  title?: string;
  cancel?: string;
  ok?: string;
  persistent?: boolean;
}

interface DialogState extends DialogOptions {
  show: boolean;
}

const dialogState = ref<DialogState>({
  show: false,
  message: "",
  title: "",
  cancel: "Cancel",
  ok: "OK",
  persistent: false,
});

let currentResolve: ((value: boolean) => void) | null = null;
let isResolving = false;

const dialog = (options: DialogOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    isResolving = false;
    currentResolve = resolve;
    dialogState.value = {
      ...options,
      show: true,
      cancel: options.cancel || "Cancel",
      ok: options.ok || "OK",
      persistent: options.persistent || false,
    };
  });
};

const confirm = () => {
  if (!currentResolve || isResolving) return;
  isResolving = true;
  const resolve = currentResolve;
  currentResolve = null;
  dialogState.value.show = false;
  resolve(true);
};

const cancel = () => {
  if (!currentResolve || isResolving) return;
  isResolving = true;
  const resolve = currentResolve;
  currentResolve = null;
  dialogState.value.show = false;
  resolve(false);
};

export function useDialog() {
  return {
    dialog,
    confirmDialog: dialog,
    dialogState,
    confirm,
    cancel,
  };
}
