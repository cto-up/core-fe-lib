<template>
  <div class="b-cron-input space-y-4">
    <Tabs v-model="mode" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="friendly">
          {{ t("common.cron.modeFriendly") }}
        </TabsTrigger>
        <TabsTrigger value="simple">
          {{ t("common.cron.modeSimple") }}
        </TabsTrigger>
        <TabsTrigger value="advanced">
          {{ t("common.cron.modeAdvanced") }}
        </TabsTrigger>
      </TabsList>

      <!-- Friendly mode — for commoners -->
      <TabsContent value="friendly" class="space-y-4 pt-2">
        <div v-if="label">
          <Label class="text-base">{{ label }}</Label>
        </div>

        <div v-if="!friendlyCompatible" class="rounded-md border border-dashed p-4 bg-muted/30 text-sm space-y-2">
          <p class="text-muted-foreground">
            {{ t("common.cron.customPatternHint") }}
          </p>
          <Button size="sm" variant="outline" @click="resetFriendly">
            {{ t("common.cron.resetFriendly") }}
          </Button>
        </div>

        <template v-else>
          <div class="space-y-1">
            <Label>{{ t("common.cron.frequency") }}</Label>
            <Select v-model="frequency">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">
                  {{ t("common.cron.freq.minutes") }}
                </SelectItem>
                <SelectItem value="hourly">
                  {{ t("common.cron.freq.hourly") }}
                </SelectItem>
                <SelectItem value="daily">
                  {{ t("common.cron.freq.daily") }}
                </SelectItem>
                <SelectItem value="weekly">
                  {{ t("common.cron.freq.weekly") }}
                </SelectItem>
                <SelectItem value="monthly">
                  {{ t("common.cron.freq.monthly") }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Every N minutes -->
          <div v-if="frequency === 'minutes'" class="space-y-1">
            <Label>{{ t("common.cron.everyNMinutes") }}</Label>
            <Input
              v-model.number="everyNMinutes"
              type="number"
              min="1"
              max="59"
              class="w-32"
            />
          </div>

          <!-- Hourly at minute M -->
          <div v-if="frequency === 'hourly'" class="space-y-1">
            <Label>{{ t("common.cron.atMinute") }}</Label>
            <Input
              v-model.number="minuteOfHour"
              type="number"
              min="0"
              max="59"
              class="w-32"
            />
          </div>

          <!-- Daily / Weekly / Monthly all need a time -->
          <div
            v-if="frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly'"
            class="space-y-1"
          >
            <Label>{{ t("common.cron.atTime") }}</Label>
            <Input v-model="timeStr" type="time" class="w-40" />
          </div>

          <!-- Weekly days -->
          <div v-if="frequency === 'weekly'" class="space-y-2">
            <Label>{{ t("common.cron.onDays") }}</Label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(name, i) in weekdayShort"
                :key="i"
                type="button"
                class="px-3 py-1.5 rounded-md border text-sm transition-colors"
                :class="
                  selectedWeekdays.includes(i)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                "
                @click="toggleWeekday(i)"
              >
                {{ name }}
              </button>
            </div>
          </div>

          <!-- Monthly day -->
          <div v-if="frequency === 'monthly'" class="space-y-1">
            <Label>{{ t("common.cron.dayOfMonth") }}</Label>
            <Input
              v-model.number="dayOfMonth"
              type="number"
              min="1"
              max="31"
              class="w-32"
            />
          </div>

          <!-- Natural-language preview -->
          <div class="flex items-center gap-2 bg-muted p-3 rounded-md">
            <CalendarClock class="h-5 w-5 text-primary flex-shrink-0" />
            <div class="min-w-0">
              <p class="font-medium text-sm">{{ friendlyPreview }}</p>
              <code class="text-xs text-muted-foreground">{{ cronExpression }}</code>
            </div>
          </div>
        </template>
      </TabsContent>

      <!-- Simple mode (raw expression) -->
      <TabsContent value="simple" class="space-y-2 pt-2">
        <Label v-if="label">{{ label }}</Label>
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
                    <li><code class="bg-muted px-1 rounded">*</code> - any value</li>
                    <li>
                      <code class="bg-muted px-1 rounded">,</code> - list separator (e.g.,
                      <code class="bg-muted px-1 rounded">1,3,5</code>)
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">-</code> - range (e.g.,
                      <code class="bg-muted px-1 rounded">1-5</code>)
                    </li>
                    <li>
                      <code class="bg-muted px-1 rounded">/</code> - step (e.g.,
                      <code class="bg-muted px-1 rounded">*/5</code>)
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 class="font-medium text-sm mb-2">Examples:</h5>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li><code class="bg-muted px-1 rounded">0 */15 * * * *</code> - Every 15 minutes</li>
                    <li><code class="bg-muted px-1 rounded">0 0 * * * *</code> - Every hour</li>
                    <li><code class="bg-muted px-1 rounded">0 0 8-17 * * 1-5</code> - Weekdays 8 AM–5 PM</li>
                    <li><code class="bg-muted px-1 rounded">0 0 12 1 * *</code> - 1st of month at noon</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </TabsContent>

      <!-- Advanced mode (per-field) -->
      <TabsContent value="advanced" class="pt-2">
        <div class="adv-grid gap-4">
          <div v-if="label" class="col-span-full">
            <h3 class="text-lg font-medium">{{ label }}</h3>
          </div>

          <div class="md:col-span-2 sm:col-span-4 col-span-6">
            <Label>Seconds</Label>
            <Input
              v-model="seconds"
              :class="{ 'border-destructive': !!secondsError }"
              @update:model-value="updateFromFields"
            />
            <p class="text-xs text-muted-foreground mt-1">0-59, *, /, -</p>
            <p v-if="secondsError" class="text-xs text-destructive mt-1">{{ secondsError }}</p>
          </div>

          <div class="md:col-span-2 sm:col-span-4 col-span-6">
            <Label>Minutes</Label>
            <Input
              v-model="minutes"
              :class="{ 'border-destructive': !!minutesError }"
              @update:model-value="updateFromFields"
            />
            <p class="text-xs text-muted-foreground mt-1">0-59, *, /, -</p>
            <p v-if="minutesError" class="text-xs text-destructive mt-1">{{ minutesError }}</p>
          </div>

          <div class="md:col-span-2 sm:col-span-4 col-span-6">
            <Label>Hours</Label>
            <Input
              v-model="hours"
              :class="{ 'border-destructive': !!hoursError }"
              @update:model-value="updateFromFields"
            />
            <p class="text-xs text-muted-foreground mt-1">0-23, *, /, -</p>
            <p v-if="hoursError" class="text-xs text-destructive mt-1">{{ hoursError }}</p>
          </div>

          <div class="md:col-span-2 sm:col-span-4 col-span-6">
            <Label>Day (1-31)</Label>
            <Input
              v-model="day"
              :class="{ 'border-destructive': !!dayError }"
              @update:model-value="updateFromFields"
            />
            <p class="text-xs text-muted-foreground mt-1">1-31, *, /, -</p>
            <p v-if="dayError" class="text-xs text-destructive mt-1">{{ dayError }}</p>
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
            <p v-if="monthError" class="text-xs text-destructive mt-1">{{ monthError }}</p>
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
            <p v-if="weekdayError" class="text-xs text-destructive mt-1">{{ weekdayError }}</p>
          </div>

          <div v-if="previewExpression" class="col-span-full">
            <div class="flex items-center gap-2 bg-muted p-3 rounded-md">
              <Code class="h-5 w-5 text-primary" />
              <span class="font-medium">Preview:</span>
              <code class="bg-background px-2 py-1 rounded">{{ previewExpression }}</code>
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
        </div>
      </TabsContent>
    </Tabs>
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
import { Badge } from "../ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { HelpCircle, Code, CalendarClock } from "lucide-vue-next";

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "0 0 8 * * *",
  },
  label: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

type Frequency = "minutes" | "hourly" | "daily" | "weekly" | "monthly";

const mode = ref<"friendly" | "simple" | "advanced">("friendly");
const cronExpression = ref(props.modelValue);

// Friendly mode state
const frequency = ref<Frequency>("daily");
const everyNMinutes = ref(5);
const minuteOfHour = ref(0);
const timeHour = ref(8);
const timeMinute = ref(0);
const selectedWeekdays = ref<number[]>([1]);
const dayOfMonth = ref(1);
const friendlyCompatible = ref(true);
let suppressFriendlyEmit = false;

// Advanced mode state
const seconds = ref("0");
const minutes = ref("0");
const hours = ref("8");
const day = ref("*");
const month = ref("*");
const weekday = ref("*");
const previewExpression = ref("");

// Helpers
const pad2 = (n: number) => n.toString().padStart(2, "0");
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayLong = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Time picker bound to a single HH:MM string for ergonomics — splits/joins
// timeHour and timeMinute so the underlying cron generation stays numeric.
const timeStr = computed({
  get: () => `${pad2(timeHour.value)}:${pad2(timeMinute.value)}`,
  set: (v: string) => {
    const m = v.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) return;
    timeHour.value = Math.max(0, Math.min(23, parseInt(m[1], 10)));
    timeMinute.value = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  },
});

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

// Allow letters too — robfig/cron (Go) and most cron libraries accept day
// names (SUN/MON/…/SAT) and month names (JAN/…/DEC) in addition to numbers.
const cronRegex = /^[\dA-Za-z*/,-]+(?:\s+[\dA-Za-z*/,-]+){5}$/;
const isCronValid = helpers.regex(cronRegex);

const rules = computed(() => ({
  cronExpression: { required, isCronValid },
}));

const v$ = useVuelidate(rules, { cronExpression });

function validateCronPart(
  value: string,
  min: number,
  max: number,
  fieldName: string,
): string {
  if (value === "*") return "";
  if (value.includes(",") || value.includes("-") || value.includes("/")) {
    try {
      const parts = value.split(",");
      for (const part of parts) {
        if (part.includes("-")) {
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
          const num = Number(part);
          if (isNaN(num) || num < min || num > max) {
            return `Must be between ${min} and ${max}`;
          }
        }
      }
      return "";
    } catch {
      return `Invalid format for ${fieldName}`;
    }
  }
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) {
    return `Must be between ${min} and ${max}`;
  }
  return "";
}

const secondsError = computed(() =>
  validateCronPart(seconds.value, 0, 59, "seconds"),
);
const minutesError = computed(() =>
  validateCronPart(minutes.value, 0, 59, "minutes"),
);
const hoursError = computed(() =>
  validateCronPart(hours.value, 0, 23, "hours"),
);
const dayError = computed(() => validateCronPart(day.value, 1, 31, "day"));
const monthError = computed(() =>
  validateCronPart(month.value, 1, 12, "month"),
);
const weekdayError = computed(() =>
  validateCronPart(weekday.value, 0, 6, "weekday"),
);

const errorMessage = computed(() => {
  v$.value.$validate();
  if (v$.value.cronExpression.$error) {
    return "Invalid cron expression. Format: * * * * * * (second minute hour day month weekday)";
  }
  return "";
});

// Build a 6-field cron from the current friendly state.
function buildFriendlyCron(): string {
  switch (frequency.value) {
    case "minutes": {
      const n = Math.max(1, Math.min(59, everyNMinutes.value || 1));
      return n === 1 ? "0 * * * * *" : `0 */${n} * * * *`;
    }
    case "hourly":
      return `0 ${minuteOfHour.value} * * * *`;
    case "daily":
      return `0 ${timeMinute.value} ${timeHour.value} * * *`;
    case "weekly": {
      const days = selectedWeekdays.value.length
        ? [...selectedWeekdays.value].sort((a, b) => a - b).join(",")
        : "*";
      return `0 ${timeMinute.value} ${timeHour.value} * * ${days}`;
    }
    case "monthly":
      return `0 ${timeMinute.value} ${timeHour.value} ${dayOfMonth.value} * *`;
  }
}

// Reverse: try to interpret a cron expression as one of the friendly templates.
// Returns true and updates the friendly state on success; false if the
// expression doesn't fit any preset (in which case Friendly mode renders a
// "custom pattern" banner instead of a possibly-wrong rendering).
function tryParseToFriendly(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 6) return false;
  const [sec, min, hour, dom, mon, dow] = parts;
  if (sec !== "0") return false;

  // Every minute / every N minutes
  if (hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    if (min === "*") {
      frequency.value = "minutes";
      everyNMinutes.value = 1;
      return true;
    }
    const stepMatch = min.match(/^\*\/(\d+)$/);
    if (stepMatch) {
      frequency.value = "minutes";
      everyNMinutes.value = parseInt(stepMatch[1], 10);
      return true;
    }
    if (/^\d+$/.test(min)) {
      frequency.value = "hourly";
      minuteOfHour.value = parseInt(min, 10);
      return true;
    }
    return false;
  }

  const minNum = /^\d+$/.test(min) ? parseInt(min, 10) : null;
  const hourNum = /^\d+$/.test(hour) ? parseInt(hour, 10) : null;
  if (minNum === null || hourNum === null) return false;

  // Daily
  if (dom === "*" && mon === "*" && dow === "*") {
    frequency.value = "daily";
    timeMinute.value = minNum;
    timeHour.value = hourNum;
    return true;
  }

  // Weekly (comma list — accepts both digits and day names: "1,3" or "MON,WED")
  if (dom === "*" && mon === "*" && /^[A-Za-z\d,]+$/.test(dow)) {
    const days = dow
      .split(",")
      .map((d) => dowTokenToNum(d.trim()))
      .filter((d): d is number => d !== null);
    if (days.length === dow.split(",").length && days.length > 0) {
      frequency.value = "weekly";
      timeMinute.value = minNum;
      timeHour.value = hourNum;
      selectedWeekdays.value = Array.from(new Set(days));
      return true;
    }
  }

  // Weekly (range — accepts "1-5" or "MON-FRI")
  if (dom === "*" && mon === "*" && /^[A-Za-z\d]+-[A-Za-z\d]+$/.test(dow)) {
    const [a, b] = dow.split("-");
    const s = dowTokenToNum(a);
    const e = dowTokenToNum(b);
    if (s !== null && e !== null && s <= e) {
      frequency.value = "weekly";
      timeMinute.value = minNum;
      timeHour.value = hourNum;
      const out: number[] = [];
      for (let i = s; i <= e; i++) out.push(i);
      selectedWeekdays.value = out;
      return true;
    }
  }

  // Monthly
  if (/^\d+$/.test(dom) && mon === "*" && dow === "*") {
    frequency.value = "monthly";
    timeMinute.value = minNum;
    timeHour.value = hourNum;
    dayOfMonth.value = parseInt(dom, 10);
    return true;
  }

  return false;
}

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

function dowTokenToNum(tok: string): number | null {
  if (/^\d+$/.test(tok)) {
    const n = parseInt(tok, 10);
    return n >= 0 && n <= 6 ? n : null;
  }
  const upper = tok.toUpperCase();
  return upper in DOW_NAMES ? DOW_NAMES[upper] : null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const friendlyPreview = computed(() => {
  const time = `${pad2(timeHour.value)}:${pad2(timeMinute.value)}`;
  switch (frequency.value) {
    case "minutes":
      return everyNMinutes.value <= 1
        ? "Runs every minute"
        : `Runs every ${everyNMinutes.value} minutes`;
    case "hourly":
      return `Runs every hour at :${pad2(minuteOfHour.value)}`;
    case "daily":
      return `Runs every day at ${time}`;
    case "weekly": {
      if (!selectedWeekdays.value.length) return "No day selected";
      const sorted = [...selectedWeekdays.value].sort((a, b) => a - b);
      const names = sorted.map((d) => weekdayLong[d]).join(", ");
      return `Runs every ${names} at ${time}`;
    }
    case "monthly":
      return `Runs on the ${ordinal(dayOfMonth.value)} of every month at ${time}`;
  }
  return "";
});

function toggleWeekday(i: number) {
  const idx = selectedWeekdays.value.indexOf(i);
  if (idx >= 0) selectedWeekdays.value.splice(idx, 1);
  else selectedWeekdays.value.push(i);
}

function resetFriendly() {
  frequency.value = "daily";
  timeHour.value = 8;
  timeMinute.value = 0;
  selectedWeekdays.value = [1];
  dayOfMonth.value = 1;
  everyNMinutes.value = 5;
  minuteOfHour.value = 0;
  friendlyCompatible.value = true;
  emitCron(buildFriendlyCron());
}

function updateCron(value: string) {
  emitCron(value);
  syncFromExpression(value);
}

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
    emitCron(newExpression);
    cronExpression.value = newExpression;
  }
}

function parseCronToFields(cron: string) {
  const parts = cron.split(/\s+/);
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

function syncFromExpression(expr: string) {
  parseCronToFields(expr);
  suppressFriendlyEmit = true;
  friendlyCompatible.value = tryParseToFriendly(expr);
  suppressFriendlyEmit = false;
}

function insertValue(field: string, value: string) {
  if (field === "month") month.value = value;
  if (field === "weekday") weekday.value = value;
  updateFromFields();
}

function applyPattern(pattern: string) {
  cronExpression.value = pattern;
  syncFromExpression(pattern);
  emitCron(pattern);
}

function emitCron(value: string) {
  emit("update:modelValue", value);
}

// When the user edits friendly fields, regenerate cron and emit.
watch(
  [
    frequency,
    everyNMinutes,
    minuteOfHour,
    timeHour,
    timeMinute,
    selectedWeekdays,
    dayOfMonth,
  ],
  () => {
    if (mode.value !== "friendly") return;
    if (suppressFriendlyEmit) return;
    if (!friendlyCompatible.value) return;
    const expr = buildFriendlyCron();
    if (expr !== cronExpression.value) {
      cronExpression.value = expr;
      parseCronToFields(expr);
      emitCron(expr);
    }
  },
  { deep: true },
);

// React to external model updates by re-syncing all three modes.
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === cronExpression.value) return;
    cronExpression.value = newValue;
    syncFromExpression(newValue);
  },
);

onMounted(() => {
  syncFromExpression(props.modelValue);
  if (!friendlyCompatible.value) {
    // Initial value is a custom pattern — default to Simple so the user
    // sees their expression verbatim rather than the "custom" banner.
    mode.value = "simple";
  }
});
</script>

<style scoped>
.b-cron-input {
  width: 100%;
}

.adv-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .adv-grid .md\:col-span-2 {
    grid-column: span 6 / span 6;
  }
}

@media (max-width: 640px) {
  .adv-grid .sm\:col-span-4 {
    grid-column: span 6 / span 6;
  }
}

.adv-grid .col-span-6 {
  grid-column: span 6 / span 6;
}

.adv-grid .col-span-full {
  grid-column: 1 / -1;
}
</style>
