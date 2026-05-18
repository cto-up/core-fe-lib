<template>
  <div class="flex flex-col gap-2">
    <Label v-if="label">{{ label }}</Label>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
        >
          <span v-if="selectedLabel" class="truncate">{{ selectedLabel }}</span>
          <span v-else class="text-muted-foreground">Select...</span>
          <Icon name="chevron-down" class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full p-0">
        <Command>
          <CommandInput
            :placeholder="`Search ${label.toLowerCase()}...`"
            @update:model-value="onSearch"
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="option in options"
                :key="option[optionValue]"
                :value="option[optionValue]"
                @select="onSelect(option)"
              >
                <Icon
                  name="check"
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

<script lang="ts" setup>
import { ref, computed } from "vue";
import axios from "axios";
import { Button } from "../ui/button";
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
import { Label } from "../ui/label";
import { cn } from "../utils";

interface Option {
  [key: string]: any;
}

const props = defineProps({
  modelValue: {
    type: Object as () => Option | Option[] | null,
    default: () => null,
  },
  multiple: {
    type: Boolean,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
  optionValue: {
    type: String,
    required: true,
  },
  optionLabel: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const options = ref<Option[]>([]);
const loading = ref(false);
const searchQuery = ref("");

const selectedLabel = computed(() => {
  if (!props.modelValue) return "";
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.map((v) => v[props.optionLabel]).join(", ");
  }
  return props.modelValue[props.optionLabel];
});

const isSelected = (option: Option) => {
  if (!props.modelValue) return false;
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.some(
      (v) => v[props.optionValue] === option[props.optionValue]
    );
  }
  return props.modelValue[props.optionValue] === option[props.optionValue];
};

const onSelect = (option: Option) => {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    const index = current.findIndex(
      (v) => v[props.optionValue] === option[props.optionValue]
    );

    if (index > -1) {
      emit(
        "update:modelValue",
        current.filter((_, i) => i !== index)
      );
    } else {
      emit("update:modelValue", [...current, option]);
    }
  } else {
    emit("update:modelValue", option);
    open.value = false;
  }
};

const onSearch = async (val: string) => {
  searchQuery.value = val;

  if (val.length < 1) {
    options.value = [];
    return;
  }

  loading.value = true;
  try {
    const url = `${props.url}?q=${val.toLowerCase()}&detail=basic`;
    const response = await axios.get(url);
    options.value = response.data ?? [];
  } catch (err) {
    console.error("Error fetching options:", err);
    options.value = [];
  } finally {
    loading.value = false;
  }
};
</script>
