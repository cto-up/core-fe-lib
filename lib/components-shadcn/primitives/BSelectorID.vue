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
              'group flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all shadow-sm cursor-pointer',
              'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-muted-foreground/30'
            )
          "
          @click="open = true"
        >
          <div v-if="!isEmpty" class="flex flex-wrap gap-1.5 flex-1">
            <template v-if="multiple && Array.isArray(internalModel)">
              <Badge
                v-for="(item, index) in internalModel"
                :key="index"
                variant="secondary"
                class="flex items-center gap-1 pl-2 pr-1 py-0.5 h-6 animate-in fade-in zoom-in-95 duration-200 group-hover:bg-secondary/80"
              >
                {{ getItemLabel(item) }}
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full outline-none hover:bg-muted-foreground/30 transition-colors"
                  @click.stop="removeItem(index)"
                >
                  <X class="h-2.5 w-2.5" />
                </span>
              </Badge>
            </template>
            <span v-else-if="!multiple && internalModel" class="py-0.5">
              {{ getItemLabel(internalModel) }}
            </span>
          </div>
          <div v-else class="text-muted-foreground py-0.5 select-none flex-1">
            Select {{ multiple ? "items" : "item" }}...
          </div>
          <div
            class="ml-auto opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            <X
              v-if="!isEmpty"
              class="h-4 w-4 hover:text-foreground"
              @click.stop="clearSelection"
            />
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
                :key="getOptionValue(option)"
                :value="getOptionValue(option)"
                class="flex items-center justify-between mx-1 my-0.5 rounded-sm px-2 py-1.5"
                @select="selectOption(option)"
              >
                <div class="flex items-center gap-2">
                  <div
                    v-if="multiple"
                    :class="
                      cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-all',
                        isSelected(option)
                          ? 'bg-primary text-primary-foreground scale-100'
                          : 'opacity-50 scale-90 [&_svg]:invisible'
                      )
                    "
                  >
                    <Check class="h-3 w-3" />
                  </div>
                  <span class="text-sm">{{ getOptionLabel(option) }}</span>
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
import { useI18n } from "vue-i18n";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { X, Check, ChevronDown, Loader2 } from "lucide-vue-next";
import { cn } from "../utils";

interface Option {
  [key: string]: any;
}

interface Props {
  modelValue?: string | string[] | undefined;
  multiple?: boolean;
  label: string;
  optionValue: string;
  optionLabel: string;
  optionExtra?: string;
  url: string;
  useI18n?: boolean;
  // Opt out of appending `?detail=basic`. Needed when the backend list
  // handler doesn't implement the basic-detail projection (or implements
  // it incorrectly — e.g. core's /api/v1/users panics on nil Profile).
  noDetail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  multiple: false,
  useI18n: false,
  noDetail: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | undefined];
  "update:label": [value: string];
  "update:extra": [value: string];
}>();

const { locale } = useI18n();
const { handleError } = useErrors();

const open = ref(false);
const searchQuery = ref("");
const loading = ref(false);
const options = ref<Option[]>([]);
const internalModel = ref<Option | Option[] | string>(props.multiple ? [] : "");
const lastFilterValue = ref("NONSENSE");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const isEmpty = computed(() => {
  return (
    !internalModel.value ||
    (Array.isArray(internalModel.value) && internalModel.value.length === 0) ||
    internalModel.value === ""
  );
});

// Function to build URL with language parameter
const buildUrl = (baseUrl: string, id?: string, query?: string) => {
  const cleanUrl = baseUrl.split("?")[0];
  const url = new URL(
    id ? `${cleanUrl}/${id}` : baseUrl,
    window.location.origin
  );

  if (!props.noDetail) {
    url.searchParams.append("detail", "basic");
  }

  if (props.useI18n) {
    url.searchParams.append("lang", locale.value);
  }

  if (query) {
    url.searchParams.append("q", query.toLowerCase());
  }

  return url.pathname + url.search;
};

const getOptionValue = (option: Option): string => {
  return String(option[props.optionValue]);
};

const getOptionLabel = (option: Option): string => {
  return String(option[props.optionLabel]);
};

const getItemLabel = (item: Option | string): string => {
  if (typeof item === "string") return item;
  return getOptionLabel(item);
};

const isSelected = (option: Option): boolean => {
  if (!props.multiple || !Array.isArray(internalModel.value)) return false;
  return internalModel.value.some(
    (item) => getOptionValue(item) === getOptionValue(option)
  );
};

const loadOne = async (newValue: string | string[] | undefined) => {
  console.log("loadOne", newValue);
  if (!newValue && !internalModel.value) {
    return;
  }
  if (!newValue) {
    emit("update:label", "");
    emit("update:modelValue", undefined);
    internalModel.value = props.multiple ? [] : "";

    if (props.optionExtra) {
      emit("update:extra", "");
    }
    return;
  }

  loading.value = true;
  try {
    if (props.multiple && Array.isArray(newValue)) {
      const promises = newValue.map((id) => axios.get(buildUrl(props.url, id)));
      const responses = await Promise.all(promises);

      internalModel.value = responses.map((response) => ({
        [props.optionValue]: response.data[props.optionValue],
        [props.optionLabel]: response.data[props.optionLabel],
      }));
      emit(
        "update:label",
        responses.map((r) => r.data[props.optionLabel]).join(", ")
      );
    } else if (!Array.isArray(newValue)) {
      const fetchedData = (await axios.get(buildUrl(props.url, newValue))).data;

      const option = {
        [props.optionValue]: fetchedData[props.optionValue],
        [props.optionLabel]: fetchedData[props.optionLabel],
      };

      internalModel.value = option;
      emit("update:label", fetchedData[props.optionLabel]);
    }
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

const loadExtra = async (newValue: string | string[]) => {
  if (!props.optionExtra) {
    return;
  }
  if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
    return;
  }

  loading.value = true;
  try {
    if (props.multiple && Array.isArray(newValue)) {
      const promises = newValue.map((id) => axios.get(buildUrl(props.url, id)));
      const responses = await Promise.all(promises);
      const extraValues = responses
        .map((r) => (props.optionExtra ? r.data[props.optionExtra] : undefined))
        .join(", ");
      emit("update:extra", extraValues);
    } else if (!Array.isArray(newValue)) {
      const fetchedData = (await axios.get(buildUrl(props.url, newValue))).data;
      emit("update:extra", fetchedData[props.optionExtra]);
    }
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

const onSearchChange = (value: string) => {
  searchQuery.value = value;

  if (value === lastFilterValue.value) {
    return;
  }
  lastFilterValue.value = value;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    fetchOptions(value);
  }, 500);
};

const fetchOptions = async (query: string) => {
  loading.value = true;
  try {
    const { data } = await axios.get(buildUrl(props.url, undefined, query));
    options.value = data ?? [];
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};

const selectOption = (option: Option) => {
  if (props.multiple) {
    const current = Array.isArray(internalModel.value)
      ? [...internalModel.value]
      : [];
    const index = current.findIndex(
      (item) => getOptionValue(item) === getOptionValue(option)
    );

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(option);
    }

    internalModel.value = current;
    const values = current.map((v) => getOptionValue(v));
    const labels = current.map((v) => getOptionLabel(v)).join(", ");

    emit("update:modelValue", values);
    emit("update:label", labels);
    loadExtra(values);
  } else {
    internalModel.value = option;
    emit("update:modelValue", getOptionValue(option));
    emit("update:label", getOptionLabel(option));
    open.value = false;

    if (props.optionExtra) {
      loadExtra(getOptionValue(option));
    }
  }
};

const removeItem = (index: number) => {
  if (!props.multiple || !Array.isArray(internalModel.value)) return;

  const current = [...internalModel.value];
  current.splice(index, 1);
  internalModel.value = current;

  const values = current.map((v) => getOptionValue(v));
  const labels = current.map((v) => getOptionLabel(v)).join(", ");

  emit("update:modelValue", values.length > 0 ? values : undefined);
  emit("update:label", labels);

  if (props.optionExtra) {
    loadExtra(values);
  }
};

const clearSelection = () => {
  internalModel.value = props.multiple ? [] : "";
  emit("update:modelValue", undefined);
  emit("update:label", "");

  if (props.optionExtra) {
    emit("update:extra", "");
  }
};

// Load initial data
loadOne(props.modelValue).catch((err) => {
  handleError(err);
});

// Watch for modelValue changes
watch(
  () => props.modelValue,
  async (newValue) => {
    if (props.modelValue === internalModel.value) {
      return;
    }
    loadOne(newValue);
  }
);

// Watch for locale changes and reload data if useI18n is true
watch(locale, () => {
  if (props.useI18n && props.modelValue) {
    loadOne(props.modelValue);
    if (props.optionExtra) {
      loadExtra(props.modelValue);
    }
  }
});

// Clean up when popover closes
watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      searchQuery.value = "";
      options.value = [];
      lastFilterValue.value = "NONSENSE";
    }
  }
);
</script>
