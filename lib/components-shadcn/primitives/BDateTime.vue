<template>
  <div class="flex flex-col gap-2">
    <Label v-if="label">{{ label }}</Label>
    <Popover v-model:open="showPopup">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="
            cn(
              'w-full justify-start text-left font-normal',
              !displayValue && 'text-muted-foreground',
              error && 'border-red-500'
            )
          "
          :disabled="disable"
        >
          <Icon name="calendar" class="mr-2 h-4 w-4" />
          {{ displayValue || "Pick a date and time" }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0">
        <Calendar
          v-model="calendarValue"
          mode="dateTime"
          @update:model-value="onDateTimeSelect"
        />
      </PopoverContent>
    </Popover>
    <p v-if="error && errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { cn } from "../utils";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  disable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:model-value"]);
const showPopup = ref<boolean>(false);

const calendarValue = computed({
  get: () => {
    if (!props.modelValue) return undefined;
    try {
      return new Date(props.modelValue);
    } catch {
      return undefined;
    }
  },
  set: (value) => {
    if (value) {
      onDateTimeSelect(value);
    }
  },
});

const displayValue = computed(() => {
  if (!props.modelValue) return "";

  try {
    const date = new Date(props.modelValue);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
});

const onDateTimeSelect = (value: Date | string) => {
  if (!value) {
    emit("update:model-value", "");
    showPopup.value = false;
    return;
  }

  try {
    const dateObj = value instanceof Date ? value : new Date(value);
    emit("update:model-value", dateObj.toISOString());
    showPopup.value = false;
  } catch (error) {
    console.error("DateTime conversion error:", error);
    emit("update:model-value", "");
  }
};
</script>
