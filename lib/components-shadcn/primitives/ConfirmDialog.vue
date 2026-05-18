<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent :class="contentClass || 'sm:max-w-[600px]'">
      <DialogHeader
        class="flex flex-row items-center justify-between space-y-0"
      >
        <div class="flex items-center gap-4">
          <div
            v-if="icon"
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :class="`bg-${iconColor}/10`"
          >
            <component
              :is="iconComponent"
              :class="`h-6 w-6 text-${iconColor}`"
            />
          </div>
          <DialogTitle>{{ title }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ title }}
          </DialogDescription>
        </div>
        <div class="flex items-center gap-2">
          <slot name="headerActions" />
        </div>
      </DialogHeader>

      <Separator />

      <div :class="contentWrapperClass || 'max-h-[60vh] overflow-y-auto'">
        <slot name="content" />
      </div>

      <Separator v-if="showActions" />

      <DialogFooter v-if="showActions">
        <Button variant="outline" @click="handleCancel">
          {{ cancelLabel }}
        </Button>
        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Circle } from "lucide-vue-next";
import * as LucideIcons from "lucide-vue-next";

interface Props {
  open: boolean;
  title: string;
  icon?: string;
  iconColor?: string;
  showActions?: boolean;
  okLabel?: string;
  cancelLabel?: string;
  okColor?: string;
  contentClass?: string;
  contentWrapperClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "",
  iconColor: "primary",
  showActions: true,
  okLabel: "OK",
  cancelLabel: "Cancel",
  okColor: "primary",
  contentClass: "",
  contentWrapperClass: "",
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  ok: [];
  cancel: [];
}>();

const handleOpenChange = (value: boolean) => emit("update:open", value);

const handleCancel = () => {
  emit("cancel");
  emit("update:open", false);
};

const iconComponent = computed(() => {
  if (!props.icon) return Circle;
  const iconName = props.icon.charAt(0).toUpperCase() + props.icon.slice(1);
  return (LucideIcons as any)[iconName] || Circle;
});
</script>
