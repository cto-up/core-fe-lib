<template>
  <div
    class="draggable-expansion-item"
    :style="{
      top: position.top + 'px',
      right: position.right + 'px',
    }"
  >
    <q-expansion-item
      ref="expansionItem"
      class="header overflow-hidden"
      style="border-radius: 30px"
      header-class="text-white"
      expand-icon-class="text-white"
      expand-icon-toggle
      hide-expand-icon
      :default-opened="defaultOpened"
    >
      <template v-slot:header>
        <q-item-section
          class="draggable"
          avatar
          @mousedown="startDrag"
          @mouseup="handleMouseUp"
        >
          <q-avatar :icon="icon" text-color="white"></q-avatar>
        </q-item-section>
        <q-item-section
          class="draggable"
          @mousedown="startDrag"
          @mouseup="handleMouseUp"
        >
          {{ label }}
        </q-item-section>
      </template>
      <q-card class="content">
        <q-card-section>
          <slot> </slot>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { QExpansionItem } from 'quasar';

// Props
interface Props {
  label: string;
  icon: string;
  initialTop: number;
  initialRight: number;
  defaultOpened: boolean;
}

const props = defineProps<Props>();
const {
  label = 'Counter',
  icon = 'explore',
  initialTop = 100,
  initialRight = 0,
} = props;

const position = reactive<{ top: number; right: number }>({
  top: initialTop,
  right: initialRight,
});
const isDragging = ref<boolean>(false);
const dragStart = reactive<{ x: number; y: number }>({ x: 0, y: 0 });
//const dragThreshold = 5; // Minimum movement in pixels to consider as a drag
const hasMoved = ref<boolean>(false);

// Refs
const expansionItem = ref<QExpansionItem | null>(null);

// Methods
const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  hasMoved.value = false;
  const containerWidth = document.documentElement.clientWidth; // Width of the viewport
  dragStart.x = containerWidth - event.clientX - position.right; // Calculate initial drag distance
  dragStart.y = event.clientY - position.top;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
};

const drag = (event: MouseEvent) => {
  const containerWidth = document.documentElement.clientWidth; // Width of the viewport

  event.preventDefault();
  event.stopPropagation();

  // const deltaX = Math.abs(event.clientX - dragStart.x - position.left);
  // const deltaY = Math.abs(event.clientY - dragStart.y - position.top);

  if (isDragging.value) {
    // && (deltaX > dragThreshold || deltaY > dragThreshold)) {
    hasMoved.value = true;
    position.top = event.clientY - dragStart.y;
    position.right = containerWidth - event.clientX - dragStart.x;
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
};

const handleMouseUp = () => {
  if (!hasMoved.value) {
    // Trigger open/close if no drag has occurred
    expansionItem.value?.toggle(); // Toggles the open/close state
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('mouseup', stopDrag);
});

onUnmounted(() => {
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.header {
  background: linear-gradient(
    to right,
    rgba(45, 94, 123, 0.61),
    rgb(34 54 65 / 40%)
  );
}

.draggable {
  cursor: move;
}

.draggable-expansion-item {
  z-index: 10;
  position: absolute;
  width: 300px; /* Adjust as needed */
}
.content {
  background: rgba(27, 26, 26, 0.976);
  z-index: 15;
  position: relative;
}
</style>
