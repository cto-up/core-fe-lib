<template>
  <div class="row" :style="{ minWidth: '300px', maxWidth: maxWidth }">
    <q-input
      class="date-time-input"
      :label="label"
      :error="error"
      :error-message="errorMessage"
      filled
      v-bind:model-value="internalFromDateTime"
      @update:model-value="onFromDateTimeChange($event)"
    >
      <template v-slot:prepend>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="internalFromDateTime"
              mask="YYYY-MM-DD HH:mm"
              @update:model-value="onFromDateTimeChange($event)"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat></q-btn>
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>

      <template v-slot:append>
        <q-icon name="access_time" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time
              v-model="internalFromDateTime"
              mask="YYYY-MM-DD HH:mm"
              format24h
              :minute-options="[0, 15, 30, 45]"
              @update:model-value="onFromDateTimeChange($event)"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat></q-btn>
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
        <!-- Duration Dropdown -->
        <q-select
          :label="$t('entities.common.duration')"
          v-model="selectedDuration"
          :options="durationOptions"
          dense
          filled
          map-options
          emit-value
          @update:model-value="onDurationChange($event)"
        ></q-select>
      </template>
    </q-input>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import useDate from "../composables/useDate";

const {
  ISOStringToDateTimeString,
  datetimeStringToISO,
  addMinutesToDate,
  calculateDurationInMinutes,
} = useDate();

const props = defineProps({
  fromDate: {
    type: String,
    default: "",
    required: true,
  },
  toDate: {
    type: String,
    default: "",
    required: true,
  },
  error: {
    type: Boolean,
  },
  label: {
    type: String,
    default: "Date Time",
  },
  durationLabel: {
    type: String,
    default: "Duration",
  },
  errorMessage: {
    type: String,
  },
  maxWidth: {
    type: String,
    default: "320px",
  },
});

const emit = defineEmits(["update:fromDate", "update:toDate"]);

const internalFromDateTime = ref(ISOStringToDateTimeString(props.fromDate));
const internalToDateTime = ref(ISOStringToDateTimeString(props.toDate));
const selectedDuration = ref(
  updateDuration(internalFromDateTime.value, internalToDateTime.value)
); // Default duration

const durationOptions = [
  { label: "30 min", value: 30 },
  { label: "1h", value: 60 },
  { label: "1h 30 min", value: 90 },
];

// Sync `fromDate` prop with internal value
watch(
  () => props.fromDate,
  (newValue) => {
    const newFrom = ISOStringToDateTimeString(newValue);
    if (newFrom !== internalFromDateTime.value) {
      internalFromDateTime.value = newFrom;
      selectedDuration.value = updateDuration(
        newFrom,
        internalToDateTime.value
      );
    }
  }
);

// Sync `toDate` prop with internal value and compute duration
watch(
  () => props.toDate,
  (newValue) => {
    const newTo = ISOStringToDateTimeString(newValue);
    if (newTo !== internalToDateTime.value) {
      internalToDateTime.value = newTo;
      selectedDuration.value = updateDuration(
        internalFromDateTime.value,
        newTo
      );
    }
  }
);

// Update `toDate` when `fromDate` changes
const onFromDateTimeChange = (newFromDateTime: string) => {
  if (!newFromDateTime) return;
  const newFromNormDate = normalizeDateTime(newFromDateTime);
  const newFromDateISO = datetimeStringToISO(newFromNormDate);
  emit("update:fromDate", newFromDateISO);
  updateToDate(
    new Date(ISOStringToDateTimeString(newFromDateISO)),
    selectedDuration.value
  );
};

// Update `toDate` when `duration` changes
const onDurationChange = (newDuration: string) => {
  selectedDuration.value = parseInt(newDuration);
  if (!internalFromDateTime.value) return;
  const newFromNormDate = normalizeDateTime(internalFromDateTime.value);
  const newFromDateISO = datetimeStringToISO(newFromNormDate);
  updateToDate(
    new Date(ISOStringToDateTimeString(newFromDateISO)),
    parseInt(newDuration)
  );
};

function normalizeDateTime(dateString: string): string {
  // Get the current date as YYYY-MM-DD
  const currentDate = new Date().toISOString().split("T")[0];

  // Regex patterns to detect formats
  const isDateFormat = /^\d{4}-\d{2}-\d{2}$/; // Format: YYYY-MM-DD
  const isTimeFormat = /^\d{2}:\d{2}$/; // Format: HH:mm

  if (isDateFormat.test(dateString)) {
    // If it's in the format YYYY-MM-DD, add the default time "08:00"
    return `${dateString} 08:00`;
  } else if (isTimeFormat.test(dateString)) {
    // If it's in the format HH:mm, add the current date as a prefix
    return `${currentDate} ${dateString}`;
  }

  // Return the input unchanged if it doesn't match either format
  return dateString;
}

function updateToDate(fromDate: Date, duration: number): Date {
  const newToDate = addMinutesToDate(fromDate, duration);
  emit("update:toDate", newToDate.toISOString());
  return newToDate;
}

/**
 * Updates the duration based on the difference between fromDate and toDate.
 * If either date is missing, it defaults to 30 minutes.
 */
function updateDuration(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) {
    return 30;
  }

  const duration = calculateDurationInMinutes(fromDate, toDate);
  console.log("duration", duration);
  return duration;
}
</script>

<style scoped>
.date-time-input {
  width: 500px;
}
</style>
