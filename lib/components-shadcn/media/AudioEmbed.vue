<!--
  AudioEmbed — flat-props audio player shared across modules (Care page-builder,
  LMS classroom). Emits the same timeupdate/ended contract as VideoEmbed so the
  classroom can auto-complete + resume audio lessons too. Not builder-coupled.
-->
<template>
  <div>
    <p v-if="title" class="text-sm font-medium mb-2">{{ title }}</p>
    <audio
      ref="audioEl"
      :src="src"
      :controls="controls"
      :autoplay="autoplay"
      :loop="loop"
      class="w-full"
      @timeupdate="onTimeUpdate"
      @ended="emit('ended')"
      @loadedmetadata="onLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    src: string;
    title?: string;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    startAt?: number;
  }>(),
  { controls: true, autoplay: false, loop: false, startAt: 0 }
);

const emit = defineEmits<{
  timeupdate: [seconds: number, percent: number];
  ended: [];
}>();

const audioEl = ref<HTMLAudioElement | null>(null);

function onLoaded() {
  if (props.startAt && audioEl.value) audioEl.value.currentTime = props.startAt;
}
function onTimeUpdate() {
  const a = audioEl.value;
  if (!a || !a.duration) return;
  emit("timeupdate", a.currentTime, (a.currentTime / a.duration) * 100);
}
</script>
