<template>
  <div class="space-y-2">
    <Label v-if="label">{{ label }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
          :disabled="loading"
        >
          <span class="truncate">
            {{ displayValue || placeholder }}
          </span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full p-0">
        <Command>
          <CommandInput
            :placeholder="searchPlaceholder"
            @update:model-value="onSearch"
          />
          <CommandEmpty>{{ emptyText }}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="option in options"
                :key="option[optionValue]"
                :value="option[optionValue]"
                @select="onSelect(option)"
              >
                <Check
                  :class="
                    cn(
                      'mr-2 h-4 w-4',
                      isSelected(option) ? 'opacity-100' : 'opacity-0'
                    )
                  "
                />
                {{ option[optionLabel] }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import axios from "axios";
import { Button } from "../button";
import { Label } from "../label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { cn } from "../../utils";
import { useI18n } from "vue-i18n";
import { useToast } from "../toast";

interface Props {
  modelValue?: string | string[];
  multiple?: boolean;
  label?: string;
  optionValue: string;
  optionLabel: string;
  optionExtra?: string;
  url: string;
  useI18n?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  useI18n: false,
  placeholder: "Select option...",
  searchPlaceholder: "Search...",
  emptyText: "No results found.",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | undefined];
  "update:label": [value: string];
  "update:extra": [value: string];
}>();

const { locale } = useI18n();
const { toast } = useToast();

const open = ref(false);
const loading = ref(false);
const options = ref<any[]>([]);
const internalModel = ref<any>(null);
const searchQuery = ref("");
const searchTimeout = ref<NodeJS.Timeout>();

const displayValue = computed(() => {
  if (!internalModel.value) return "";
  if (Array.isArray(internalModel.value)) {
    return internalModel.value.map((v) => v[props.optionLabel]).join(", ");
  }
  return internalModel.value[props.optionLabel] || "";
});

const buildUrl = (baseUrl: string, id?: string, query?: string) => {
  const cleanUrl = baseUrl.split("?")[0];
  const url = new URL(
    id ? `${cleanUrl}/${id}` : baseUrl,
    window.location.origin
  );

  url.searchParams.append("detail", "basic");

  if (props.useI18n) {
    url.searchParams.append("lang", locale.value);
  }

  if (query) {
    url.searchParams.append("q", query.toLowerCase());
  }

  return url.pathname + url.search;
};

const loadOne = async (newValue: string | string[] | undefined) => {
  if (!newValue) {
    internalModel.value = props.multiple ? [] : null;
    emit("update:label", "");
    emit("update:modelValue", undefined);
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

      internalModel.value = {
        [props.optionValue]: fetchedData[props.optionValue],
        [props.optionLabel]: fetchedData[props.optionLabel],
      };
      emit("update:label", fetchedData[props.optionLabel]);

      if (props.optionExtra) {
        emit("update:extra", fetchedData[props.optionExtra]);
      }
    }
  } catch (err) {
    console.error("Failed to load option:", err);
    toast({
      title: "Failed to load option",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadOptions = async (query?: string) => {
  loading.value = true;
  try {
    const { data } = await axios.get(buildUrl(props.url, undefined, query));
    options.value = data ?? [];
  } catch (err) {
    console.error("Failed to load options:", err);
    toast({
      title: "Failed to load options",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const onSearch = (value: string) => {
  searchQuery.value = value;

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    loadOptions(value);
  }, 500);
};

const isSelected = (option: any) => {
  if (!internalModel.value) return false;
  if (Array.isArray(internalModel.value)) {
    return internalModel.value.some(
      (v) => v[props.optionValue] === option[props.optionValue]
    );
  }
  return internalModel.value[props.optionValue] === option[props.optionValue];
};

const onSelect = (option: any) => {
  if (props.multiple) {
    if (!Array.isArray(internalModel.value)) {
      internalModel.value = [];
    }

    const index = internalModel.value.findIndex(
      (v) => v[props.optionValue] === option[props.optionValue]
    );

    if (index > -1) {
      internalModel.value.splice(index, 1);
    } else {
      internalModel.value.push(option);
    }

    const values = internalModel.value.map((v) => v[props.optionValue]);
    const labels = internalModel.value
      .map((v) => v[props.optionLabel])
      .join(", ");

    emit("update:modelValue", values);
    emit("update:label", labels);
  } else {
    internalModel.value = option;
    emit("update:modelValue", option[props.optionValue]);
    emit("update:label", option[props.optionLabel]);

    if (props.optionExtra) {
      emit("update:extra", option[props.optionExtra]);
    }

    open.value = false;
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== internalModel.value) {
      loadOne(newValue);
    }
  }
);

watch(locale, () => {
  if (props.useI18n && props.modelValue) {
    loadOne(props.modelValue);
  }
});

watch(open, (isOpen) => {
  if (isOpen && options.value.length === 0) {
    loadOptions();
  }
});

onMounted(() => {
  if (props.modelValue) {
    loadOne(props.modelValue);
  }
});
</script>
