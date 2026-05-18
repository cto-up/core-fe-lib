<template>
  <div class="space-y-2" :style="{ maxWidth: maxWidth }">
    <Label v-if="label">{{ label }}</Label>

    <div class="flex gap-2">
      <!-- Date Picker -->
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            :class="
              cn(
                'justify-start text-left font-normal',
                !fromDateTime && 'text-muted-foreground',
                error && 'border-destructive'
              )
            "
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ displayDate || "Pick a date" }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            :model-value="dateValue"
            initial-focus
            @update:model-value="onDateChange"
          />
        </PopoverContent>
      </Popover>

      <!-- Time Picker -->
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            :class="
              cn(
                'w-[120px] justify-start text-left font-normal',
                !fromDateTime && 'text-muted-foreground'
              )
            "
          >
            <Clock class="mr-2 h-4 w-4" />
            {{ displayTime || "08:00" }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-4">
          <div class="space-y-2">
            <Label>Time</Label>
            <div class="grid grid-cols-2 gap-2">
              <Select v-model="hours" @update:model-value="onTimeChange">
                <SelectTrigger>
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="h in 24"
                    :key="h - 1"
                    :value="String(h - 1).padStart(2, '0')"
                  >
                    {{ String(h - 1).padStart(2, "0") }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select v-model="minutes" @update:model-value="onTimeChange">
                <SelectTrigger>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="m in minuteOptions" :key="m" :value="m">
                    {{ m }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- Duration Selector -->
      <Select v-model="selectedDuration" @update:model-value="onDurationChange">
        <SelectTrigger class="w-[140px]">
          <SelectValue :placeholder="durationLabel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="opt in durationOptions"
            :key="opt.value"
            :value="String(opt.value)"
          >
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <p v-if="error && errorMessage" class="text-sm text-destructive">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Button } from "../button";
import { Label } from "../label";
import { Calendar } from "../calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";
import { Calendar as CalendarIcon, Clock } from "lucide-vue-next";
import { cn } from "../../utils";
import { useI18n } from "vue-i18n";

interface Props {
  fromDate: string;
  toDate: string;
  error?: boolean;
  label?: string;
  durationLabel?: string;
  errorMessage?: string;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: "100%",
});

const emit = defineEmits<{
  "update:fromDate": [value: string];
  "update:toDate": [value: string];
}>();

const { t } = useI18n();

const fromDateTime = ref("");
const hours = ref("08");
const minutes = ref("00");
const selectedDuration = ref("60");

const minuteOptions = ["00", "15", "30", "45"];

const durationOptions = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
  { label: "4h", value: 240 },
];

const dateValue = computed(() => {
  if (!fromDateTime.value) return undefined;
  try {
    return new Date(fromDateTime.value);
  } catch {
    return undefined;
  }
});

const displayDate = computed(() => {
  if (!fromDateTime.value) return "";
  try {
    const date = new Date(fromDateTime.value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
});

const displayTime = computed(() => {
  return `${hours.value}:${minutes.value}`;
});

const parseDateTime = (isoString: string) => {
  if (!isoString) return;

  try {
    const date = new Date(isoString);
    hours.value = String(date.getHours()).padStart(2, "0");
    minutes.value = String(date.getMinutes()).padStart(2, "0");
    fromDateTime.value = isoString;
  } catch (error) {
    console.error("Error parsing date:", error);
  }
};

const calculateToDate = () => {
  if (!fromDateTime.value) return;

  try {
    const from = new Date(fromDateTime.value);
    const duration = parseInt(selectedDuration.value);
    const to = new Date(from.getTime() + duration * 60000);
    emit("update:toDate", to.toISOString());
  } catch (error) {
    console.error("Error calculating to date:", error);
  }
};

const onDateChange = (date: Date | undefined) => {
  if (!date) return;

  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateTimeString = `${year}-${month}-${day}T${hours.value}:${minutes.value}:00`;
    const dateObj = new Date(dateTimeString);

    fromDateTime.value = dateObj.toISOString();
    emit("update:fromDate", dateObj.toISOString());
    calculateToDate();
  } catch (error) {
    console.error("Error updating date:", error);
  }
};

const onTimeChange = () => {
  if (!fromDateTime.value) {
    // If no date set, use today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const dateTimeString = `${year}-${month}-${day}T${hours.value}:${minutes.value}:00`;
    const dateObj = new Date(dateTimeString);

    fromDateTime.value = dateObj.toISOString();
    emit("update:fromDate", dateObj.toISOString());
  } else {
    const date = new Date(fromDateTime.value);
    date.setHours(parseInt(hours.value));
    date.setMinutes(parseInt(minutes.value));

    fromDateTime.value = date.toISOString();
    emit("update:fromDate", date.toISOString());
  }

  calculateToDate();
};

const onDurationChange = () => {
  calculateToDate();
};

// Calculate initial duration from props
const calculateInitialDuration = () => {
  if (!props.fromDate || !props.toDate) return;

  try {
    const from = new Date(props.fromDate);
    const to = new Date(props.toDate);
    const diffMinutes = Math.round((to.getTime() - from.getTime()) / 60000);

    const matchingOption = durationOptions.find(
      (opt) => opt.value === diffMinutes
    );
    if (matchingOption) {
      selectedDuration.value = String(matchingOption.value);
    }
  } catch (error) {
    console.error("Error calculating duration:", error);
  }
};

watch(
  () => props.fromDate,
  (newValue) => {
    if (newValue && newValue !== fromDateTime.value) {
      parseDateTime(newValue);
    }
  },
  { immediate: true }
);

watch(
  () => props.toDate,
  () => {
    calculateInitialDuration();
  },
  { immediate: true }
);
</script>
