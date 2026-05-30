<template>
  <div class="w-full">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <div
          class="group flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-muted-foreground/30 transition-all cursor-pointer shadow-sm"
          @click="open = true"
        >
          <div v-if="internalValue.length > 0" class="flex flex-wrap gap-1.5">
            <template v-for="value in internalValue" :key="value">
              <Badge
                variant="secondary"
                class="flex items-center gap-1 pl-2 pr-1 py-0.5 h-6 animate-in fade-in zoom-in-95 duration-200 group-hover:bg-secondary/80"
              >
                {{ getLabel(value) }}
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full outline-none hover:bg-muted-foreground/30 transition-colors"
                  @click.stop="toggleOption(value)"
                >
                  <X class="h-2.5 w-2.5" />
                </span>
              </Badge>
            </template>
          </div>
          <div v-else class="text-muted-foreground py-0.5 select-none">
            {{ placeholder || "Select items..." }}
          </div>
          <div
            class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown class="h-4 w-4" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        class="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-muted/40 animate-in fade-in slide-in-from-top-2 duration-200"
        align="start"
      >
        <Command v-model:search-term="searchQuery">
          <CommandInput
            :placeholder="placeholder || 'Search or add...'"
            @keydown.enter="handleEnter"
            @keydown.delete="handleBackspace"
          />
          <CommandList class="max-h-64 overflow-y-auto">
            <CommandEmpty class="py-4 text-center">
              <div
                v-if="searchQuery"
                class="flex flex-col items-center gap-3 px-4"
              >
                <p class="text-sm text-muted-foreground">
                  No matches found for "{{ searchQuery }}"
                </p>
                <Button
                  v-if="allowNew"
                  size="sm"
                  variant="secondary"
                  class="w-full h-9 text-xs font-semibold"
                  @click="addNewOption"
                >
                  <Plus class="mr-2 h-3.5 w-3.5" />
                  Create "{{ searchQuery }}"
                </Button>
              </div>
              <span v-else class="text-sm text-muted-foreground"
                >Type to search or add...</span
              >
            </CommandEmpty>

            <CommandGroup
              v-if="filteredOptions.length > 0"
              heading="Suggestions"
            >
              <CommandItem
                v-for="option in filteredOptions"
                :key="getValue(option)"
                :value="getValue(option)"
                class="flex items-center justify-between mx-1 my-0.5 rounded-sm px-2 py-1.5"
                @select="toggleOption(getValue(option))"
              >
                <div class="flex items-center gap-2">
                  <div
                    :class="
                      cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-all',
                        internalValue.includes(getValue(option))
                          ? 'bg-primary text-primary-foreground scale-100'
                          : 'opacity-50 scale-90 [&_svg]:invisible'
                      )
                    "
                  >
                    <Check class="h-3 w-3" />
                  </div>
                  <span class="text-sm">{{ option.label }}</span>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { X, Check, Plus, ChevronDown } from "lucide-vue-next";
import { cn } from "../../utils";

interface Option {
  label: string;
  value: string;
}

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    default: () => [],
  },
  options: {
    type: Array as () => (string | Option)[],
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Select options...",
  },
  allowNew: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const searchQuery = ref("");

const internalValue = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const normalizedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  });
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return normalizedOptions.value;
  return normalizedOptions.value.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function getLabel(val: string) {
  const opt = normalizedOptions.value.find((o) => o.value === val);
  return opt ? opt.label : val;
}

function getValue(val: string | Option) {
  return typeof val === "string" ? val : val.value;
}

function toggleOption(value: string) {
  const current = [...internalValue.value];
  const index = current.indexOf(value);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(value);
  }
  emit("update:modelValue", current);
}

function handleEnter(e: KeyboardEvent) {
  if (
    props.allowNew &&
    searchQuery.value &&
    !filteredOptions.value.some(
      (o) => o.label.toLowerCase() === searchQuery.value.toLowerCase()
    )
  ) {
    addNewOption();
    e.preventDefault();
  }
}

function handleBackspace(e: KeyboardEvent) {
  if (!searchQuery.value && internalValue.value.length > 0) {
    const current = [...internalValue.value];
    current.pop();
    emit("update:modelValue", current);
  }
}

function addNewOption() {
  if (!searchQuery.value) return;
  const val = searchQuery.value.trim();
  if (val && !internalValue.value.includes(val)) {
    emit("update:modelValue", [...internalValue.value, val]);
  }
  searchQuery.value = "";
}
</script>
