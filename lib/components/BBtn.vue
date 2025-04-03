<template>
  <q-btn
    :style="label ? 'min-width: 150px' : ''"
    :label="label"
    :disable="disable"
    no-caps
    class="glass-button"
    :flat="color === 'primary' || color === 'secondary' ? false : true"
    :color="computedColor"
    :textColor="computedColor"
    :type="type"
  >
    <template #loading>
      <q-spinner-facebook></q-spinner-facebook>
    </template>
    <slot></slot>
  </q-btn>
</template>

<script lang="ts" setup>
import { type PropType, computed } from "vue";
import { useQuasar } from "quasar";
const $q = useQuasar();

const props = defineProps({
  color: {
    type: String as PropType<"primary" | "secondary" | "tertiary">,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  disable: {
    type: Boolean,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
  },
});

const computedColor = computed(() => {
  return `btn-${$q.dark.mode ? "dark" : "light"}-${
    props.color ? props.color : "tertiary"
  }`;
});
</script>

<style scoped>
[dark="true"]:not([color="primary"]) {
  background: rgb(60, 60, 60);
}

[dark="false"]:not([color="primary"]) {
  background: rgb(241, 241, 241);
}
</style>
