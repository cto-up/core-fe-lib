<template>
  <div class="inline-flex">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          :disabled="disabled"
          :title="$t('actions.more')"
          :aria-label="t('core.user.dataRights.menu', { name: member.name })"
          data-testid="member-rights-menu"
        >
          <MoreVertical class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <slot />
        <DropdownMenuSeparator v-if="$slots.default" />
        <DropdownMenuItem
          :disabled="isSelf || exporting"
          data-testid="member-export"
          @select="exportData"
        >
          <Download class="mr-2 h-4 w-4" />
          {{ t("core.user.dataRights.export") }}
        </DropdownMenuItem>
        <DropdownMenuItem
          :disabled="isSelf"
          class="text-destructive focus:text-destructive"
          data-testid="member-leave"
          @select="leaveOpen = true"
        >
          <UserMinus class="mr-2 h-4 w-4" />
          {{ t("core.user.dataRights.remove") }}
        </DropdownMenuItem>
        <DropdownMenuItem
          :disabled="isSelf"
          class="text-destructive focus:text-destructive"
          data-testid="member-close"
          @select="closeOpen = true"
        >
          <UserX class="mr-2 h-4 w-4" />
          {{ t("core.user.dataRights.close.action") }}
        </DropdownMenuItem>
        <p
          v-if="isSelf"
          class="max-w-[16rem] px-2 py-1.5 text-xs text-muted-foreground"
        >
          {{ t("core.user.dataRights.self") }}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>

    <MemberLeaveDialog
      v-if="leaveOpen"
      v-model:open="leaveOpen"
      :member="member"
      :tenant-id="tenantId"
      @left="onLeft"
    />
    <MemberCloseAccountDialog
      v-if="closeOpen"
      v-model:open="closeOpen"
      :member="member"
      :tenant-id="tenantId"
      @closed="onClosed"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Download, MoreVertical, UserMinus, UserX } from "lucide-vue-next";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "../ui/toast/use-toast";
import { useErrors } from "../composables/useErrors";
import { useUserStore } from "../../stores/user-store";
import { downloadJson } from "../utils";
import MemberLeaveDialog from "./MemberLeaveDialog.vue";
import MemberCloseAccountDialog from "./MemberCloseAccountDialog.vue";
import {
  memberDataRights,
  refusalText,
  type Member,
} from "./member-data-rights";

/**
 * A member's actions in Administration → Users: export their data, remove them
 * from the organisation, close their account (ctoup/gordon#98). The default
 * slot puts a page's own items first in the same menu.
 */
const props = defineProps<{
  member: Member;
  tenantId?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "left"): void;
  (e: "closed"): void;
}>();

const { t, locale } = useI18n();
const { toast } = useToast();
const { handleError } = useErrors();
const userStore = useUserStore();

const leaveOpen = ref(false);
const closeOpen = ref(false);
const exporting = ref(false);

// The server refuses it too; one's own rights live on My organizations.
const isSelf = computed(() => userStore.getUser?.id === props.member.id);

function refused(e: unknown): boolean {
  const text = refusalText(t, e, props.member.name);
  if (!text) return false;
  toast({
    title: t("core.user.dataRights.refused.title"),
    description: text,
    variant: "warning",
    duration: 0,
  });
  return true;
}

async function exportData() {
  exporting.value = true;
  try {
    const data = await memberDataRights(props.tenantId).exportData(
      props.member.id
    );
    downloadJson(data, `member-data-${props.member.id}.json`);
  } catch (e) {
    if (!refused(e)) handleError(e);
  } finally {
    exporting.value = false;
  }
}

function onLeft() {
  toast({
    title: t("core.user.dataRights.leave.done", { name: props.member.name }),
  });
  emit("left");
}

function onClosed(deletesOn: string) {
  toast({
    title: t("core.user.dataRights.close.done", {
      name: props.member.name,
      date: new Date(deletesOn).toLocaleDateString(locale.value, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }),
  });
  emit("closed");
}
</script>
