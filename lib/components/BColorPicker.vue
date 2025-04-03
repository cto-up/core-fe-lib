<template>
  <div class="color-picker-input">
    <q-input :label="label" filled v-model="selectedColor" class="my-input">
      <template v-slot:prepend>
        <q-icon name="fiber_manual_record" :style="{ color: selectedColor }" />
      </template>
      <template v-slot:append>
        <q-icon name="colorize" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-color v-model="selectedColor"></q-color>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'ColorPickerInput',
  props: {
    label: {
      type: String,
      required: true,
    },
    modelValue: {
      type: String,
      default: '#000000',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selectedColor = ref(props.modelValue);

    watch(selectedColor, (newValue) => {
      emit('update:modelValue', newValue);
    });

    return {
      selectedColor,
    };
  },
};
</script>
