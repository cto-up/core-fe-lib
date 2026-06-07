<!--
  VideoEmbed — a flat-props presentational video player shared across modules
  (Care page-builder, LMS classroom). It is deliberately NOT coupled to any
  builder-engine: it takes plain props, not a Block.

  Unlike a bare iframe, it uses the provider JS SDKs (YouTube IFrame API, Vimeo
  Player SDK) and the native <video> element so it can emit `timeupdate` and
  `ended` — the events the LMS classroom needs for auto-complete-on-end and
  resume-where-you-left-off. `startAt` seeks on load for resume.
-->
<template>
  <div class="w-full overflow-hidden rounded" style="aspect-ratio: 16/9">
    <video
      v-if="provider === 'direct'"
      ref="videoEl"
      :src="src"
      :controls="controls"
      :autoplay="autoplay"
      :muted="muted"
      :loop="loop"
      class="w-full h-full"
      @timeupdate="onNativeTimeUpdate"
      @ended="emit('ended')"
      @loadedmetadata="onNativeLoaded"
    />
    <!-- YouTube / Vimeo: the SDK replaces this element with its iframe -->
    <div v-else ref="frameHost" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    src: string;
    title?: string;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    /** Seek to this many seconds on load (resume). */
    startAt?: number;
  }>(),
  { controls: true, autoplay: false, muted: false, loop: false, startAt: 0 }
);

const emit = defineEmits<{
  /** Fired as playback progresses. percent is 0–100. */
  timeupdate: [seconds: number, percent: number];
  ended: [];
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const frameHost = ref<HTMLElement | null>(null);

const youtubeId = computed(() => {
  const m = props.src?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/
  );
  return m ? m[1] : null;
});
const vimeoId = computed(() => {
  const m = props.src?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
});
const provider = computed<"youtube" | "vimeo" | "direct">(() =>
  youtubeId.value ? "youtube" : vimeoId.value ? "vimeo" : "direct"
);

// ---------- native <video> ----------
function onNativeLoaded() {
  if (props.startAt && videoEl.value) videoEl.value.currentTime = props.startAt;
}
function onNativeTimeUpdate() {
  const v = videoEl.value;
  if (!v || !v.duration) return;
  emit("timeupdate", v.currentTime, (v.currentTime / v.duration) * 100);
}

// ---------- provider SDK loaders (shared, cached) ----------
function loadYT(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (w.__ytReady) return w.__ytReady;
  w.__ytReady = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return w.__ytReady;
}
function loadVimeo(): Promise<any> {
  const w = window as any;
  if (w.Vimeo?.Player) return Promise.resolve(w.Vimeo);
  if (w.__vimeoReady) return w.__vimeoReady;
  w.__vimeoReady = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://player.vimeo.com/api/player.js";
    tag.onload = () => resolve(w.Vimeo);
    document.head.appendChild(tag);
  });
  return w.__vimeoReady;
}

let player: any = null;
let pollTimer: ReturnType<typeof setInterval> | undefined;

function clearPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

async function mountYouTube() {
  const YT = await loadYT();
  if (!frameHost.value) return;
  player = new YT.Player(frameHost.value, {
    videoId: youtubeId.value,
    playerVars: {
      autoplay: props.autoplay ? 1 : 0,
      controls: props.controls ? 1 : 0,
      loop: props.loop ? 1 : 0,
      start: Math.floor(props.startAt || 0),
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onReady: () => {
        if (props.muted) player.mute?.();
        clearPoll();
        pollTimer = setInterval(() => {
          if (!player?.getDuration) return;
          const dur = player.getDuration();
          const cur = player.getCurrentTime?.() ?? 0;
          if (dur) emit("timeupdate", cur, (cur / dur) * 100);
        }, 1000);
      },
      onStateChange: (e: any) => {
        if (e.data === YT.PlayerState.ENDED) emit("ended");
      },
    },
  });
}

async function mountVimeo() {
  const Vimeo = await loadVimeo();
  if (!frameHost.value) return;
  player = new Vimeo.Player(frameHost.value, {
    id: Number(vimeoId.value),
    autoplay: props.autoplay,
    muted: props.muted,
    loop: props.loop,
    controls: props.controls,
    responsive: true,
  });
  if (props.startAt)
    player.setCurrentTime(props.startAt).catch(() => undefined);
  player.on("timeupdate", (d: any) =>
    emit("timeupdate", d.seconds, d.percent * 100)
  );
  player.on("ended", () => emit("ended"));
}

onMounted(() => {
  if (provider.value === "youtube") void mountYouTube();
  else if (provider.value === "vimeo") void mountVimeo();
});

onBeforeUnmount(() => {
  clearPoll();
  try {
    player?.destroy?.(); // YouTube
    player?.unload?.(); // Vimeo
  } catch {
    /* ignore */
  }
  player = null;
});
</script>
