<template>
  <Button
    variant="ghost"
    size="icon"
    class="h-11 w-11 md:h-10 md:w-10"
    @click="toggle"
  >
    <Moon v-if="modelValue" class="h-5 w-5" />
    <Sun v-else class="h-5 w-5" />
  </Button>
</template>

<script lang="ts" setup>
import { Button } from "../ui/button";
import { Sun, Moon } from "lucide-vue-next";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const toggle = () => emit("update:modelValue", !props.modelValue);
</script>
