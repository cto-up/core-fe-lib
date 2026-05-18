<template>
  <Card class="mb-6">
    <CardHeader
      class="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"
    >
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div
          class="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <component
            :is="iconComponent"
            class="h-6 w-6 md:h-8 md:w-8 text-primary"
          />
        </div>
        <CardTitle class="text-base md:text-lg truncate">
          {{ title }}
        </CardTitle>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <slot name="headerActions" />
        <Button
          v-if="isCollapsible"
          variant="ghost"
          size="icon"
          :title="collapsed ? expandLabel : collapseLabel"
          @click="toggleCollapse"
        >
          <ChevronDown v-if="collapsed" class="h-5 w-5" />
          <ChevronUp v-else class="h-5 w-5" />
        </Button>
      </div>
    </CardHeader>
    <Separator v-if="!collapsed" />
    <CardContent v-if="!collapsed" class="pt-6">
      <slot name="content" />
    </CardContent>
    <CardFooter v-if="$slots.actions && !collapsed" class="flex justify-end">
      <slot name="actions" />
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ChevronDown, ChevronUp, Circle } from "lucide-vue-next";
import * as LucideIcons from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    title: string;
    icon?: string;
    isCollapsible?: boolean;
    expandLabel?: string;
    collapseLabel?: string;
  }>(),
  {
    icon: "Circle",
    isCollapsible: false,
    expandLabel: "Expand",
    collapseLabel: "Collapse",
  }
);

const collapsed = ref(props.isCollapsible);
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

// Compatibility: Material Icons → Lucide names. Lets callers pass either style.
const iconMap: Record<string, string> = {
  group: "Users",
  house: "Home",
  data_array: "Database",
  key: "Key",
  settings: "Settings",
  other_houses: "Building2",
  database: "Database",
  school: "GraduationCap",
  get_app: "Download",
  logout: "LogOut",
  menu: "Menu",
  home: "Home",
  login: "LogIn",
  close: "X",
  person_add: "UserPlus",
  mail: "Mail",
  chat: "MessageSquare",
  folder: "Folder",
  article: "FileText",
  event: "Calendar",
  favorite: "Heart",
  favorite_border: "Heart",
  note: "StickyNote",
  add_circle_outline: "PlusCircle",
  description: "FileText",
  schedule_send: "SendHorizontal",
  edit_note: "NotebookPen",
  forum: "MessageSquare",
  settings_suggest: "Settings",
  data_object: "Braces",
  group_work: "CircleDot",
  pages: "LayoutDashboard",
};

const iconComponent = computed(() => {
  const name = props.icon;
  const lucideName =
    iconMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
  return (LucideIcons as any)[lucideName] || Circle;
});
</script>
