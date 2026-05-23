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
          :disabled="disable || loading"
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
                v-for="(option, index) in options"
                :key="index"
                :value="option"
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
                {{ option }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <!-- Display selected chips for multiple mode -->
    <div
      v-if="multiple && selectedLabels.length > 0"
      class="flex flex-wrap gap-2 mt-2"
    >
      <Badge
        v-for="(label, index) in selectedLabels"
        :key="index"
        variant="secondary"
        class="gap-1"
      >
        {{ label }}
        <button
          class="ml-1 hover:bg-destructive/20 rounded-full"
          @click.stop="removeLabel(label)"
        >
          <X class="h-3 w-3" />
        </button>
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import axios from "axios";
import { Button } from "../button";
import { Label } from "../label";
import { Badge } from "../badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Check, ChevronsUpDown, X } from "lucide-vue-next";
import { cn } from "../../utils";
import { useToast } from "../toast";

interface Props {
  modelValue?: string | string[];
  disable?: boolean;
  multiple?: boolean;
  label?: string;
  optionLabel: string;
  url: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disable: false,
  placeholder: "Select option...",
  searchPlaceholder: "Search...",
  emptyText: "No results found.",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[]];
  add: [value: string];
  remove: [value: string];
}>();

const { toast } = useToast();

const open = ref(false);
const loading = ref(false);
const options = ref<string[]>([]);
const selectedLabels = ref<string[]>([]);
const searchTimeout = ref<NodeJS.Timeout>();

const displayValue = computed(() => {
  if (props.multiple) {
    return selectedLabels.value.length > 0
      ? `${selectedLabels.value.length} selected`
      : "";
  }
  return selectedLabels.value[0] || "";
});

const isSelected = (option: string) => {
  return selectedLabels.value.includes(option);
};

const loadOptions = async (query?: string) => {
  if (!query || query.length < 1) {
    options.value = [];
    return;
  }

  loading.value = true;
  try {
    let url = props.url;
    if (query) {
      url = `${url}?q=${query.toLowerCase()}&detail=basic`;
    }

    const { data } = await axios.get(url);
    options.value = data.map((option: any) => option[props.optionLabel]);
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
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    loadOptions(value);
  }, 300);
};

const onSelect = (option: string) => {
  if (props.multiple) {
    const index = selectedLabels.value.indexOf(option);

    if (index > -1) {
      selectedLabels.value.splice(index, 1);
      emit("remove", option);
    } else {
      selectedLabels.value.push(option);
      emit("add", option);
    }

    emit("update:modelValue", [...selectedLabels.value]);
  } else {
    selectedLabels.value = [option];
    emit("update:modelValue", option);
    open.value = false;
  }
};

const removeLabel = (label: string) => {
  const index = selectedLabels.value.indexOf(label);
  if (index > -1) {
    selectedLabels.value.splice(index, 1);
    emit("remove", label);
    emit("update:modelValue", [...selectedLabels.value]);
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedLabels.value = Array.isArray(newValue)
        ? [...newValue]
        : [newValue];
    } else {
      selectedLabels.value = [];
    }
  },
  { immediate: true }
);
</script>
