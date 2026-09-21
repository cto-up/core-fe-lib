<template>
  <div class="space-y-1">
    <Label v-if="label">{{ label }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          type="button"
          class="w-full justify-start font-normal"
          :data-test="dataTest"
        >
          <span
            class="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted"
          >
            <Icon
              v-if="resolved"
              :name="modelValue!"
              :default-class="'h-3.5 w-3.5'"
            />
            <ImageOff v-else class="h-3.5 w-3.5 text-muted-foreground/60" />
          </span>
          <span class="truncate font-mono text-xs">
            {{ modelValue || placeholder }}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent class="w-80 p-0" align="start">
        <div class="border-b p-2">
          <div class="relative">
            <Search
              class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="query"
              placeholder="Search icons…"
              class="h-8 pl-7 text-sm"
              data-test="icon-search"
            />
          </div>
        </div>

        <div class="max-h-64 overflow-y-auto p-2">
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="name in shown"
              :key="name"
              type="button"
              :title="name"
              :data-test="`icon-opt-${name}`"
              class="flex h-8 w-8 items-center justify-center rounded transition hover:bg-accent"
              :class="name === modelValue ? 'bg-primary/10 text-primary' : ''"
              @click="pick(name)"
            >
              <Icon :name="name" :default-class="'h-4 w-4'" />
            </button>
          </div>

          <p
            v-if="!shown.length"
            class="py-6 text-center text-xs text-muted-foreground"
          >
            No icon matches “{{ query }}”.
          </p>
          <p
            v-else-if="hidden > 0"
            class="pt-2 text-center text-xs text-muted-foreground"
          >
            {{ hidden }} more — keep typing to narrow.
          </p>
        </div>

        <div class="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            class="w-full"
            data-test="icon-clear"
            @click="pick('')"
          >
            No icon
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ImageOff, Search } from "lucide-vue-next";
import Icon from "../Icon.vue";
import { iconNames, resolveIcon } from "../icon-names";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    dataTest?: string;
  }>(),
  { placeholder: "Pick an icon…" }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();

const open = ref(false);
const query = ref("");

const resolved = computed(() => !!resolveIcon(props.modelValue));

/**
 * Lucide ships over 1500 glyphs and a grid of all of them janks the popover on
 * every keystroke, so the list is capped and the count of what is left is
 * shown instead — a search box the user is already typing into is a better
 * scrollbar than a scrollbar.
 */
const LIMIT = 96;

const matches = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? iconNames.filter((n) => n.includes(q)) : iconNames;
});
const shown = computed(() => matches.value.slice(0, LIMIT));
const hidden = computed(() => Math.max(0, matches.value.length - LIMIT));

function pick(name: string) {
  emit("update:modelValue", name);
  open.value = false;
}
</script>
