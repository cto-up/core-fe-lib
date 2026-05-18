<template>
  <div class="method-card border rounded-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-lg font-semibold">
          {{ title }}
        </h3>
        <p class="text-sm text-gray-600">
          {{ description }}
        </p>
      </div>
      <span
        :class="[
          'px-3 py-1 rounded-full text-xs font-semibold',
          enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
        ]"
      >
        {{ statusText }}
      </span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  enabled: boolean;
  statusText: string;
}>();
</script>
