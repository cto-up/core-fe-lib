<template>
  <AppNavbar :nav-width="navWidth" :collapsed="collapsed">
    <template #left>
      <Button
        v-if="showDesktopToggle"
        variant="ghost"
        size="icon"
        :title="labels.sidebarToggle ?? 'Toggle sidebar'"
        @click="$emit('toggle-sidebar')"
      >
        <PanelLeftClose v-if="sidebarExpanded" class="h-5 w-5" />
        <PanelLeftOpen v-else class="h-5 w-5" />
      </Button>
      <Button
        v-if="showMobileToggle"
        variant="ghost"
        size="icon"
        class="h-11 w-11 md:h-10 md:w-10"
        :title="labels.menu ?? 'Menu'"
        @click="$emit('toggle-mobile-sidebar')"
      >
        <Menu
          class="h-5 w-5 transition-transform duration-300"
          :class="{ 'rotate-90': mobileSidebarOpen }"
        />
      </Button>
      <Button
        v-if="showHome && (online || homeWorksOffline)"
        variant="ghost"
        size="icon"
        class="h-11 w-11 md:h-10 md:w-10"
        :title="labels.home ?? 'Home'"
        @click="$emit('go-home')"
      >
        <Home class="h-5 w-5" />
      </Button>
      <slot name="left-extras" />
    </template>

    <template #center>
      <slot name="center" />
    </template>

    <template #right>
      <slot name="right-leading" />
      <LanguageSwitcher v-if="showLanguageSwitcher" />
      <DarkModeSwitch
        v-if="showThemeToggle"
        :model-value="!!isDark"
        @update:model-value="$emit('toggle-theme')"
      />
      <div v-if="isLoggedIn" class="border-l h-6 mx-2" />
      <AppUserMenu
        v-if="isLoggedIn"
        :email="userEmail"
        :roles="userRoles"
        :items="userMenuItems"
        :sign-out-label="labels.signout"
        @sign-out="$emit('sign-out')"
      >
        <template #avatar>
          <slot name="avatar" />
        </template>
      </AppUserMenu>
      <!--
        Hidden with no network: signing in needs the server, so offering it
        offline is a guaranteed dead end — the learner taps it, the form cannot
        load, and there is no way back. True in every consuming app, which is
        why it lives here rather than in one of them.
      -->
      <Button
        v-else-if="showLogin && online"
        variant="ghost"
        size="icon"
        class="h-11 w-11 md:h-10 md:w-10"
        :title="labels.login ?? 'Sign in'"
        @click="$emit('go-signin')"
      >
        <LogIn class="h-5 w-5" />
      </Button>
      <slot name="right-trailing" />
    </template>
  </AppNavbar>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from "vue";

// Live connectivity, so the bar stops offering what cannot work the moment the
// network goes. navigator.onLine is a weak signal for "is the server
// reachable", but it is exactly the right one for "is a navigation to a page
// that must be fetched guaranteed to fail".
const online = ref(navigator.onLine);
const setOnline = () => (online.value = true);
const setOffline = () => (online.value = false);
globalThis.addEventListener("online", setOnline);
globalThis.addEventListener("offline", setOffline);
onUnmounted(() => {
  globalThis.removeEventListener("online", setOnline);
  globalThis.removeEventListener("offline", setOffline);
});

import AppNavbar from "./AppNavbar.vue";
import AppUserMenu, { type UserMenuItem } from "./AppUserMenu.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import DarkModeSwitch from "./DarkModeSwitch.vue";
import { Button } from "../ui/button";
import {
  Menu,
  Home,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-vue-next";

export interface AppMainNavbarLabels {
  menu?: string;
  home?: string;
  login?: string;
  signout?: string;
  sidebarToggle?: string;
}

/**
 * Full SaaS navbar pattern: hamburger / home on the left, theme + language
 * switches + user menu (or login button) on the right. Everything that varies
 * between apps comes in as props or slots:
 *
 *   <AppMainNavbar
 *     :nav-width="appStore.navWidth"
 *     :show-mobile-toggle="userStore.isLogged && isMobile"
 *     :show-home="!userStore.isLogged"
 *     :mobile-sidebar-open="mobileOpen"
 *     :is-logged-in="userStore.isLogged"
 *     :is-dark="appStore.isDark"
 *     :user-email="userStore.user?.email"
 *     :user-roles="userStore.user?.roles"
 *     :user-menu-items="[...]"
 *     :labels="{ menu, home, login, signout }"
 *     @toggle-mobile-sidebar="..."
 *     @toggle-theme="appStore.toggleTheme()"
 *     @go-home="router.push('/home')"
 *     @go-signin="router.push('/signin')"
 *     @sign-out="signMeOut"
 *   >
 *     <template #avatar><Avatar>...</Avatar></template>
 *   </AppMainNavbar>
 */
withDefaults(
  defineProps<{
    navWidth: string | number;
    /** Slide the bar out of view (hide-on-scroll-down). */
    collapsed?: boolean;
    showDesktopToggle?: boolean;
    sidebarExpanded?: boolean;
    showMobileToggle?: boolean;
    showHome?: boolean;
    /**
     * Does the consumer's home route work with no network? Default false, so
     * the Home button hides offline rather than leading somewhere blank. An
     * app whose home IS offline-capable opts back in.
     */
    homeWorksOffline?: boolean;
    showLogin?: boolean;
    showLanguageSwitcher?: boolean;
    showThemeToggle?: boolean;
    mobileSidebarOpen?: boolean;
    isLoggedIn?: boolean;
    isDark?: boolean;
    userEmail?: string;
    userRoles?: string[];
    userMenuItems?: UserMenuItem[];
    labels?: AppMainNavbarLabels;
  }>(),
  {
    collapsed: false,
    showDesktopToggle: false,
    sidebarExpanded: true,
    showMobileToggle: false,
    showHome: false,
    homeWorksOffline: false,
    showLogin: true,
    showLanguageSwitcher: true,
    showThemeToggle: true,
    mobileSidebarOpen: false,
    isLoggedIn: false,
    isDark: false,
    userEmail: undefined,
    userRoles: () => [],
    userMenuItems: () => [],
    labels: () => ({}),
  }
);

defineEmits<{
  "toggle-sidebar": [];
  "toggle-mobile-sidebar": [];
  "go-home": [];
  "go-signin": [];
  "toggle-theme": [];
  "sign-out": [];
}>();
</script>
