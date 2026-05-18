<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {{
            isNew
              ? $t("core.user.detail.addUser")
              : $t("core.user.detail.title")
          }}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveUser">
          <!-- Email Input with Check Button (for new users) -->
          <div v-if="isNew" class="space-y-2">
            <Label for="email">{{ $t("core.user.fields.email") }}</Label>
            <div class="flex gap-2">
              <Input
                id="email"
                v-model="emailInput"
                type="email"
                :disabled="checking || userChecked"
                :placeholder="$t('core.user.messages.emailPlaceholder')"
                class="flex-1"
              />
              <Button
                type="button"
                :disabled="!emailInput || checking || userChecked"
                variant="outline"
                @click="checkUserExists"
              >
                {{
                  checking
                    ? $t("core.user.actions.checking")
                    : $t("core.user.actions.checkEmail")
                }}
              </Button>
            </div>
          </div>

          <!-- User Found - Add to Tenant Alert -->
          <Alert
            v-if="isNew && userExists && !userExists.isMemberOfTenant"
            class="border-green-500 bg-green-50"
          >
            <CheckCircle class="h-4 w-4 text-green-600" />
            <AlertTitle class="text-green-800">
              {{
                $t("core.user.messages.userFound", { name: userExists.name })
              }}
            </AlertTitle>
            <AlertDescription class="text-green-700">
              {{
                $t("core.user.messages.userFoundDescription", {
                  count: userExists.tenantCount,
                })
              }}
            </AlertDescription>
          </Alert>

          <!-- User Already Member Alert -->
          <Alert
            v-if="isNew && userExists?.isMemberOfTenant"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>
              {{ $t("core.user.messages.alreadyMember") }}
            </AlertTitle>
            <AlertDescription>
              {{ $t("core.user.messages.alreadyMemberDescription") }}
              <router-link
                :to="`${editUserPathPrefix}/${route.params.tenantid}/users/${userExists.id}`"
                class="underline ml-1"
              >
                {{ $t("core.user.messages.editUser") }}
              </router-link>
            </AlertDescription>
          </Alert>

          <!-- User Not Found - Create New Alert -->
          <Alert
            v-if="isNew && userChecked && !userExists"
            class="border-blue-500 bg-blue-50"
          >
            <Info class="h-4 w-4 text-blue-600" />
            <AlertTitle class="text-blue-800">
              {{ $t("core.user.messages.userNotFound") }}
            </AlertTitle>
            <AlertDescription class="text-blue-700">
              {{ $t("core.user.messages.userNotFoundDescription") }}
            </AlertDescription>
          </Alert>

          <!-- Name Field -->
          <div
            v-if="!isNew || (userChecked && !userExists?.isMemberOfTenant)"
            class="space-y-2"
          >
            <Label for="name">{{ $t("core.user.fields.name") }}</Label>
            <Input
              id="name"
              v-model="user.name"
              :disabled="userExists !== null"
              :class="{ 'border-destructive': (v$ as any).name.$error }"
              @keydown.enter.prevent
            />
            <p v-if="(v$ as any).name.$error" class="text-sm text-destructive">
              {{ $t("core.user.validation.nameRequired") }}
            </p>
          </div>

          <!-- Email Display (for existing users) -->
          <div v-if="!isNew" class="space-y-2">
            <Label for="email-display">{{
              $t("core.user.fields.email")
            }}</Label>
            <Input
              id="email-display"
              v-model="user.email"
              disabled
              class="bg-muted"
            />
          </div>

          <!-- Tenant Roles (Multiple Selection) -->
          <div
            v-if="!isNew || (userChecked && !userExists?.isMemberOfTenant)"
            class="space-y-3"
          >
            <Label>{{ $t("core.user.fields.tenantRoles") }}</Label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="roleAdmin"
                  v-model:checked="isAdmin"
                  :disabled="disabled"
                />
                <Label for="roleAdmin" class="font-normal">
                  {{ $t("core.role.admin") }} -
                  {{ $t("core.user.roleDescriptions.admin") }}
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="roleCustomerAdmin"
                  v-model:checked="isCustomerAdmin"
                  :disabled="disabled"
                />
                <Label for="roleCustomerAdmin" class="font-normal">
                  {{ $t("core.role.customer_admin") }} -
                  {{ $t("core.user.roleDescriptions.customerAdmin") }}
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="roleUser"
                  v-model:checked="isUser"
                  :disabled="disabled"
                />
                <Label for="roleUser" class="font-normal">
                  {{ $t("core.role.user") }} -
                  {{ $t("core.user.roleDescriptions.user") }}
                </Label>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ $t("core.user.validation.rolesRequired") }}
            </p>
          </div>

          <!-- Enabled Toggle and Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-4">
            <div v-if="!isNew" class="flex items-center space-x-2">
              <Switch
                id="enabledStatus"
                :disabled="disabled"
                :checked="!user.disabled"
                @update:checked="onEnabledChange"
              />
              <Label for="enabledStatus">{{
                $t("core.user.status.enabled")
              }}</Label>
            </div>

            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToUserList"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              {{ $t("actions.backToList") }}
            </Button>
            <Button
              type="submit"
              :disabled="
                loading ||
                (isNew && !userChecked) ||
                userExists?.isMemberOfTenant
              "
            >
              <Save class="mr-2 h-4 w-4" />
              {{ getSaveButtonText() }}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :disabled="loading || !user.id"
                  :title="$t('actions.more')"
                >
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  :disabled="loading || !user.id"
                  @click="requestPasswordResetBySuperAdmin"
                >
                  {{ $t("actions.requestPasswordReset") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  :disabled="loading || !user.id"
                  class="text-orange-600 focus:text-orange-600"
                  @click="removeUserFromTenant"
                >
                  <UserMinus class="mr-2 h-4 w-4" />
                  {{ $t("core.user.actions.removeFromTenant") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useUser } from "../composables/useUserFromAdminUser";

withDefaults(
  defineProps<{ editUserPathPrefix?: string }>(),
  { editUserPathPrefix: "/super-admin/tenants" }
);
import { useRoute } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { DefaultService, UserActionSchema } from "../../openapi/core";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Save,
  ArrowLeft,
  Trash2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Info,
  UserMinus,
} from "lucide-vue-next";

const { toast } = useToast();
const {
  user,
  isNew,
  isCustomerAdmin,
  isAdmin,
  isUser,
  loading,
  emailInput,
  checking,
  userChecked,
  userExists,
  checkUserExists,
  saveUser,
  deleteUser,
  removeUserFromTenant,
  fetchUser,
  requestPasswordResetBySuperAdmin,
  backToUserList,
  getSaveButtonText,
  v$,
} = useUser();

onMounted(() => {
  fetchUser()
    .then(() => {
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
});

const route = useRoute();

const disabled = ref(false);
const tenantId = route.params.tenantid as string;

const onEnabledChange = async (enabled: boolean) => {
  disabled.value = true;
  await DefaultService.updateUserStatusFromSuperAdmin(user.id, tenantId, {
    name: UserActionSchema.name.DISABLED,
    value: !enabled,
  })
    .then(() => {
      toast({
        title: $t("core.user.status.updated"),
        variant: "default",
      });
      user.disabled = !enabled;
    })
    .catch((e) => {
      toast({
        title: JSON.stringify(e),
        variant: "destructive",
      });
    })
    .finally(() => {
      disabled.value = false;
    });
};
</script>
