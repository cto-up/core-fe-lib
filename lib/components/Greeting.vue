<script setup lang="ts">
import { createGreeting } from "../utils/createGreetings.ts";

defineProps<{ name: string }>();
</script>

<template>
  <h1>{{ createGreeting(name) }}</h1>
</template>
