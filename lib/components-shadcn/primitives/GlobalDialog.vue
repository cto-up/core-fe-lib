<template>
  <AlertDialog :open="dialogState.show">
    <AlertDialogContent @pointer-down-outside="onPointerDownOutside">
      <AlertDialogHeader>
        <AlertDialogTitle v-if="dialogState.title">
          {{ dialogState.title }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ dialogState.message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click.stop.prevent="cancel">
          {{ dialogState.cancel }}
        </AlertDialogCancel>
        <AlertDialogAction @click.stop.prevent="confirm">
          {{ dialogState.ok }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script lang="ts" setup>
import { useDialog } from "../composables/useDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const { dialogState, confirm, cancel } = useDialog();

const onPointerDownOutside = (event: Event) => {
  if (dialogState.value.persistent) {
    event.preventDefault();
  } else {
    cancel();
  }
};
</script>
