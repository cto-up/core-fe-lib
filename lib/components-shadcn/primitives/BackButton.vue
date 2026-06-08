<script setup lang="ts">
import { computed, getCurrentInstance } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import { useI18n } from "vue-i18n";
import { ArrowLeft } from "lucide-vue-next";
import { Button } from "../ui/button";

const props = defineProps<{
  // Explicit destination. When omitted, navigates back in history.
  to?: RouteLocationRaw;
  // Accessible name + tooltip. Defaults to the generic "Back" label.
  label?: string;
  replace?: boolean;
}>();

// When a parent binds @click it takes full control of navigation; the
// built-in to/router.back() behaviour is skipped.
const emit = defineEmits<{ click: [] }>();

const router = useRouter();
const { t } = useI18n();
const instance = getCurrentInstance();

const accessibleLabel = computed(() => props.label ?? t("actions.back"));

function go() {
  if (instance?.vnode.props?.onClick) {
    emit("click");
    return;
  }
  if (props.to === undefined) {
    router.back();
    return;
  }
  if (props.replace) router.replace(props.to);
  else router.push(props.to);
}
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    class="shrink-0"
    :title="accessibleLabel"
    :aria-label="accessibleLabel"
    @click="go"
  >
    <ArrowLeft class="h-5 w-5" />
  </Button>
</template>
