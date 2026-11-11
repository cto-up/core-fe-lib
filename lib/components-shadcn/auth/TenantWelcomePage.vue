<template>
  <div
    class="welcome flex min-h-svh flex-col bg-background text-foreground lg:flex-row"
  >
    <section
      data-test="welcome-brand"
      class="welcome-brand relative flex min-h-[10rem] shrink-0 flex-col justify-between gap-8 overflow-hidden p-5 sm:min-h-[30svh] sm:p-7 lg:min-h-svh lg:w-[53%] lg:p-10 2xl:w-3/5"
    >
      <img
        :src="backgrounds[backgroundIndex]"
        alt=""
        data-test="welcome-photo"
        class="absolute inset-0 h-full w-full object-cover"
        @error="backgroundIndex++"
      />
      <div aria-hidden="true" class="welcome-scrim absolute inset-0" />

      <div class="relative flex items-center gap-3 font-semibold">
        <img
          :src="logoFailed ? platformLogo : logoUrl"
          alt=""
          data-test="welcome-logo"
          class="h-10 w-auto max-w-[8rem] object-contain"
          @error="logoFailed = true"
        />
        <span class="text-lg">{{ displayName }}</span>
      </div>

      <blockquote
        v-if="values"
        class="welcome-quote relative m-0 max-w-[26ch] text-balance font-display text-lg leading-snug sm:text-[1.375rem]"
      >
        {{ values }}
      </blockquote>
    </section>

    <main
      class="welcome-side relative flex flex-1 flex-col justify-start px-6 pt-14 sm:items-center sm:justify-center sm:px-10 lg:px-16 pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <div class="absolute right-4 top-4 flex items-center gap-1">
        <LanguageSwitcher class="welcome-lang" />
        <ThemeSwitch
          :model-value="appStore.themePreference"
          @update:model-value="appStore.setThemePreference($event)"
        />
      </div>

      <div class="flex w-full max-w-sm flex-col gap-6">
        <h1
          class="welcome-title text-balance font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] font-bold leading-[1.05] tracking-tight"
        >
          {{
            tOr("auth.welcome.title", `Welcome to ${displayName}`, {
              name: displayName,
            })
          }}
        </h1>

        <SigninForm
          embedded
          :recovery-path="recoveryPath"
          :signup-path="signupPath"
          :continue-path="continuePath"
          :social-return-path="socialReturnPath"
          :social-prompt="socialPrompt"
        />

        <p
          v-if="!canSignUp && !userStore.session?.active"
          class="text-center text-sm text-muted-foreground"
        >
          {{
            tOr(
              "auth.welcome.askInvite",
              "New here? Ask your administrator for an invitation."
            )
          }}
        </p>

        <p class="welcome-powered text-xs text-muted-foreground">
          {{ tOr("auth.welcome.poweredBy", "Powered by") }}
          <b class="font-semibold text-foreground/75">{{ platformName }}</b>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTenantStore } from "../../stores/tenant-store";
import { useUserStore } from "../../stores/user-store";
import { useAppStore } from "../stores/app-store";
import { useTenant } from "../../authentication/vue";
import LanguageSwitcher from "../primitives/LanguageSwitcher.vue";
import ThemeSwitch from "../primitives/ThemeSwitch.vue";
import SigninForm from "./SigninForm.vue";

/**
 * What a tenant's own host shows at `/`: the tenant's brand beside the sign-in
 * form. The brand side reads the pictures set in Customize your space; the
 * platform-specific bits come in as props because one page serves every app.
 */
const props = defineProps<{
  /** The "Powered by" name. */
  platformName: string;
  /** Stands in when the tenant uploaded no logo. */
  platformLogo: string;
  /** Stands in when the tenant uploaded no background. */
  defaultBackground: string;
  recoveryPath?: string;
  signupPath?: string;
  continuePath?: string;
  socialReturnPath?: string;
  socialPrompt?: string;
}>();

const { t, te } = useI18n();
const tOr = (
  key: string,
  fallback: string,
  args: Record<string, unknown> = {}
): string => (te(key) ? t(key, args) : fallback);

const tenantStore = useTenantStore();
const userStore = useUserStore();
const appStore = useAppStore();
// The page sits outside the app layout, which is what loads the stored choice.
onMounted(() => void appStore.initTheme());
const { canSignUp } = useTenant();

const api = import.meta.env.VITE_HTTP_API ?? "";
const logoUrl = `${api}/public-api/v1/tenant/pictures/logo`;

// A picture the tenant never uploaded answers 404, so each <img> walks down its
// list on error: the tenant's own picture first, the platform's last. A phone
// tries its dedicated background before the wide one.
const logoFailed = ref(false);
const backgrounds = [
  ...(globalThis.matchMedia?.("(max-width: 1023px)").matches
    ? [`${api}/public-api/v1/tenant/pictures/background-mobile`]
    : []),
  `${api}/public-api/v1/tenant/pictures/background`,
  props.defaultBackground,
];
const backgroundIndex = ref(0);

const tenant = computed(() => tenantStore.tenant);
const displayName = computed(
  () => tenant.value?.profile?.displayName || tenant.value?.name || ""
);
const values = computed(() => tenant.value?.profile?.values?.trim() ?? "");
</script>

<style scoped>
/* The brand side is a photo, in either theme: white text over a fixed dark
   scrim, not tenant or theme tokens, keeps the name and quote at AA over a
   picture we know nothing about. The fill shows only before it loads. */
.welcome-brand {
  background-color: rgb(24 24 27);
  color: rgb(255 255 255);
}
.welcome-scrim {
  background-image: linear-gradient(
    to bottom,
    rgb(0 0 0 / 0.55),
    rgb(0 0 0 / 0.1) 35%,
    rgb(0 0 0 / 0.15) 60%,
    rgb(0 0 0 / 0.7)
  );
}

/* A phone on its side has ~375px of height: keep the brand as a strip beside
   the form, which scrolls. */
@media (max-height: 500px) and (orientation: landscape) {
  .welcome {
    flex-direction: row;
  }
  .welcome-brand {
    min-height: 100svh;
    width: 40%;
  }
  .welcome-quote {
    display: none;
  }
  .welcome-side {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
  .welcome-title {
    font-size: 1.5rem;
  }
  .welcome-powered {
    margin-top: 0;
  }
}

/* SelectTrigger's line-clamp stacks the switcher's globe above its label. */
.welcome-lang :deep(button > span) {
  display: flex;
}
</style>
