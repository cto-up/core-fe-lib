<template>
  <AppSidebar
    :visible="visible"
    :sidebar-width="sidebarWidth"
    :sidebar-expanded="sidebarExpanded"
    :is-mobile="isMobile"
    :mobile-open="mobileOpen"
    :toggle-label="labels.toggle"
    @toggle-sidebar="$emit('toggle-sidebar')"
    @update:mobile-open="$emit('update:mobileOpen', $event)"
  >
    <template #header="{ expanded }">
      <slot name="branding" :expanded="expanded">
        <div class="flex items-center gap-4">
          <transition name="ams-fade">
            <h2 v-show="expanded" class="text-xl font-semibold text-foreground">
              {{ brandingText }}
            </h2>
          </transition>
        </div>
      </slot>
    </template>

    <template #mobileHeader="{ onClose }">
      <slot name="mobileBranding" :on-close="onClose">
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            :title="labels.closeMobile ?? 'Close menu'"
            @click="onClose"
          >
            <Menu class="h-5 w-5 rotate-90" />
          </Button>
          <h2 class="text-xl font-semibold text-foreground">
            {{ brandingText }}
          </h2>
        </div>
      </slot>
    </template>

    <template #default="{ expanded }">
      <!-- Top "loose" section (e.g. super-admin) -->
      <AppSidebarSection
        v-if="topSection && topSection.items.length"
        :title="topSection.title"
        :expanded="expanded"
        :open="isSectionOpen(topSection.title)"
        @update:open="setSectionOpen(topSection.title, $event)"
      >
        <template #icon>
          <component
            :is="resolveIcon(topSection.icon)"
            class="h-4 w-4 flex-shrink-0"
          />
        </template>
        <li
          v-for="item in topSection.items"
          :key="item.title"
          class="flex items-center rounded-md"
        >
          <SidebarLink
            :title="item.title"
            :link="item.link"
            :caption="item.caption"
            :badge="item.badge"
            :icon-component="resolveIcon(item.icon)"
            :expanded="expanded"
            @click="$emit('navigate')"
          />
        </li>
      </AppSidebarSection>

      <!-- Main sections (each with optional privilege-gated sub-groups) -->
      <AppSidebarSection
        v-for="section in menuLinks"
        :key="section.title"
        :title="section.title"
        :expanded="expanded"
        :open="isSectionOpen(section.title)"
        @update:open="setSectionOpen(section.title, $event)"
      >
        <template #icon>
          <component
            :is="resolveIcon(section.icon)"
            v-if="section.icon"
            class="h-4 w-4 flex-shrink-0"
          />
        </template>

        <!-- Plain (non-sub-grouped) items — recursive to support nested groups -->
        <SidebarItemTree
          :items="section.items?.filter((i) => !i.linkType)"
          :expanded="expanded"
          :resolve-icon="resolveIcon"
          @navigate="$emit('navigate')"
        />

        <!-- Privilege-gated sub-groups -->
        <li
          v-for="sub in subGroups"
          v-show="
            (!sub.requiredPrivilege || canAccess(sub.requiredPrivilege)) &&
            section.items?.some((i) => i.linkType === sub.linkType)
          "
          :key="sub.linkType"
          class="space-y-1"
        >
          <Collapsible v-model:open="subGroupOpen[sub.linkType]">
            <CollapsibleTrigger
              class="flex items-center w-full justify-start rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              :class="!expanded && 'px-2'"
            >
              <component
                :is="sub.iconComponent"
                class="h-4 w-4"
                :class="expanded && 'mr-2'"
              />
              <span v-show="expanded">{{ sub.label }}</span>
              <ChevronDown
                v-show="expanded"
                class="ml-auto h-4 w-4 transition-transform duration-200"
                :class="subGroupOpen[sub.linkType] && 'rotate-180'"
              />
            </CollapsibleTrigger>
            <CollapsibleContent class="space-y-1 pl-4 pt-1">
              <SidebarLink
                v-for="item in section.items?.filter(
                  (i) => i.linkType === sub.linkType
                )"
                :key="item.title"
                :title="item.title"
                :link="item.link"
                :caption="item.caption"
                :badge="item.badge"
                :icon-component="resolveIcon(item.icon)"
                :expanded="expanded"
                @click="$emit('navigate')"
              />
            </CollapsibleContent>
          </Collapsible>
        </li>
      </AppSidebarSection>

      <!-- Trailing sections (e.g. tenant admin), often privilege-filtered -->
      <AppSidebarSection
        v-for="section in trailingSections"
        :key="section.title"
        :title="section.title"
        :expanded="expanded"
        :open="isSectionOpen(section.title)"
        @update:open="setSectionOpen(section.title, $event)"
      >
        <template #icon>
          <component
            :is="resolveIcon(section.icon)"
            v-if="section.icon"
            class="h-4 w-4 flex-shrink-0"
          />
        </template>
        <li
          v-for="item in section.items || []"
          :key="item.title"
          class="flex items-center rounded-md"
        >
          <SidebarLink
            :title="item.title"
            :link="item.link"
            :caption="item.caption"
            :badge="item.badge"
            :icon-component="resolveIcon(item.icon)"
            :expanded="expanded"
            @click="$emit('navigate')"
          />
        </li>
      </AppSidebarSection>
    </template>

    <template #footer>
      <slot name="footer">
        <p class="text-xs text-foreground/50 text-center">
          {{ labels.version ?? "Version" }} {{ version }}
        </p>
      </slot>
    </template>
  </AppSidebar>
</template>

<script lang="ts" setup>
import { ref, type Component } from "vue";
import AppSidebar from "./AppSidebar.vue";
import AppSidebarSection from "./AppSidebarSection.vue";
import SidebarLink from "./SidebarLink.vue";
import SidebarItemTree from "./SidebarItemTree.vue";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronDown, Menu } from "lucide-vue-next";
import { useSidebarSectionState } from "../composables/useSidebarSectionState";

export interface SidebarMenuItem {
  title: string;
  caption?: string;
  icon?: string;
  link?: string;
  /** Marker tying this item to a sub-group renderer (see SidebarSubGroup). */
  linkType?: string;
  badge?: number;
  /** Nested children — renders as a Collapsible sub-tree (see SidebarItemTree). */
  items?: SidebarMenuItem[];
}

export interface SidebarMenuSection {
  title: string;
  caption?: string;
  icon?: string;
  items?: SidebarMenuItem[];
  link?: string;
}

export interface SidebarTopSection {
  title: string;
  icon: string;
  items: SidebarMenuItem[];
}

export interface SidebarSubGroup {
  /** Matches SidebarMenuItem.linkType */
  linkType: string;
  iconComponent: Component;
  label: string;
  /** Optional privilege key; if set, `canAccess(key)` must be truthy. */
  requiredPrivilege?: unknown;
}

/**
 * SaaS sidebar with module sections + privilege-gated sub-groups.
 *
 * The caller supplies the menu data (`menuLinks`), optional top/trailing
 * sections, the sub-group catalog, and a `canAccess` predicate that closes
 * over its own auth store. This keeps AppMainSidebar independent of any
 * specific Role enum or store implementation.
 */
const props = withDefaults(
  defineProps<{
    visible: boolean;
    sidebarWidth: number;
    sidebarExpanded: boolean;
    isMobile: boolean;
    mobileOpen?: boolean;
    menuLinks: SidebarMenuSection[];
    topSection?: SidebarTopSection;
    trailingSections?: SidebarMenuSection[];
    subGroups?: SidebarSubGroup[];
    canAccess?: (privilege: unknown) => boolean;
    resolveIcon: (name?: string) => Component;
    brandingText?: string;
    version?: string;
    labels?: { toggle?: string; closeMobile?: string; version?: string };
    sectionStateKey?: string;
  }>(),
  {
    mobileOpen: false,
    topSection: undefined,
    trailingSections: () => [],
    subGroups: () => [],
    canAccess: () => true,
    brandingText: "",
    version: "",
    labels: () => ({}),
    sectionStateKey: "sidebar-sections-open",
  }
);

defineEmits<{
  "toggle-sidebar": [];
  "update:mobileOpen": [value: boolean];
  navigate: [];
}>();

const { isSectionOpen, setSectionOpen } = useSidebarSectionState(
  props.sectionStateKey
);

// Per-sub-group collapse state (in-memory; sub-groups are nested so each
// section instance shares this map keyed by sub-group linkType).
const subGroupOpen = ref<Record<string, boolean>>({});
</script>

<style scoped>
.ams-fade-enter-active,
.ams-fade-leave-active {
  transition: opacity 0.3s ease;
}
.ams-fade-enter-from,
.ams-fade-leave-to {
  opacity: 0;
}
</style>
