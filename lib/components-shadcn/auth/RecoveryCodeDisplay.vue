<template>
  <div class="space-y-4">
    <div class="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <svg
          class="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h4 class="font-semibold text-amber-900 mb-1">
            {{ t("mfa.setup.recovery.warningTitle") }}
          </h4>
          <p class="text-sm text-amber-800">
            {{ t("mfa.setup.recovery.warningMessage") }}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
      <div class="grid grid-cols-2 gap-2">
        <code
          v-for="code in recoveryCodes"
          :key="code"
          class="bg-white px-3 py-2 rounded text-center text-sm font-mono border border-gray-200"
        >
          {{ code }}
        </code>
      </div>
    </div>

    <div class="flex gap-2">
      <Button
        class="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
        @click="emit('copy')"
      >
        📋 {{ t("mfa.setup.recovery.copy") }}
      </Button>
      <Button
        class="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
        @click="emit('download')"
      >
        💾 {{ t("mfa.setup.recovery.download") }}
      </Button>
    </div>

    <p class="text-xs text-gray-500 text-center">
      {{ t("mfa.setup.recovery.interactionHint") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";

const { t } = useI18n();

defineProps<{
  recoveryCodes: string[];
}>();

const emit = defineEmits<{
  (e: "copy"): void;
  (e: "download"): void;
}>();
</script>
