<template>
  <div class="space-y-2">
    <Label v-if="label">{{ label }}</Label>
    <div class="flex gap-2">
      <MaskedDateInput
        v-model="innerValue"
        :disabled="disable"
        :class="
          cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1',
            error && 'border-error'
          )
        "
      />
      <Popover>
        <PopoverTrigger as-child>
          <Button
            type="button"
            variant="outline"
            size="icon"
            :disabled="disable"
            :class="cn(error && 'border-error')"
          >
            <CalendarIcon class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            :model-value="dateValue"
            initial-focus
            :min-date="minDate ? new Date(minDate + 'T00:00:00') : undefined"
            :max-date="maxDate ? new Date(maxDate + 'T00:00:00') : undefined"
            @update:model-value="onDateSelect"
          />
        </PopoverContent>
      </Popover>
    </div>
    <p v-if="error && errorMessage" class="text-sm text-error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { Label } from "../label";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cn } from "../../utils";
import MaskedDateInput from "../../primitives/MaskedDateInput.vue";

interface Props {
  modelValue?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disable?: boolean;
  format?: "YYYY-MM-DD" | "ISO";
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD — dates before this are disabled in the calendar
  maxDate?: string; // YYYY-MM-DD — dates after this are disabled in the calendar
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  label: undefined,
  error: false,
  errorMessage: undefined,
  disable: false,
  format: "YYYY-MM-DD",
  placeholder: "Pick a date",
  minDate: undefined,
  maxDate: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// Two-way bridge between modelValue (YYYY-MM-DD) and MaskedDateInput
const innerValue = computed({
  get: () => props.modelValue ?? "",
  set: (val) => {
    if (props.format === "ISO" && val) {
      emit("update:modelValue", new Date(val + "T00:00:00").toISOString());
    } else {
      emit("update:modelValue", val);
    }
  },
});

const dateValue = computed(() => {
  if (!props.modelValue) return undefined;
  try {
    return new Date(props.modelValue);
  } catch {
    return undefined;
  }
});

const onDateSelect = (date: unknown) => {
  // Calendar component may pass DatePickerModel or Date
  let dateObj: Date | undefined;
  if (date instanceof Date) {
    dateObj = date;
  } else if (date && typeof date === "object" && "getTime" in date) {
    dateObj = new Date(date as Date);
  } else {
    dateObj = undefined;
  }

  if (!dateObj) {
    emit("update:modelValue", "");
    return;
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  if (props.format === "ISO") {
    emit("update:modelValue", new Date(dateStr + "T00:00:00").toISOString());
  } else {
    emit("update:modelValue", dateStr);
  }
};
</script>
