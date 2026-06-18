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
   for consumers that don't define the brand tokens. Tune via --gradient-orb-*. */
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(var(--gradient-orb-blur, 90px));
  opacity: var(--gradient-orb-opacity, 0.45);
}

.orb-1 {
  width: 540px;
  height: 540px;
  top: -180px;
  right: -120px;
  background: radial-gradient(
    circle,
    hsl(var(--brand-grad-from, var(--primary))) 0%,
    transparent 70%
  );
}

.orb-2 {
  width: 480px;
  height: 480px;
  top: 280px;
  left: -160px;
  background: radial-gradient(
    circle,
    hsl(var(--brand-grad-to, var(--info, 199 89% 48%))) 0%,
    transparent 70%
  );
}
</style>
