<template>
  <Card
    class="w-full cursor-pointer hover:bg-accent transition-colors"
    @click="handleActionClick"
  >
    <CardContent class="p-3 sm:p-4">
      <div
        class="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3"
      >
        <div
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-muted rounded-lg"
        >
          <Icon
            :name="icon"
            class="h-5 w-5"
            :default-class="hasValue ? 'text-primary' : 'text-muted-foreground'"
          />
        </div>

        <div class="flex-1 min-w-0 text-center sm:text-left">
          <div class="font-medium text-sm leading-tight">
            {{ title }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent } from "../ui/card";
import Icon from "./Icon.vue";

/**
 * Action type definition for card actions
 */
interface Action {
  title: string;
  callFunction: () => void;
}

/**
 * Props interface for CardAction component
 */
interface Props {
  hasValue: boolean;
  icon: string;
  title: string;
  description: string;
  createAction: Action;
  openAction: Action;
}

const props = defineProps<Props>();

/**
 * Computed property to determine which action to display
 */
const currentAction = computed<Action>(() =>
  props.hasValue ? props.openAction : props.createAction
);

/**
 * Handle action button click
 */
const handleActionClick = (): void => {
  currentAction.value.callFunction();
};
</script>
