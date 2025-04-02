<template>
  <q-btn
    flat
    round
    :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
    @click="changeMode()"
  />
</template>

<script setup lang="ts">
import { useQuasar, LocalStorage } from "quasar";

const $q = useQuasar();
const initializeDarkMode = () => {
  const darkMode = LocalStorage.getItem("dark-mode");

  if (darkMode !== null) {
    console.log("darkMode", darkMode === "true");
    $q.dark.set(darkMode === "true" || darkMode === true); // Convert string to boolean
  } else {
    $q.dark.set(true);
    LocalStorage.set("dark-mode", "true");
  }
};
const changeMode = () => {
  $q.dark.toggle();
  LocalStorage.set("dark-mode", $q.dark.isActive ? "true" : "false");
};
</script>
