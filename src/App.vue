<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { Greeting } from "../lib/main.ts";
import DatePicker from "../lib/components/DatePicker.vue";
import BDateTime from "../lib/components/BDateTime.vue";
import BTitle from "../lib/components/BTitle.vue";
import { ref } from "vue";

const date = ref("");
</script>

<template>
  <greeting name="User"></greeting>
  <b-title v-model="date"></b-title>
  <b-date-time v-model="date"></b-date-time>
  <date-picker v-model="date"></date-picker>
  <HelloWorld msg="Vite + VueX" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
