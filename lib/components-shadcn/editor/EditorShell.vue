<!--
  EditorShell — the one frame every content editor uses (SVG designer, theme
  editor, equation editor): header with title and Cancel/Save, a main area, and
  a side panel that becomes a bottom sheet on phones. Owns the save/cancel
  contract: Esc cancels, Cmd/Ctrl+Enter (and Cmd/Ctrl+S) saves, and cancelling
  dirty work asks first.
-->
<template>
  <div
    class="flex h-full min-h-0 w-full flex-col bg-background"
    @keydown="onKeydown"
  >
    <header class="flex items-center gap-2 border-b px-3 py-2 sm:px-4">
      <h2
        class="min-w-0 flex-1 truncate font-display text-base font-bold tracking-tight"
      >
        {{ title }}
        <span
          v-if="dirty"
          class="ml-2 inline-block h-2 w-2 rounded-full bg-primary align-middle"
          :title="t('editor.unsaved')"
          :aria-label="t('editor.unsaved')"
        />
      </h2>
      <slot name="toolbar" />
      <Button variant="ghost" size="sm" type="button" @click="requestCancel">
        {{ cancelLabel ?? t("actions.cancel") }}
      </Button>
      <Button
        size="sm"
        type="button"
        :disabled="saving || saveDisabled"
        @click="emit('save')"
      >
        <Loader2
          v-if="saving"
          class="mr-1 h-4 w-4 animate-spin"
          aria-hidden="true"
        />
        {{ saving ? t("editor.saving") : (saveLabel ?? t("actions.save")) }}
      </Button>
    </header>

    <div
      v-if="error"
      role="alert"
      class="flex items-start gap-2 border-b border-error/30 bg-error/10 px-4 py-2 text-sm text-error"
    >
      <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0">{{ error }}</span>
    </div>

    <div class="relative flex min-h-0 flex-1">
      <main class="min-w-0 flex-1 overflow-auto">
        <slot />
      </main>

      <aside
        v-if="$slots.panel"
        class="hidden w-80 shrink-0 overflow-y-auto border-l bg-card md:block"
        :aria-label="panelLabel ?? t('editor.panel')"
      >
        <slot name="panel" />
      </aside>

      <!-- Phone: the panel is a bottom sheet the user opens on demand. -->
      <template v-if="$slots.panel">
        <button
          v-if="!sheetOpen"
          type="button"
          class="absolute bottom-3 right-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm shadow-ambient md:hidden"
          @click="sheetOpen = true"
        >
          <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
          {{ panelLabel ?? t("editor.panel") }}
        </button>
        <section
          v-else
          class="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-2xl bg-card shadow-ambient md:hidden"
          :aria-label="panelLabel ?? t('editor.panel')"
        >
          <div class="sticky top-0 flex justify-end bg-card p-1">
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full"
              :aria-label="t('editor.hidePanel')"
              @click="sheetOpen = false"
            >
              <ChevronDown class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <slot name="panel" />
        </section>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ChevronDown,
  Loader2,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-vue-next";
import { Button } from "../ui/button";
import { useDialog } from "../composables/useDialog";

const props = defineProps<{
  title: string;
  dirty: boolean;
  saving?: boolean;
  saveDisabled?: boolean;
  /** Shown in an orange banner under the header, with its cause. */
  error?: string;
  saveLabel?: string;
  cancelLabel?: string;
  panelLabel?: string;
}>();

const emit = defineEmits<{ save: []; cancel: [] }>();

const { t } = useI18n();
const { dialog } = useDialog();
const sheetOpen = ref(false);

async function requestCancel() {
  if (props.dirty) {
    const ok = await dialog({
      title: t("editor.discardTitle"),
      message: t("editor.discardMessage"),
      ok: t("editor.discard"),
      cancel: t("editor.keepEditing"),
      destructive: true,
    });
    if (!ok) return;
  }
  emit("cancel");
}

function onKeydown(e: KeyboardEvent) {
  if (e.defaultPrevented) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && (e.key === "Enter" || e.key.toLowerCase() === "s")) {
    e.preventDefault();
    if (!props.saving && !props.saveDisabled) emit("save");
  } else if (e.key === "Escape") {
    e.preventDefault();
    requestCancel();
  }
}

defineExpose({ requestCancel });
</script>
