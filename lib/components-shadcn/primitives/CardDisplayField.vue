<template>
  <div class="w-full">
    <div class="text-xs text-muted-foreground mb-1">
      {{ fieldName }}
    </div>
    <div class="text-sm">
      {{ fieldValue || $t("core.info.notSpecified") }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  fieldValue: {
    type: String,
    required: true,
  },
});
</script>
