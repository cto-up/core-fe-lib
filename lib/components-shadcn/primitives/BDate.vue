<template>
  <div class="flex flex-col gap-2">
    <Label v-if="label">{{ label }}</Label>
    <div class="flex gap-2">
      <MaskedDateInput
        v-model="innerValue"
        :disabled="disable"
        :class="
          cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1',
            error && 'border-red-500'
          )
        "
      />
      <Popover v-model:open="showPopup">
        <PopoverTrigger as-child>
          <Button
            type="button"
            variant="outline"
            size="icon"
            :disabled="disable"
            :class="cn(error && 'border-red-500')"
          >
            <Icon name="calendar" class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            v-model="calendarValue"
            :min-date="minDate ? new Date(minDate + 'T00:00:00') : undefined"
            :max-date="maxDate ? new Date(maxDate + 'T00:00:00') : undefined"
            @update:model-value="onDateSelect"
          />
        </PopoverContent>
      </Popover>
    </div>
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
import MaskedDateInput from "./MaskedDateInput.vue";

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
  format: {
    type: String,
    default: "YYYY-MM-DD",
    validator: (value: string) => ["YYYY-MM-DD", "ISO"].includes(value),
  },
  minDate: {
    type: String,
    default: undefined, // YYYY-MM-DD — dates before this are disabled in the calendar
  },
  maxDate: {
    type: String,
    default: undefined, // YYYY-MM-DD — dates after this are disabled in the calendar
  },
});

const emit = defineEmits(["update:model-value"]);
const showPopup = ref<boolean>(false);

const innerValue = computed({
  get: () => props.modelValue ?? "",
  set: (val) => {
    if (props.format === "ISO" && val) {
      emit("update:model-value", new Date(val + "T00:00:00").toISOString());
    } else {
      emit("update:model-value", val);
    }
  },
});

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
    if (value) onDateSelect(value);
  },
});

const onDateSelect = (value: Date | string) => {
  if (!value) {
    emit("update:model-value", "");
    showPopup.value = false;
    return;
  }
  try {
    const dateObj = value instanceof Date ? value : new Date(value);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    if (props.format === "ISO") {
      emit("update:model-value", new Date(dateStr + "T00:00:00").toISOString());
    } else {
      emit("update:model-value", dateStr);
    }
    showPopup.value = false;
  } catch (error) {
    console.error("Date conversion error:", error);
    emit("update:model-value", "");
  }
};
</script>
