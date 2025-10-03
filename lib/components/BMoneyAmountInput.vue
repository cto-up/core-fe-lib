<template>
  <div class="row">
    <q-input
      class="col"
      filled
      type="number"
      :label="label"
      :model-value="theAmount"
      lazy-rules
      :rules="rules"
      hide-bottom-space
      :readonly="readonly"
      :suffix="suffix"
      :error-message="errorMessage"
      :error="error"
      @update:model-value="updateAmount($event)"
    ></q-input>
    <b-currency
      class="col-3"
      :model-value="theCurrency"
      @update:model-value="updateCurrency($event)"
    ></b-currency>
  </div>
</template>

<script lang="ts">
import type { ValidationRule } from 'quasar';
import type { PropType } from 'vue';
import { defineComponent, computed, ref } from 'vue';
import type { ErrorMessage } from './types';

export interface MoneyAmount {
  amount: number | null;
  currency: string | null;
}

export default defineComponent({
  name: 'BMoneyAmountInput',
  props: {
    label: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
    },
    suffix: {
      type: String,
    },
    modelValue: {
      type: Object as PropType<MoneyAmount | undefined | null>,
    },
    rules: {
      type: Array as PropType<ValidationRule[]>,
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
    const theAmount = ref(props.modelValue?.amount);
    const theCurrency = ref(
      props.modelValue?.currency ? props.modelValue?.currency : 'EUR',
    );

    const errorMessage = computed(() => {
      if (props.errorMessages) {
        return props.errorMessages.map((e) => e.$message).join(' ');
      }
      return '';
    });

    const emitModel = () => {
      emit('update:modelValue', {
        amount: theAmount.value,
        currency: theCurrency.value,
      });
    };
    const updateAmount = (amount: string | number | null) => {
      if (amount as number) {
        theAmount.value = amount as number;
        emitModel();
      } else if (amount as null) {
        theAmount.value = amount as null;
        emitModel();
      }
    };
    const updateCurrency = (currency: string) => {
      theCurrency.value = currency;
      emitModel();
    };

    const options = ['EUR', 'USD', 'VND', 'RON'];

    return {
      theAmount,
      theCurrency,
      errorMessage,
      updateAmount,
      updateCurrency,
      options,
    };
  },
});
</script>
