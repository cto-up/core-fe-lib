<template>
  <div class="min-h-screen">
    <AppBackground />

    <!-- Sidebar -->
    <AppMainSidebar
      v-model:mobile-open="mobileSidebarOpen"
      :visible="userStore.isLogged && userStore.hasRole"
      :sidebar-width="appStore.wrapperLeftOffset"
      :sidebar-expanded="appStore.sidebarExpand"
      :is-mobile="isMobile"
      :menu-links="nav.menuLinks.value"
      :top-section="nav.topSection.value"
      :trailing-sections="nav.trailingSections.value"
      :sub-groups="nav.subGroups.value"
      :can-access="nav.canAccess"
      :resolve-icon="resolveIcon"
      :branding-text="brandingText"
      :version="version"
      :labels="{
        toggle: t('layout.sidebar.toggle'),
        closeMobile: t('layout.sidebar.closeMobile'),
        version: t('layout.version'),
      }"
      @toggle-sidebar="appStore.toggleSidebar"
      @navigate="mobileSidebarOpen = false"
    />

    <!-- Main Content Area -->
    <div
      class="relative z-10 transition-all duration-300"
      :style="{
        marginLeft:
          userStore.isLogged && userStore.hasRole && !isMobile
            ? `${appStore.wrapperLeftOffset}px`
            : '0',
      }"
    >
      <!-- Top Navbar -->
      <AppMainNavbar
        :nav-width="
          userStore.isLogged && userStore.hasRole ? appStore.navWidth : '100%'
        "
        :show-mobile-toggle="
          userStore.isLogged && userStore.hasRole && isMobile
        "
        :show-home="!(userStore.isLogged || userStore.hasRole)"
        :mobile-sidebar-open="mobileSidebarOpen"
        :is-logged-in="userStore.isLogged"
        :is-dark="appStore.isDark"
        :user-email="userStore.user?.email"
        :user-roles="userStore.user?.roles"
        :user-menu-items="userMenu.items.value"
        :labels="{
          menu: t('layout.header.menu'),
          home: t('layout.header.home'),
          login: t('layout.header.login'),
          signout: t('layout.userPanel.signout'),
        }"
        @toggle-mobile-sidebar="mobileSidebarOpen = !mobileSidebarOpen"
        @go-home="router.push(homePath)"
        @go-signin="router.push(signinPath)"
        @toggle-theme="appStore.toggleTheme()"
        @sign-out="signMeOut"
      >
        <template #avatar>
          <slot name="avatar">
            <Avatar class="h-8 w-8">
              <AvatarImage
                :src="userPictureURL"
                crossorigin="anonymous"
                @error="displayFallbackImage"
              />
              <AvatarFallback>
                {{ userStore.user?.email?.charAt(0).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
          </slot>
        </template>
      </AppMainNavbar>

      <!-- Page Content -->
      <main class="mt-16 mx-auto flex flex-col items-center">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <transition name="fade">
            <component :is="Component" :key="viewRoute.path" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, type Component } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { User, Shield, Settings, Database, ShieldCheck } from "lucide-vue-next";
import { useUserStore } from "../../stores/user-store";
import { useKratosAuth } from "../../authentication/vue";
import { useUrl } from "../../composables/useUrl";
import { Role } from "../../openapi/core/models/Role";
import { useAppStore } from "../stores/app-store";
import { useAppNav } from "../composables/useAppNav";
import { useAppUserMenu } from "../composables/useAppUserMenu";
import useLoggedUser from "../composables/useLoggedUser";
import AppMainNavbar from "../primitives/AppMainNavbar.vue";
import AppMainSidebar from "../primitives/AppMainSidebar.vue";
import AppBackground from "../primitives/AppBackground.vue";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import type {
  SidebarTopSection,
  SidebarMenuSection,
  SidebarSubGroup,
} from "../primitives/AppMainSidebar.vue";
import type { UserMenuItem } from "../primitives/AppUserMenu.vue";

/**
 * The complete SaaS app layout — `AppMainSidebar` + `AppMainNavbar` +
 * `RouterView`. Ships with sensible defaults for every wire-up:
 *
 *   - User dropdown points at `/user/me/profile` and `/user/me/security`
 *     (where `me/MeProfilePage` and `me/SecuritySettingsPage` are mounted
 *     by the conventional routes).
 *   - Super-admin top section appears on the root domain for super admins,
 *     pointing at `/super-admin/tenants` and `/global-configs`.
 *   - Admin trailing section appears for CUSTOMER_ADMIN+ users, with
 *     users/tenant-profile (base) + tenant-config/client-apps/secrets
 *     (ADMIN-only).
 *   - Sub-groups: ADMIN / MANAGEMENT / REF_DATA — the conventional
 *     linkType markers each module's nav-link factory can set on its
 *     items.
 *
 * Override any of these via the optional `*Factory` props if the host
 * app departs from convention. The only REQUIRED prop is `resolveIcon`
 * (each app supplies its own icon-name → component map).
 */
const props = withDefaults(
  defineProps<{
    /** REQUIRED — host's icon-name → component map. */
    resolveIcon: (name?: string) => Component;
    brandingText?: string;
    homePath?: string;
    signinPath?: string;
    profilePath?: string;
    securityPath?: string;
    version?: string;
    /** Optional override: factory for the super-admin top section. */
    topSectionFactory?: () => SidebarTopSection | undefined;
    /** Optional override: factory for the tenant-admin trailing section. */
    trailingSectionsFactory?: () => SidebarMenuSection[];
    /** Optional override: factory for the privilege-gated sub-groups. */
    subGroupsFactory?: () => SidebarSubGroup[];
    /** Optional override: factory for the user-menu dropdown items. */
    userMenuItemsFactory?: () => UserMenuItem[];
  }>(),
  {
    brandingText: "App",
    homePath: "/home",
    signinPath: "/signin",
    profilePath: "/user/me/profile",
    securityPath: "/user/me/security",
    version: "",
    topSectionFactory: undefined,
    trailingSectionsFactory: undefined,
    subGroupsFactory: undefined,
    userMenuItemsFactory: undefined,
  }
);

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const { isTenantSubdomain } = useUrl();
const { getUserPictureURL } = useLoggedUser();
const { signMeOut } = useKratosAuth();

const userPictureURL = ref(getUserPictureURL());
function displayFallbackImage() {
  userPictureURL.value = "https://picsum.photos/200";
}

// ── Default user-menu items ─────────────────────────────────────────────────
const defaultUserMenuItems = (): UserMenuItem[] => [
  {
    icon: User,
    label: t("layout.navigation.account.title"),
    action: () => router.push(props.profilePath),
  },
  {
    icon: Shield,
    label: t("layout.navigation.security.title"),
    action: () => router.push(props.securityPath),
  },
];

const userMenu = useAppUserMenu(
  () => (props.userMenuItemsFactory ?? defaultUserMenuItems)()
);

// ── Default sidebar nav config ──────────────────────────────────────────────
const defaultTopSection = (): SidebarTopSection | undefined => {
  if (isTenantSubdomain() || !userStore.isSuperAdmin) return undefined;
  return {
    title: t("layout.navigation.superAdmin.title"),
    icon: "settings",
    items: [
      {
        title: t("layout.navigation.superAdmin.tenants.title"),
        caption: t("layout.navigation.superAdmin.tenants.caption"),
        icon: "other_houses",
        link: "/super-admin/tenants",
      },
      {
        title: t("layout.navigation.superAdmin.globalConfig.title"),
        caption: t("layout.navigation.superAdmin.globalConfig.caption"),
        icon: "settings",
        link: "/global-configs",
      },
    ],
  };
};

const defaultTrailingSections = (): SidebarMenuSection[] => {
  if (!userStore.hasPrivilege(Role.CUSTOMER_ADMIN)) return [];
  const baseItems = [
    {
      title: t("layout.navigation.admin.users.title"),
      caption: t("layout.navigation.admin.users.caption"),
      icon: "group",
      link: "/users",
    },
    {
      title: t("layout.navigation.admin.customize.title"),
      caption: t("layout.navigation.admin.customize.caption"),
      icon: "house",
      link: "/admin/tenant-profile",
    },
  ];
  const adminOnlyItems = userStore.hasPrivilege(Role.ADMIN)
    ? [
        {
          title: t("layout.navigation.admin.tenantConfig.title"),
          caption: t("layout.navigation.admin.tenantConfig.caption"),
          icon: "data_array",
          link: "/tenant-configs",
        },
        {
          title: t("layout.navigation.admin.clientApps.title"),
          caption: t("layout.navigation.admin.clientApps.caption"),
          icon: "key",
          link: "/token/client-applications",
        },
      ]
    : [];
  return [
    {
      title: t("layout.navigation.admin.title"),
      caption: t("layout.navigation.admin.caption"),
      icon: "settings",
      items: [...baseItems, ...adminOnlyItems],
    },
  ];
};

const defaultSubGroups = (): SidebarSubGroup[] => [
  {
    linkType: "ADMIN",
    iconComponent: Settings,
    label: t("layout.menu.administration"),
    requiredPrivilege: Role.ADMIN,
  },
  {
    linkType: "MANAGEMENT",
    iconComponent: ShieldCheck,
    label: t("layout.menu.management"),
    requiredPrivilege: Role.CUSTOMER_ADMIN,
  },
  {
    linkType: "REF_DATA",
    iconComponent: Database,
    label: t("layout.menu.referenceData"),
  },
];

const nav = useAppNav({
  topSection: () => (props.topSectionFactory ?? defaultTopSection)(),
  trailingSections: () =>
    (props.trailingSectionsFactory ?? defaultTrailingSections)(),
  subGroups: () => (props.subGroupsFactory ?? defaultSubGroups)(),
  canAccess: (privilege) => userStore.hasPrivilege(privilege as Role),
});

// ── Mobile/viewport ─────────────────────────────────────────────────────────
const mobileSidebarOpen = ref(false);
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
  if (isMobile.value) appStore.sidebarExpand = false;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  appStore.initTheme();
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
