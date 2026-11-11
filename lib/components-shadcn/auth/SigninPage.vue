<template>
  <main
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />
    <SigninForm v-bind="props" />
  </main>
</template>

<script setup lang="ts">
import AppBackground from "../primitives/AppBackground.vue";
import SigninForm from "./SigninForm.vue";

// Prop docs live on SigninForm.
const props = defineProps<{
  recoveryPath?: string;
  signupPath?: string;
  continuePath?: string;
  socialReturnPath?: string;
  socialPrompt?: string;
}>();
</script>
