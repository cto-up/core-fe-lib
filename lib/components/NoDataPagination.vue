<template>
  <div class="full-width row flex-center">
    <q-icon size="2em" name="sentiment_dissatisfied"></q-icon>
    <span>{{ $t('info.noData') }}</span>
    <q-btn v-if="page > 1" @click="goToPreviousPage" label="Back"> </q-btn>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Something went wrong',
  },
  page: {
    type: Number,
    required: true,
    default: 1,
  },
});

const emits = defineEmits(['goToPreviousPage']);

const goToPreviousPage = () => {
  emits('goToPreviousPage');
};
</script>
