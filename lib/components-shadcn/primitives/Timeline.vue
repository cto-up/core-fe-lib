<template>
  <div class="relative py-4">
    <div class="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />

    <div class="flex flex-col gap-6">
      <div
        v-for="(item, index) in sortedItems"
        :key="getKey(item, index)"
        class="relative pl-14"
      >
        <div
          class="absolute left-[14px] top-5 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm z-10"
        />
        <div
          class="absolute left-[8px] top-[52px] w-[28px] h-5 flex items-center justify-center"
        >
          <span class="text-[10px] font-semibold text-muted-foreground">
            {{ index + 1 }}
          </span>
        </div>

        <slot name="item" :item="item" :index="index" />
      </div>

      <div v-if="$slots.footer" class="relative pl-14">
        <div
          class="absolute left-[14px] top-5 w-4 h-4 rounded-full bg-muted border-2 border-border z-10"
        />
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from "vue";

interface Props<T> {
  items: T[];
  sortBy?: keyof T | ((item: T) => number | string);
  keyField?: keyof T;
}

const props = withDefaults(defineProps<Props<T>>(), {
  sortBy: undefined,
  keyField: undefined,
});

const sortedItems = computed(() => {
  if (!props.sortBy) return props.items;
  const fn =
    typeof props.sortBy === "function"
      ? props.sortBy
      : (item: T) => item[props.sortBy as keyof T];
  return [...props.items].sort((a, b) => {
    const av = fn(a);
    const bv = fn(b);
    if (typeof av === "string" && typeof bv === "string")
      return new Date(av).getTime() - new Date(bv).getTime();
    return (av as number) - (bv as number);
  });
});

const getKey = (item: T, index: number) => {
  if (props.keyField) return item[props.keyField] as unknown as string;
  if ("id" in item) return (item as any).id;
  return index;
};
</script>
