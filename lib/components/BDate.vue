<template>
  <q-input
    :model-value="displayValue"
    @update:model-value="onUpdate"
    :label="label"
    :error="error"
    :error-message="errorMessage"
    :disable="disable"
    filled
  >
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy
          v-model="showPopup"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            :model-value="displayValue"
            @update:model-value="onDateSelect"
            :mask="displayMask"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { date } from 'quasar';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD', // Default input format
    validator: (value: string) => ['YYYY-MM-DD', 'ISO'].includes(value),
  },
});

const emit = defineEmits(['update:model-value']);
const showPopup = ref<boolean>(false);

const displayMask = 'YYYY-MM-DD';

const displayValue = computed(() => {
  if (!props.modelValue) return '';

  try {
    if (props.format === 'ISO') {
      return date.formatDate(props.modelValue, displayMask);
    }
    return props.modelValue;
  } catch (error) {
    console.error('Date conversion error:', error);
    return '';
  }
});

const onUpdate = (value: string) => {
  emitFormattedDate(value);
};

const onDateSelect = (value: string) => {
  emitFormattedDate(value);
  showPopup.value = false;
};

const emitFormattedDate = (value: string) => {
  if (!value) {
    emit('update:model-value', '');
    return;
  }

  try {
    if (props.format === 'ISO') {
      const dateObj = date.extractDate(value, displayMask);
      emit('update:model-value', dateObj.toISOString());
    } else {
      emit('update:model-value', value);
    }
  } catch (error) {
    console.error('Date conversion error:', error);
    emit('update:model-value', '');
  }
};
</script>
