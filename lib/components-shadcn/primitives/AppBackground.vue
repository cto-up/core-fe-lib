<template>
  <div class="app-bg" aria-hidden="true">
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />
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

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(var(--gradient-orb-blur, 120px));
  opacity: var(--gradient-orb-opacity, 0.15);
}

.orb-1 {
  width: 600px;
  height: 600px;
  top: -150px;
  left: -100px;
  background: hsl(var(--primary));
}

.orb-2 {
  width: 500px;
  height: 500px;
  bottom: -100px;
  right: -80px;
  background: hsl(var(--info, 199 89% 48%));
}

.orb-3 {
  width: 400px;
  height: 400px;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: hsl(var(--primary) / 0.6);
}
</style>
