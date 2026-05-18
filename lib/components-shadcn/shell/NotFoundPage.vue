<template>
  <div
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />
    <div class="relative z-10 w-1/2 flex flex-col items-center">
      <h2 class="font-bold text-8xl text-center">{{ title }}</h2>
      <h3 class="font-medium text-2xl text-center my-2">{{ subtitle }}</h3>
      <p class="text-center text-foreground/30 text-sm">
        <slot name="message">
          The page you're trying to access <br />
          could not be found
        </slot>
      </p>
      <RouterLink :to="homePath">
        <Button class="mt-4" variant="outline">
          <ArrowLeft class="h-4 w-4 mr-2" />
          {{ homeLabel }}
        </Button>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppBackground from "../primitives/AppBackground.vue";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-vue-next";

/**
 * Generic 404 catch-all. Labels and home target come in as props so each
 * consumer brands its own copy and back-target. Override the message via
 * the `#message` slot for richer content.
 */
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    homePath?: string;
    homeLabel?: string;
  }>(),
  {
    title: "404",
    subtitle: "Not Found",
    homePath: "/",
    homeLabel: "Back to Home",
  }
);
</script>
