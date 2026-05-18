<template>
  <div
    class="draggable-expansion-item fixed z-10"
    :style="{
      top: position.top + 'px',
      right: position.right + 'px',
      width: '300px',
    }"
  >
    <Collapsible
      v-model:open="isOpen"
      class="rounded-[30px] overflow-hidden shadow-lg"
    >
      <div class="header-gradient">
        <CollapsibleTrigger as-child>
          <div
            class="flex items-center p-3 cursor-move text-white"
            @mousedown="startDrag"
            @mouseup="handleMouseUp"
          >
            <div class="flex items-center gap-3 flex-1">
              <div
                class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <component
                  :is="getIconComponent(icon)"
                  class="h-5 w-5 text-white"
                />
              </div>
              <span class="font-medium">{{ label }}</span>
            </div>
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <Card class="content-card rounded-none border-0">
          <CardContent class="p-4">
            <slot />
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Card, CardContent } from "../ui/card";
import * as LucideIcons from "lucide-vue-next";

interface Props {
  label: string;
  icon: string;
  initialTop?: number;
  initialRight?: number;
  defaultOpened?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Counter",
  icon: "Compass",
  initialTop: 100,
  initialRight: 0,
  defaultOpened: false,
});

const position = reactive<{ top: number; right: number }>({
  top: props.initialTop,
  right: props.initialRight,
});

const isDragging = ref<boolean>(false);
const dragStart = reactive<{ x: number; y: number }>({ x: 0, y: 0 });
const hasMoved = ref<boolean>(false);
const isOpen = ref<boolean>(props.defaultOpened);

// Map Material icon names to Lucide icons
const iconMap: Record<string, string> = {
  explore: "Compass",
  home: "Home",
  settings: "Settings",
  person: "User",
  search: "Search",
  menu: "Menu",
  close: "X",
  add: "Plus",
  remove: "Minus",
  edit: "Edit",
  delete: "Trash2",
  check: "Check",
  arrow_back: "ArrowLeft",
  arrow_forward: "ArrowRight",
};

function getIconComponent(iconName: string) {
  const lucideIconName = iconMap[iconName] || iconName;
  return (LucideIcons as any)[lucideIconName] || LucideIcons.Circle;
}

const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  hasMoved.value = false;
  const containerWidth = document.documentElement.clientWidth;
  dragStart.x = containerWidth - event.clientX - position.right;
  dragStart.y = event.clientY - position.top;

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
};

const drag = (event: MouseEvent) => {
  const containerWidth = document.documentElement.clientWidth;

  event.preventDefault();
  event.stopPropagation();

  if (isDragging.value) {
    hasMoved.value = true;
    position.top = event.clientY - dragStart.y;
    position.right = containerWidth - event.clientX - dragStart.x;
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
};

const handleMouseUp = () => {
  if (!hasMoved.value) {
    // Toggle open/close if no drag has occurred
    isOpen.value = !isOpen.value;
  }
};

onMounted(() => {
  document.addEventListener("mouseup", stopDrag);
});

onUnmounted(() => {
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style scoped>
.header-gradient {
  background: linear-gradient(
    to right,
    rgba(45, 94, 123, 0.61),
    rgb(34 54 65 / 40%)
  );
}

.content-card {
  background: rgba(27, 26, 26, 0.976);
}
</style>
