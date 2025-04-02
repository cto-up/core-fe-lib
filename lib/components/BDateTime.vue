<template>
  <q-input
    :label="label"
    :error="error"
    :error-message="errorMessage"
    filled
    v-model="internalDate"
  >
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="internalDate" mask="YYYY-MM-DD HH:mm">
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
            v-model="internalDate"
            mask="YYYY-MM-DD HH:mm"
            format24h
            :minute-options="[0, 15, 30, 45]"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat></q-btn>
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import useDate from "../composables/useDate";
const { ISOStringToDateTimeString, datetimeStringToISO } = useDate();

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  error: {
    type: Boolean,
  },
  label: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  maxWidth: {
    type: String,
    default: "300px",
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalDate = ref(ISOStringToDateTimeString(props.modelValue));

watch(internalDate, (newValue) => {
  emit("update:modelValue", datetimeStringToISO(newValue));
});
// Watch for changes in modelValue (prop) and update internalDate
watch(
  () => props.modelValue,
  (newValue) => {
    const newInternalDate = ISOStringToDateTimeString(newValue);
    if (newInternalDate !== internalDate.value) {
      internalDate.value = newInternalDate;
    }
  }
);
</script>

<style scoped>
/* Add any styles you might need */
</style>
