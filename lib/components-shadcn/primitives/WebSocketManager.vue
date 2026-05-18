<script setup lang="ts">
import { watch } from "vue";

/**
 * Renderless lifecycle manager: watches a tuple of reactive triggers
 * and calls `connect()` when ALL truthy, `disconnect()` otherwise.
 *
 * Caller wires the actual socket implementation:
 *
 *   <WebSocketManager
 *     :triggers="[() => userStore.isLogged, () => circleStore.selectedCircleId]"
 *     :connect="connect"
 *     :disconnect="disconnect"
 *   />
 *
 * Triggers are getter functions so reactivity is preserved at the call site.
 */
const props = defineProps<{
  triggers: Array<() => unknown>;
  connect: () => void;
  disconnect: () => void;
}>();

watch(
  () => props.triggers.map((g) => g()),
  (values) => {
    const allTruthy = values.every((v) => !!v);
    if (allTruthy) props.connect();
    else props.disconnect();
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <!-- Renderless -->
</template>
