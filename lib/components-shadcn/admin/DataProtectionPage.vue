<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="max-w-3xl space-y-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("core.dataProtection.title") }}
        </h2>
        <p class="mt-1 text-muted-foreground">
          {{ $t("core.dataProtection.subtitle") }}
        </p>
      </div>

      <Card v-for="section in sections" :key="section.title">
        <CardHeader>
          <CardTitle class="text-lg">{{ section.title }}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="divide-y">
            <li
              v-for="line in section.lines"
              :key="line.label"
              data-testid="data-protection-line"
              class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <RouterLink
                v-if="line.to && canOpen(line)"
                :to="line.to"
                class="font-medium text-primary underline-offset-4 hover:underline"
              >
                {{ line.label }}
              </RouterLink>
              <a
                v-else-if="line.href && canOpen(line)"
                :href="line.href"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                {{ line.label }}
                <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span v-else class="font-medium">{{ line.label }}</span>
              <span
                v-if="line.value"
                class="font-mono text-sm text-muted-foreground"
              >
                {{ line.value }}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ExternalLink } from "lucide-vue-next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useUserStore } from "../../stores/user-store";
import type {
  DataProtectionLine,
  DataProtectionSection,
} from "./data-protection";

defineProps<{ sections: DataProtectionSection[] }>();

const userStore = useUserStore();

const canOpen = (line: DataProtectionLine) =>
  !line.requires || userStore.hasPrivilege(line.requires);
</script>
