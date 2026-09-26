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
          {{ dialogState.cancel || t("actions.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction
          :variant="dialogState.destructive ? 'destructive' : 'default'"
          @click.stop.prevent="confirm"
        >
          {{ dialogState.ok || t("actions.confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
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

const { t } = useI18n();
const { dialogState, confirm, cancel } = useDialog();

const onPointerDownOutside = (event: Event) => {
  if (dialogState.value.persistent) {
    event.preventDefault();
  } else {
    cancel();
  }
};
</script>
