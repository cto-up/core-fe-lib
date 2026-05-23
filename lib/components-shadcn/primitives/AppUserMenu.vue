<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="flex items-center gap-2">
        <slot name="avatar" />
        <span v-if="email" class="hidden md:flex flex-col items-start">
          <p class="text-sm font-medium">{{ email }}</p>
        </span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuItem v-if="roles && roles.length">
        <span class="md:flex items-start">
          <div class="flex gap-1">
            <Badge
              v-for="role in roles"
              :key="role"
              variant="secondary"
              class="text-xs"
            >
              {{ role }}
            </Badge>
          </div>
        </span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="roles && roles.length && items.length" />
      <DropdownMenuItem
        v-for="(item, i) in items"
        :key="i"
        @click="item.action"
      >
        <component :is="item.icon" v-if="item.icon" class="mr-2 h-4 w-4" />
        {{ item.label }}
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="items.length && signOutLabel" />
      <DropdownMenuItem v-if="signOutLabel" @click="$emit('sign-out')">
        <LogOut class="mr-2 h-4 w-4" />
        {{ signOutLabel }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script lang="ts" setup>
import { type Component } from "vue";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut } from "lucide-vue-next";

export interface UserMenuItem {
  icon?: Component;
  label: string;
  action: () => void;
}

/**
 * Common SaaS user dropdown: avatar (via slot) + email + role badges + custom
 * menu items + sign-out. Everything that varies between apps is injected:
 *
 *   <AppUserMenu
 *     :email="user.email"
 *     :roles="user.roles"
 *     :items="[
 *       { icon: User,   label: t('account'),  action: goToProfile },
 *       { icon: Shield, label: t('security'), action: goToSecurity },
 *     ]"
 *     :sign-out-label="t('signout')"
 *     @sign-out="signMeOut"
 *   >
 *     <template #avatar>
 *       <Avatar><AvatarImage :src="pictureURL" /></Avatar>
 *     </template>
 *   </AppUserMenu>
 */
defineProps<{
  email?: string;
  roles?: string[];
  items: UserMenuItem[];
  signOutLabel?: string;
}>();

defineEmits<{
  "sign-out": [];
}>();
</script>
