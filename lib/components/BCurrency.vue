<template>
  <q-select
    filled
    outlined
    :model-value="theCurrency"
    :options="options"
    label="Currency"
    @update:model-value="updateCurrency($event)"
  ></q-select>
</template>

<script lang="ts">
import { ValidationRule } from "quasar";
import { defineComponent, PropType, computed, ref } from "vue";
import { ErrorMessage } from "../../dev/src/components/types";

export default defineComponent({
  name: "BCurrencyInput",
  props: {
    label: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
    },
    modelValue: {
      type: String,
      default: "EUR",
    },
    rules: {
      type: Object as PropType<ValidationRule[]>,
    },
    errorMessages: {
      type: Array as PropType<ErrorMessage[]>,
      default: () => [],
    },
    error: {
      type: Boolean,
    },
    active: {
      type: Boolean,
    },
  },

  setup(props, { emit }) {
    const theCurrency = ref(props.modelValue ? props.modelValue : "EUR");

    const errorMessage = computed(() => {
      if (props.errorMessages) {
        return props.errorMessages.map((e) => e.$message).join(" ");
      }
      return "";
    });

    const emitModel = () => {
      emit("update:modelValue", theCurrency.value);
    };
    const updateCurrency = (currency: string) => {
      theCurrency.value = currency;
      emitModel();
    };

    const options = ["EUR", "USD", "VND", "RON"];

    return {
      theCurrency,
      errorMessage,
      updateCurrency,
      options,
    };
  },
});
</script>
