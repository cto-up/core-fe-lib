<template>
  <div class="b-cron-input">
    <div class="grid gap-4">
      <!-- Toggle between input methods -->
      <div class="flex items-center space-x-2">
        <Switch
          id="mode-toggle"
          :checked="advancedMode"
          @update:checked="advancedMode = $event"
        />
        <Label for="mode-toggle">
          {{ advancedMode ? "Advanced Mode" : "Simple Mode" }}
        </Label>
      </div>

      <!-- Text input mode -->
      <div v-if="!advancedMode" class="space-y-2">
        <Label>{{ label }}</Label>
        <div class="relative">
          <Input
            v-model="cronExpression"
            :class="{ 'border-destructive': !!errorMessage }"
            @update:model-value="updateCron"
          />
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                :title="t('common.cron.syntaxHelp')"
              >
                <HelpCircle class="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-96">
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">Cron Syntax Help</h4>
                  <p class="text-sm text-muted-foreground">
                    Format:
                    <code class="bg-muted px-1 rounded">* * * * * *</code>
                    (second minute hour day month weekday)
                  </p>
                </div>

                <div>
                  <h5 class="font-medium text-sm mb-2">Special Characters:</h5>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <code class="bg-muted px-1 rounded">*</code> - any value
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">,</code> - value list
                      separator (e.g.,
                      <code class="bg-muted px-1 rounded">1,3,5</code>)
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">-</code> - range of
                      values (e.g.,
                      <code class="bg-muted px-1 rounded">1-5</code>)
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">/</code> - step values
                      (e.g., <code class="bg-muted px-1 rounded">*/5</code>)
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 class="font-medium text-sm mb-2">Examples:</h5>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <code class="bg-muted px-1 rounded">0 */15 * * * *</code>
                      - Every 15 minutes
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">0 0 * * * *</code> -
                      Every hour
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded"
                        >0 0 8-17 * * 1-5</code
                      >
                      - Weekdays between 8 AM and 5 PM
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">0 0,30 * * * *</code>
                      - Every hour and half-hour
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">0 0 12 1 * *</code> -
                      First day of each month at noon
                    </li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p v-if="errorMessage" class="text-sm text-destructive">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Advanced input mode with individual fields -->
      <template v-else>
        <div class="col-span-full">
          <h3 class="text-lg font-medium">
            {{ label }}
          </h3>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Seconds</Label>
          <Input
            v-model="seconds"
            :class="{ 'border-destructive': !!secondsError }"
            @update:model-value="updateFromFields"
          />
          <p class="text-xs text-muted-foreground mt-1">0-59, *, /, -</p>
          <p v-if="secondsError" class="text-xs text-destructive mt-1">
            {{ secondsError }}
          </p>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Minutes</Label>
          <Input
            v-model="minutes"
            :class="{ 'border-destructive': !!minutesError }"
            @update:model-value="updateFromFields"
          />
          <p class="text-xs text-muted-foreground mt-1">0-59, *, /, -</p>
          <p v-if="minutesError" class="text-xs text-destructive mt-1">
            {{ minutesError }}
          </p>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Hours</Label>
          <Input
            v-model="hours"
            :class="{ 'border-destructive': !!hoursError }"
            @update:model-value="updateFromFields"
          />
          <p class="text-xs text-muted-foreground mt-1">0-23, *, /, -</p>
          <p v-if="hoursError" class="text-xs text-destructive mt-1">
            {{ hoursError }}
          </p>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Day (1-31)</Label>
          <Input
            v-model="day"
            :class="{ 'border-destructive': !!dayError }"
            @update:model-value="updateFromFields"
          />
          <p class="text-xs text-muted-foreground mt-1">1-31, *, /, -</p>
          <p v-if="dayError" class="text-xs text-destructive mt-1">
            {{ dayError }}
          </p>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Month</Label>
          <div class="relative">
            <Input
              v-model="month"
              :class="{ 'border-destructive': !!monthError }"
              @update:model-value="updateFromFields"
            />
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  :title="t('common.cron.monthValues')"
                >
                  <HelpCircle class="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-72">
                <div class="space-y-2">
                  <h5 class="font-medium text-sm">Month Values:</h5>
                  <div class="grid grid-cols-2 gap-2">
                    <Badge
                      v-for="(opt, i) in monthOptions"
                      :key="i"
                      variant="outline"
                      class="cursor-pointer justify-center"
                      @click="insertValue('month', opt.value)"
                    >
                      {{ opt.label }}
                    </Badge>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p class="text-xs text-muted-foreground mt-1">1-12, *, /, -</p>
          <p v-if="monthError" class="text-xs text-destructive mt-1">
            {{ monthError }}
          </p>
        </div>

        <div class="md:col-span-2 sm:col-span-4 col-span-6">
          <Label>Weekday</Label>
          <div class="relative">
            <Input
              v-model="weekday"
              :class="{ 'border-destructive': !!weekdayError }"
              @update:model-value="updateFromFields"
            />
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  :title="t('common.cron.weekdayValues')"
                >
                  <HelpCircle class="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-72">
                <div class="space-y-2">
                  <h5 class="font-medium text-sm">Weekday Values:</h5>
                  <div class="grid grid-cols-2 gap-2">
                    <Badge
                      v-for="(opt, i) in weekdayOptions"
                      :key="i"
                      variant="outline"
                      class="cursor-pointer justify-center"
                      @click="insertValue('weekday', opt.value)"
                    >
                      {{ opt.label }}
                    </Badge>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p class="text-xs text-muted-foreground mt-1">0-6, *, /, -</p>
          <p v-if="weekdayError" class="text-xs text-destructive mt-1">
            {{ weekdayError }}
          </p>
        </div>

        <div v-if="previewExpression" class="col-span-full">
          <div class="flex items-center gap-2 bg-muted p-3 rounded-md">
            <Code class="h-5 w-5 text-primary" />
            <span class="font-medium">Preview: </span>
            <code class="bg-background px-2 py-1 rounded">{{
              previewExpression
            }}</code>
          </div>
        </div>

        <div class="col-span-full mt-4">
          <h5 class="font-medium text-sm mb-2">Common Patterns:</h5>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="(pattern, i) in commonPatterns"
              :key="i"
              variant="secondary"
              class="cursor-pointer"
              @click="applyPattern(pattern.value)"
            >
              {{ pattern.label }}
            </Badge>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useVuelidate } from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { HelpCircle, Code } from "lucide-vue-next";

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "* * * * * *",
  },
  label: {
    type: String,
    default: "Cron Schedule",
  },
});

const emit = defineEmits(["update:modelValue"]);

// UI state
const advancedMode = ref(false);
const cronExpression = ref(props.modelValue);
const seconds = ref("*");
const minutes = ref("*");
const hours = ref("*");
const day = ref("*");
const month = ref("*");
const weekday = ref("*");
const previewExpression = ref("");

// Options for dropdowns
const monthOptions = [
  { label: "Any (*)", value: "*" },
  { label: "January (1)", value: "1" },
  { label: "February (2)", value: "2" },
  { label: "March (3)", value: "3" },
  { label: "April (4)", value: "4" },
  { label: "May (5)", value: "5" },
  { label: "June (6)", value: "6" },
  { label: "July (7)", value: "7" },
  { label: "August (8)", value: "8" },
  { label: "September (9)", value: "9" },
  { label: "October (10)", value: "10" },
  { label: "November (11)", value: "11" },
  { label: "December (12)", value: "12" },
];

const weekdayOptions = [
  { label: "Any (*)", value: "*" },
  { label: "Sunday (0)", value: "0" },
  { label: "Monday (1)", value: "1" },
  { label: "Tuesday (2)", value: "2" },
  { label: "Wednesday (3)", value: "3" },
  { label: "Thursday (4)", value: "4" },
  { label: "Friday (5)", value: "5" },
  { label: "Saturday (6)", value: "6" },
];

const commonPatterns = [
  { label: "Every minute", value: "0 * * * * *" },
  { label: "Every 5 minutes", value: "0 */5 * * * *" },
  { label: "Every hour", value: "0 0 * * * *" },
  { label: "Every day at midnight", value: "0 0 0 * * *" },
  { label: "Every day at 8 AM", value: "0 0 8 * * *" },
  { label: "Weekdays at 8 AM", value: "0 0 8 * * 1-5" },
  { label: "Weekends at 9 AM", value: "0 0 9 * * 0,6" },
  { label: "First day of month", value: "0 0 0 1 * *" },
];

// More permissive regex for cron validation
const cronRegex =
  /^[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+$/;
const isCronValid = helpers.regex(cronRegex);

const rules = computed(() => {
  return {
    cronExpression: { required, isCronValid },
  };
});

const v$ = useVuelidate(rules, { cronExpression });

// Field-specific validation with support for complex expressions
function validateCronPart(
  value: string,
  min: number,
  max: number,
  fieldName: string
): string {
  if (value === "*") return "";

  // Check for complex expressions
  if (value.includes(",") || value.includes("-") || value.includes("/")) {
    try {
      // Basic validation for complex expressions
      const parts = value.split(",");
      for (const part of parts) {
        if (part.includes("-")) {
          // Range validation
          const [start, end] = part.split("-").map(Number);
          if (
            isNaN(start) ||
            isNaN(end) ||
            start < min ||
            end > max ||
            start > end
          ) {
            return `Invalid range for ${fieldName}`;
          }
        } else if (part.includes("/")) {
          // Step validation
          const [base, step] = part.split("/");
          const stepNum = Number(step);
          if (isNaN(stepNum) || stepNum <= 0) {
            return `Invalid step value for ${fieldName}`;
          }

          if (base !== "*") {
            const baseNum = Number(base);
            if (isNaN(baseNum) || baseNum < min || baseNum > max) {
              return `Invalid base value for ${fieldName}`;
            }
          }
        } else if (part !== "*") {
          // Simple number validation
          const num = Number(part);
          if (isNaN(num) || num < min || num > max) {
            return `Must be between ${min} and ${max}`;
          }
        }
      }
      return "";
    } catch (e) {
      return `Invalid format for ${fieldName}`;
    }
  }

  // Simple number validation
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) {
    return `Must be between ${min} and ${max}`;
  }
  return "";
}

// Field-specific validation
const secondsError = computed(() =>
  validateCronPart(seconds.value, 0, 59, "seconds")
);
const minutesError = computed(() =>
  validateCronPart(minutes.value, 0, 59, "minutes")
);
const hoursError = computed(() =>
  validateCronPart(hours.value, 0, 23, "hours")
);
const dayError = computed(() => validateCronPart(day.value, 1, 31, "day"));
const monthError = computed(() =>
  validateCronPart(month.value, 1, 12, "month")
);
const weekdayError = computed(() =>
  validateCronPart(weekday.value, 0, 6, "weekday")
);

// Overall validation error
const errorMessage = computed(() => {
  v$.value.$validate();
  if (v$.value.cronExpression.$error) {
    return "Invalid cron expression. Format: * * * * * * (second minute hour day month weekday)";
  }
  return "";
});

// Update the model when cron expression changes
function updateCron(value: string) {
  emit("update:modelValue", value);
  parseCronToFields(value);
}

// Update from individual fields
function updateFromFields() {
  if (
    !secondsError.value &&
    !minutesError.value &&
    !hoursError.value &&
    !dayError.value &&
    !monthError.value &&
    !weekdayError.value
  ) {
    const newExpression = `${seconds.value} ${minutes.value} ${hours.value} ${day.value} ${month.value} ${weekday.value}`;
    previewExpression.value = newExpression;
    emit("update:modelValue", newExpression);
    cronExpression.value = newExpression;
  }
}

// Parse cron expression to individual fields
function parseCronToFields(cron: string) {
  const parts = cron.split(" ");
  if (parts.length === 6) {
    seconds.value = parts[0];
    minutes.value = parts[1];
    hours.value = parts[2];
    day.value = parts[3];
    month.value = parts[4];
    weekday.value = parts[5];
    previewExpression.value = cron;
  }
}

// Insert a value into a field
function insertValue(field: string, value: string) {
  switch (field) {
    case "month":
      month.value = value;
      break;
    case "weekday":
      weekday.value = value;
      break;
  }
  updateFromFields();
}

// Apply a common pattern
function applyPattern(pattern: string) {
  cronExpression.value = pattern;
  parseCronToFields(pattern);
  emit("update:modelValue", pattern);
}

// Watch for external changes to model value
watch(
  () => props.modelValue,
  (newValue) => {
    cronExpression.value = newValue;
    parseCronToFields(newValue);
  }
);

// Initialize component
onMounted(() => {
  parseCronToFields(props.modelValue);
});
</script>

<style scoped>
.b-cron-input {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .md\:col-span-2 {
    grid-column: span 6 / span 6;
  }
}

@media (max-width: 640px) {
  .sm\:col-span-4 {
    grid-column: span 6 / span 6;
  }
}

.col-span-6 {
  grid-column: span 6 / span 6;
}

.col-span-full {
  grid-column: 1 / -1;
}
</style>
