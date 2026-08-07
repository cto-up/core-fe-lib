<template>
  <main
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />

    <Card class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80">
      <CardHeader class="space-y-1 text-center">
        <div class="flex justify-center mb-2">
          <div class="rounded-full bg-destructive/10 p-3">
            <TriangleAlert class="h-7 w-7 text-destructive" />
          </div>
        </div>
        <CardTitle class="text-2xl font-bold">
          {{ tf("title", "Sign-in could not be completed") }}
        </CardTitle>
        <CardDescription>
          {{ tf("subtitle", "Nothing was changed on your account.") }}
        </CardDescription>
      </CardHeader>

      <CardContent class="grid gap-4">
        <div v-if="loading" class="flex justify-center py-4">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

        <div
          v-else-if="reason"
          class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ reason }}
        </div>

        <p v-else class="text-sm text-muted-foreground">
          {{
            tf(
              "generic",
              "The sign-in attempt expired or was interrupted. Starting again usually resolves it."
            )
          }}
        </p>

        <!-- The id is what support needs to find this in the Kratos logs; the
             reason text above is often deliberately vague. -->
        <p v-if="errorId" class="text-xs text-muted-foreground/70">
          {{ tf("reference", "Reference") }}:
          <span class="font-mono">{{ errorId }}</span>
        </p>
      </CardContent>

      <CardFooter>
        <Button class="w-full" @click="startOver">
          {{ tf("retry", "Back to sign-in") }}
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>

<script setup lang="ts">
/**
 * Where Kratos sends the browser when a self-service flow dies before it can
 * render — `selfservice.flows.error.ui_url`.
 *
 * Social sign-in is the first flow in this app that redirects the browser at
 * all, so this URL had never been routed and every such failure landed on the
 * 404 page. The cases that reach here: an expired or already-consumed flow, a
 * provider that returned an error, and traits the identity schema rejected
 * (e.g. Google withheld a verified email).
 *
 * Kratos passes only `?id=`; the reason has to be fetched.
 */
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { kratosService } from "../../authentication/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, TriangleAlert } from "lucide-vue-next";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(defineProps<{ signinPath?: string }>(), {
  signinPath: "/signin",
});

// Consumer apps may ship their own `auth.*` dictionary, so every string here
// carries a literal fallback rather than rendering a raw key path.
const { t, te } = useI18n();
const tf = (key: string, fallback: string): string => {
  const full = `auth.flowError.${key}`;
  return te(full) ? t(full) : fallback;
};

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const reason = ref("");
const errorId = ref("");

onMounted(async () => {
  const id = typeof route.query.id === "string" ? route.query.id : "";
  errorId.value = id;
  if (!id) {
    loading.value = false;
    return;
  }
  try {
    const detail = await kratosService.getFlowError(id);
    reason.value = detail.error?.reason || detail.error?.message || "";
  } catch {
    // The error record expires too. The generic copy still tells the user the
    // useful part: nothing changed, try again.
  } finally {
    loading.value = false;
  }
});

function startOver() {
  void router.replace(props.signinPath);
}
</script>
