<script setup lang="ts">
// Install diagnostics, visible only when the URL has `?pwadebug`: shows why the
// browser is or isn't offering install, right on the phone screen (no devtools
// needed). The install state lives in each app's boot/pwa.ts, hence the props;
// `beforeinstallprompt` is read from `window.__bipEvent`, stashed by index.html.
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  canInstall: boolean;
  notInstalled: boolean;
  iosHint: boolean;
}>();

const enabled =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).has("pwadebug");
const info = ref("collecting…");

async function swState(): Promise<string> {
  try {
    const r = await navigator.serviceWorker?.getRegistration();
    if (!r) return "NONE";
    if (r.active) return "active";
    if (r.waiting) return "waiting";
    if (r.installing) return "installing";
    return "reg";
  } catch {
    return "err";
  }
}

async function refresh() {
  const w = window as unknown as { __bipEvent?: unknown };
  info.value = [
    `bip:${w.__bipEvent ? "CAPTURED" : "null"}`,
    `canInstall:${props.canInstall}`,
    `notInstalled:${props.notInstalled}`,
    `iosHint:${props.iosHint}`,
    `standalone:${matchMedia("(display-mode: standalone)").matches}`,
    `SW:${await swState()}`,
    `ctrl:${!!navigator.serviceWorker?.controller}`,
  ].join("  ");
}

let timer: number | undefined;
if (enabled) {
  void refresh();
  timer = window.setInterval(() => void refresh(), 1500);
}
onBeforeUnmount(() => window.clearInterval(timer));
</script>

<template>
  <div
    v-if="enabled"
    class="fixed inset-x-0 top-0 z-[500] bg-black px-2 py-1 text-center font-mono text-[10px] leading-tight text-lime-300"
    style="white-space: pre-wrap; word-break: break-word"
    data-testid="pwa-debug-bar"
  >
    {{ info }}
  </div>
</template>
