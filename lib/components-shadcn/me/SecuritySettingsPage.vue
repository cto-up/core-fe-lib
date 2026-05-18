<template>
  <div class="security-settings-page max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        {{ t("auth.securitySettings.title") }}
      </h1>
      <p class="text-gray-600">
        {{ t("auth.securitySettings.subtitle") }}
      </p>
    </div>

    <MFASettings />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import MFASettings from "../auth/MFASettings.vue";

const { t } = useI18n();
</script>
