<template>
  <div class="flex gap-2">
    <div class="flex-1 flex flex-col gap-2">
      <Label v-if="label">{{ label }}</Label>
      <Input
        v-model="amount"
        type="number"
        :placeholder="label"
        :readonly="readonly"
        :class="cn(error && 'border-red-500')"
      />
      <p v-if="error && errorMessage" class="text-sm text-red-500">
        {{ errorMessage }}
      </p>
    </div>
    <div class="w-32">
      <BCurrency v-model="currency" label="" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import BCurrency from "./BCurrency.vue";
import { cn } from "../utils";

export interface MoneyAmount {
  amount: number | null;
  currency: string | null;
}

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  suffix: {
    type: String,
  },
  modelValue: {
    type: Object as () => MoneyAmount | undefined | null,
  },
  errorMessages: {
    type: Array as () => Array<{ $message: string }>,
    default: () => [],
  },
  error: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const amount = ref<number | null>(props.modelValue?.amount ?? null);
const currency = ref<string>(props.modelValue?.currency ?? "EUR");

const errorMessage = computed(() => {
  if (props.errorMessages) {
    return props.errorMessages.map((e) => e.$message).join(" ");
  }
  return "";
});

const emitModel = () => {
  emit("update:modelValue", {
    amount: amount.value,
    currency: currency.value,
  });
};

watch([amount, currency], () => {
  emitModel();
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      amount.value = newValue.amount ?? null;
      currency.value = newValue.currency ?? "EUR";
    }
  },
  { deep: true }
);
</script>
