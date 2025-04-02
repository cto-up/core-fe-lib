<template>
  <q-chip
    v-if="mapSize"
    :color="color"
    text-color="white"
    :icon="icon"
    :label="label"
    :size="size"
  >
    <q-tooltip>{{ tooltip }}</q-tooltip>
  </q-chip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCommandStore } from 'stores/command-store';
import { storeToRefs } from 'pinia';

const commandStore = useCommandStore();
const { entityCommandMap } = storeToRefs(commandStore);

const size = ref('md');

const mapSize = computed(() => entityCommandMap.value.size);

const color = computed(() => {
  if (mapSize.value === 0) return 'positive';
  if (mapSize.value < 5) return 'warning';
  return 'negative';
});

const icon = computed(() => {
  if (mapSize.value === 0) return 'check_circle';
  return 'sync';
});

const label = computed(() => {
  if (mapSize.value === 0) return 'Saved';
  return `Saving ${mapSize.value} item${mapSize.value > 1 ? 's' : ''}`;
});

const tooltip = computed(() => {
  if (mapSize.value === 0) return 'All changes are saved';
  return `${mapSize.value} change${mapSize.value > 1 ? 's' : ''} pending`;
});
</script>
