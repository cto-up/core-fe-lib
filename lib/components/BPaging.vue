<template>
  <q-btn :disable="page == 1" flat label="<"></q-btn>
  <q-btn flat :label="page"></q-btn>
  <q-btn :disable="nextDisable" flat label=">"></q-btn>
</template>

<script lang="ts" setup>
defineProps({
  page: {
    type: Number,
    required: false,
  },
  nextDisable: {
    type: Boolean,
    required: false,
  },
});
</script>

<style scoped>
[dark='true']:not([color='primary']) {
  background: rgb(60, 60, 60);
}

[dark='false']:not([color='primary']) {
  background: rgb(241, 241, 241);
}
</style>
