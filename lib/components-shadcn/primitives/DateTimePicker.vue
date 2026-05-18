<template>
  <div class="space-y-2">
    <Label v-if="label">{{ label }}</Label>
    <div class="flex gap-2">
      <MaskedDateTimeInput
        v-model="innerValue"
        :disabled="disable"
        :class="
          cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1',
            error && 'border-destructive'
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
            :class="cn(error && 'border-destructive')"
          >
            <CalendarIcon class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            :model-value="dateOnly"
            initial-focus
            :min-date="minDateObj"
            :max-date="maxDateObj"
            @update:model-value="onDateSelect"
          />
          <!-- Time row -->
          <div class="flex items-center gap-2 border-t px-3 py-2">
            <Clock class="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              :value="timeOnly"
              type="time"
              class="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              @change="onTimeChange"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <p v-if="error && errorMessage" class="text-sm text-destructive">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CalendarIcon, Clock } from "lucide-vue-next";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { cn } from "../utils";
import MaskedDateTimeInput from "./MaskedDateTimeInput.vue";

interface Props {
  modelValue?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disable?: boolean;
  minDate?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:MM
  maxDate?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:MM
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const showPopup = ref(false);

function toDateOnly(val: string | undefined): Date | undefined {
  if (!val) return undefined;
  const datePart = val.split("T")[0];
  const d = new Date(datePart + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

const minDateObj = computed(() => toDateOnly(props.minDate));
const maxDateObj = computed(() => toDateOnly(props.maxDate));

// modelValue is YYYY-MM-DDTHH:MM
// Split into date and time parts for the picker
const dateOnly = computed<Date | undefined>(() => {
  if (!props.modelValue) return undefined;
  const datePart = props.modelValue.split("T")[0];
  if (!datePart) return undefined;
  const d = new Date(datePart + "T00:00:00");
  return isNaN(d.getTime()) ? undefined : d;
});

const timeOnly = computed<string>(() => {
  if (!props.modelValue) return "00:00";
  const timePart = props.modelValue.split("T")[1];
  return timePart ? timePart.slice(0, 5) : "00:00";
});

// Bridge for MaskedDateTimeInput (same YYYY-MM-DDTHH:MM format)
const innerValue = computed({
  get: () => props.modelValue ?? "",
  set: (val) => emit("update:modelValue", val),
});

function buildValue(datePart: string, timePart: string): string {
  return `${datePart}T${timePart}`;
}

function formatDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function onDateSelect(date: Date | undefined) {
  if (!date) return;
  emit("update:modelValue", buildValue(formatDatePart(date), timeOnly.value));
  // Keep popup open so user can also pick the time
}

function onTimeChange(e: Event) {
  const time = (e.target as HTMLInputElement).value;
  if (!time) return;
  const datePart =
    props.modelValue?.split("T")[0] ?? formatDatePart(new Date());
  emit("update:modelValue", buildValue(datePart, time));
  showPopup.value = false;
}
</script>
