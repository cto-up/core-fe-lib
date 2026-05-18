<template>
  <!-- WITH expansion -->
  <AccordionItem v-if="hasExpansion" :value="label || 'item'">
    <AccordionTrigger class="hover:no-underline">
      <div class="flex items-center gap-2">
        <Icon v-if="icon" :name="icon" class="h-4 w-4" />
        <div class="flex flex-col items-start">
          <span>{{ label }}</span>
          <span v-if="caption" class="text-xs text-muted-foreground">{{
            caption
          }}</span>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <slot />
    </AccordionContent>
  </AccordionItem>

  <!-- WITHOUT expansion - just render slot -->
  <template v-else>
    <slot />
  </template>
</template>

<script setup lang="ts">
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

defineProps<{
  hasExpansion?: boolean;
  group?: string;
  icon?: string;
  label?: string;
  caption?: string;
  defaultOpened?: boolean;
  headerInsetLevel?: number;
  contentInsetLevel?: number;
  to?: string;
  expandSeparator?: boolean;
}>();
</script>
