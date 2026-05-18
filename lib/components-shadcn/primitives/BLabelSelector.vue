<template>
  <div class="w-full space-y-2">
    <label
      v-if="label"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {{ label }}
    </label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <div
          :class="
            cn(
              'group flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all shadow-sm',
              !disable &&
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-muted-foreground/30 cursor-pointer',
              disable && 'opacity-50 cursor-not-allowed'
            )
          "
          @click="!disable && (open = true)"
        >
          <div v-if="selectedValues.length > 0" class="flex flex-wrap gap-1.5">
            <Badge
              v-for="value in selectedValues"
              :key="value"
              variant="secondary"
              class="flex items-center gap-1 pl-2 pr-1 py-0.5 h-6 animate-in fade-in zoom-in-95 duration-200 group-hover:bg-secondary/80"
            >
              {{ value }}
              <span
                v-if="!disable"
                class="flex h-4 w-4 items-center justify-center rounded-full outline-none hover:bg-muted-foreground/30 transition-colors"
                @click.stop="removeValue(value)"
              >
                <X class="h-2.5 w-2.5" />
              </span>
            </Badge>
          </div>
          <div v-else class="text-muted-foreground py-0.5 select-none">
            Select {{ multiple ? "items" : "item" }}...
          </div>
          <div
            v-if="!disable"
            class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <ChevronDown v-else class="h-4 w-4" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        class="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-muted/40 animate-in fade-in slide-in-from-top-2 duration-200"
        align="start"
      >
        <Command
          v-model:search-term="searchQuery"
          @update:search-term="onSearchChange"
        >
          <CommandInput placeholder="Type to search..." />
          <CommandList class="max-h-64 overflow-y-auto">
            <CommandEmpty class="py-4 text-center">
              <div v-if="loading" class="flex flex-col items-center gap-2 px-4">
                <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
                <p class="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                No results found
              </div>
            </CommandEmpty>

            <CommandGroup v-if="options.length > 0 && !loading">
              <CommandItem
                v-for="option in options"
                :key="option"
                :value="option"
                class="flex items-center justify-between mx-1 my-0.5 rounded-sm px-2 py-1.5"
                @select="selectOption(option)"
              >
                <div class="flex items-center gap-2">
                  <div
                    v-if="multiple"
                    :class="
                      cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-all',
                        selectedValues.includes(option)
                          ? 'bg-primary text-primary-foreground scale-100'
                          : 'opacity-50 scale-90 [&_svg]:invisible'
                      )
                    "
                  >
                    <Check class="h-3 w-3" />
                  </div>
                  <span class="text-sm">{{ option }}</span>
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
import { computed, ref, watch } from "vue";
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { Badge } from "../ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { X, Check, ChevronDown, Loader2 } from "lucide-vue-next";
import { cn } from "../utils";

interface Props {
  disable?: boolean;
  modelValue?: string | string[] | null;
  multiple?: boolean;
  label: string;
  optionLabel: string;
  url: string;
}

const props = withDefaults(defineProps<Props>(), {
  disable: false,
  modelValue: null,
  multiple: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | null];
  add: [value: string];
  remove: [value: string];
}>();

const { handleError } = useErrors();

const open = ref(false);
const searchQuery = ref("");
const loading = ref(false);
const options = ref<string[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const selectedValues = computed(() => {
  if (!props.modelValue) return [];
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue;
  }
  if (!props.multiple && typeof props.modelValue === "string") {
    return [props.modelValue];
  }
  return [];
});

const onSearchChange = (value: string) => {
  searchQuery.value = value;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (value.length < 1) {
    options.value = [];
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchOptions(value);
  }, 300);
};

const fetchOptions = async (query: string) => {
  loading.value = true;

  let url = props.url;
  if (query) {
    url = url + "?q=" + query.toLowerCase() + "&detail=basic";
  }

  try {
    const fetchedData = (await axios.get(url)).data;
    options.value = fetchedData.map(
      (option: Record<string, string>) => option[props.optionLabel]
    );
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

const selectOption = (value: string) => {
  if (props.multiple) {
    const current = [...selectedValues.value];
    const index = current.indexOf(value);

    if (index > -1) {
      current.splice(index, 1);
      emit("remove", value);
    } else {
      current.push(value);
      emit("add", value);
    }

    emit("update:modelValue", current);
  } else {
    emit("update:modelValue", value);
    emit("add", value);
    open.value = false;
  }
};

const removeValue = (value: string) => {
  if (props.multiple) {
    const current = selectedValues.value.filter((v) => v !== value);
    emit("update:modelValue", current);
    emit("remove", value);
  } else {
    emit("update:modelValue", null);
    emit("remove", value);
  }
};

// Clean up debounce timer on unmount
watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      searchQuery.value = "";
      options.value = [];
    }
  }
);
</script>
