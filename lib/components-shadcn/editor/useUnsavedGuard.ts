import { getCurrentInstance, onBeforeUnmount, watch, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDialog } from "../composables/useDialog";

export interface UnsavedGuardOptions {
  /** localStorage key for a draft that survives a refresh. Omit for no draft. */
  draftKey?: string;
  /** The value to keep as draft while dirty. */
  value?: Ref<string>;
}

const PREFIX = "editor-draft:";

function storage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function readDraft(key: string): string | null {
  try {
    return storage()?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string | null) {
  try {
    if (value === null) storage()?.removeItem(PREFIX + key);
    else storage()?.setItem(PREFIX + key, value);
  } catch {
    // Private mode or blocked storage: the guard still asks before leaving.
  }
}

/**
 * Protects unsaved editor work: asks before an in-app navigation and before the
 * tab closes or reloads while `dirty` is true, and (with `draftKey`) keeps a
 * local draft that the editor can offer to restore on the next open.
 */
export function useUnsavedGuard(
  dirty: Ref<boolean>,
  opts: UnsavedGuardOptions = {}
) {
  const { t } = useI18n();
  const { dialog } = useDialog();
  let router: ReturnType<typeof useRouter> | undefined;
  try {
    router = getCurrentInstance() ? useRouter() : undefined;
  } catch {
    router = undefined;
  }

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!dirty.value) return;
    e.preventDefault();
    e.returnValue = "";
  };
  globalThis.addEventListener?.("beforeunload", onBeforeUnload);

  const removeRouteGuard = router?.beforeEach(async (to, from) => {
    if (!dirty.value || to.fullPath === from.fullPath) return true;
    return dialog({
      title: t("editor.leaveTitle"),
      message: t("editor.leaveMessage"),
      ok: t("editor.leave"),
      cancel: t("editor.keepEditing"),
    });
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  if (opts.draftKey && opts.value) {
    watch([dirty, opts.value], ([isDirty, value]) => {
      clearTimeout(timer);
      if (!isDirty) return;
      timer = setTimeout(
        () => writeDraft(opts.draftKey!, value as string),
        400
      );
    });
  }

  onBeforeUnmount(() => {
    clearTimeout(timer);
    globalThis.removeEventListener?.("beforeunload", onBeforeUnload);
    removeRouteGuard?.();
  });

  return {
    /** The draft left by a previous session, if any. */
    draft: (): string | null =>
      opts.draftKey ? readDraft(opts.draftKey) : null,
    /** Forget the draft — call after a successful save or an explicit discard. */
    clearDraft: () => {
      clearTimeout(timer);
      if (opts.draftKey) writeDraft(opts.draftKey, null);
    },
    /** Ask whether to restore a draft; resolves to the draft or null. */
    async offerDraft(): Promise<string | null> {
      const d = opts.draftKey ? readDraft(opts.draftKey) : null;
      if (!d) return null;
      const ok = await dialog({
        title: t("editor.restoreDraftTitle"),
        message: t("editor.restoreDraftMessage"),
        ok: t("editor.restore"),
        cancel: t("editor.discard"),
      });
      if (!ok) writeDraft(opts.draftKey!, null);
      return ok ? d : null;
    },
  };
}
