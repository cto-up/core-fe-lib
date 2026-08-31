<template>
  <div class="app-bg" aria-hidden="true">
    <div class="orb orb-1" />
    <div class="orb orb-2" />
  </div>
</template>

<style scoped>
.app-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* Soft radial blobs (mirrors the marketing landing's ambient background): a
   colour core that fades to transparent, lightly blurred. Tints from the brand
   gradient stops so it follows tenant branding; falls back to --primary / --info
   for consumers that don't define the brand tokens. Tune via --gradient-orb-*.

   The sizes are viewport-relative on purpose. Fixed 540px/480px circles read as
   two corner accents on a 1280px canvas, but a 540px circle on a 390px phone is
   1.4x the screen width — the two then overlap across the whole viewport and the
   "accent" becomes a full-bleed violet-to-fuchsia wash that cards have to sit
   on. `min()` keeps the desktop sizes and shrinks them on a phone (the offsets
   use `max()` — they are negative, so `max` is the branch that pulls a
   shrunken orb LESS far off-screen); the opacity
   step below drops the wash further where the orbs still cover most of the
   screen. Consumers that set --gradient-orb-* keep full control. */
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(var(--gradient-orb-blur, 90px));
  opacity: var(--gradient-orb-opacity, 0.45);
}

.orb-1 {
  width: min(540px, 72vw);
  height: min(540px, 72vw);
  top: max(-180px, -24vw);
  right: max(-120px, -16vw);
  background: radial-gradient(
    circle,
    hsl(var(--brand-grad-from, var(--primary))) 0%,
    transparent 70%
  );
}

.orb-2 {
  width: min(480px, 64vw);
  height: min(480px, 64vw);
  top: 280px;
  left: max(-160px, -21vw);
  background: radial-gradient(
    circle,
    hsl(var(--brand-grad-to, var(--info, 199 89% 48%))) 0%,
    transparent 70%
  );
}

/* Below `sm` the orbs still cover a large share of a narrow viewport, so the
   tint has to come down with them or the page never reads as neutral paper. */
@media (max-width: 639px) {
  .orb {
    opacity: calc(var(--gradient-orb-opacity, 0.45) * 0.5);
  }
}
</style>
