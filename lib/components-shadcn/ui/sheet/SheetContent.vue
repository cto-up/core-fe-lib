<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from "radix-vue";
import { X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { type SheetVariants, sheetVariants } from ".";
import { cn } from "../../utils";

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes["class"];
  side?: SheetVariants["side"];
  /** On by default; a sheet that draws its own close control passes false. */
  showClose?: boolean;
}

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<SheetContentProps>(), {
  showClose: true,
});
const { t } = useI18n();

const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
  const {
    class: _class,
    side: _side,
    showClose: _showClose,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      :class="cn(sheetVariants({ side }), props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <!-- A zero-height sticky row: the button stays in the corner while a long
           sheet scrolls, and takes no room from the content below it. -->
      <div
        v-if="props.showClose"
        class="pointer-events-none sticky top-0 z-10 flex h-0 justify-end"
      >
        <DialogClose
          class="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-md bg-background/80 text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          :aria-label="t('actions.close')"
          data-testid="sheet-close"
        >
          <X class="h-5 w-5" />
        </DialogClose>
      </div>
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
