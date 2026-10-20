<template>
  <!-- A page that fills the window under MainAppLayout's top bar and scrolls
       its OWN panes, never the layout. Two leaks it closes:
       - an absolutely positioned descendant (the hidden native <select> a
         shadcn Select renders, a tooltip anchor) whose containing block sits
         above the pane's scrollers grows the layout's scroll area, and the
         wheel then slides the whole page up over an empty band;
       - on a phone the top bar slides away on scroll; the page moves up into
         its strip (`--app-nav-shift`) instead of leaving it empty.
       `clip`, not `hidden`: a hidden box is still a scroll container that
       focus and scrollIntoView can move. -->
  <div class="viewport-page">
    <slot />
  </div>
</template>

<style scoped>
.viewport-page {
  position: relative;
  overflow: clip;
  height: calc(100dvh - 4rem - var(--app-nav-shift, 0px));
  margin-top: var(--app-nav-shift, 0px);
  transition:
    margin-top 0.3s ease-out,
    height 0.3s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .viewport-page {
    transition: none;
  }
}
</style>
