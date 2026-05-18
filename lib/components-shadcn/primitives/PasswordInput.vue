<script setup lang="ts">
import { ref } from "vue";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Eye, EyeOff, Lock } from "lucide-vue-next";

interface Props {
  modelValue: string;
  id?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  id: "password",
  label: "Password",
  placeholder: "Enter password",
  required: false,
  error: "",
});

const emit = defineEmits(["update:modelValue"]);

const isPasswordVisible = ref(false);

const toggleVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};
</script>

<template>
  <div class="grid gap-2">
    <Label :for="id">
      {{ label }}
    </Label>

    <div class="relative">
      <Lock class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

      <Input
        :id="id"
        :type="isPasswordVisible ? 'text' : 'password'"
        :value="modelValue"
        :required="required"
        :placeholder="placeholder"
        :class="[
          'pl-9 pr-9',
          error ? 'border-red-500 focus-visible:ring-red-500' : '',
        ]"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />

      <button
        type="button"
        class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
        tabindex="-1"
        @click="toggleVisibility"
      >
        <Eye v-if="!isPasswordVisible" class="h-4 w-4" />
        <EyeOff v-else class="h-4 w-4" />
      </button>
    </div>

    <p v-if="error" class="text-xs font-medium text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>
