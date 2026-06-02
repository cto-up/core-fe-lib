<template>
  <div class="container mx-auto p-6">
    <Card class="form max-w-2xl mx-auto">
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
        <form class="space-y-6" @submit.prevent="onSubmit">
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
            v-if="isNew && userExists && !userExists.isMemberOfCurrentTenant"
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
            v-if="isNew && userExists?.isMemberOfCurrentTenant"
            variant="destructive"
          >
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>
              {{ $t("core.user.messages.alreadyMember") }}
            </AlertTitle>
            <AlertDescription>
              {{ $t("core.user.messages.alreadyMemberDescription") }}
              <router-link
                :to="`${editUserPathPrefix}/${userExists.id}`"
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
            v-if="
              !isNew || (userChecked && !userExists?.isMemberOfCurrentTenant)
            "
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
          <!-- Global Roles -->
          <div v-if="!isTenantSubdomain()" class="space-y-2">
            <Label>{{ $t("core.user.fields.globalRoles") }}</Label>
            <div class="flex items-center space-x-2">
              <Checkbox
                id="superAdmin"
                v-model:checked="isSuperAdmin"
                :disabled="disabled"
              />
              <Label for="superAdmin" class="font-normal">
                {{ $t("core.role.superAdmin") }} -
                {{ $t("core.user.roleDescriptions.superAdmin") }}
              </Label>
            </div>
          </div>

          <!-- Tenant Roles (Multiple Selection) -->
          <div
            v-if="
              !isNew || (userChecked && !userExists?.isMemberOfCurrentTenant)
            "
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
          <div class="flex flex-wrap gap-10 pt-4">
            <Switch
              v-if="!isNew"
              :label="$t('core.user.status.enabled')"
              :disable="disabled"
              :checked="!user.disabled"
              @update:checked="onEnabledChange"
            />
            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToUserList"
            >
              {{ $t("actions.backToList") }}
            </Button>
            <Button
              type="submit"
              :disabled="
                loading ||
                (isNew && !userChecked) ||
                userExists?.isMemberOfCurrentTenant
              "
              class="flex items-center"
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
                  @click="requestPasswordResetByAdmin"
                >
                  {{ $t("actions.requestPasswordReset") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="isTenantSubdomain()"
                  :disabled="loading || !user.id"
                  class="text-orange-600 focus:text-orange-600"
                  @click="removeUserFromTenant"
                >
                  <UserMinus class="mr-2 h-4 w-4" />
                  {{ $t("core.user.actions.removeFromTenant") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-else
                  :disabled="loading || !user.id"
                  class="text-destructive focus:text-destructive"
                  @click="deleteUser"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  {{ $t("actions.delete") }}
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
import { onMounted, ref, provide } from "vue";
import { useUrl } from "../../composables/useUrl";
import { useUser } from "../composables/useUser";

withDefaults(defineProps<{ editUserPathPrefix?: string }>(), {
  editUserPathPrefix: "/admin/users",
});
import { DefaultService } from "../../openapi/core";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Save,
  MoreVertical,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  UserMinus,
} from "lucide-vue-next";
import { useToast } from "../ui/toast";
import { useI18n } from "vue-i18n";

const { toast } = useToast();
const { t } = useI18n();
const {
  user,
  isNew,
  isAdmin,
  isCustomerAdmin,
  isUser,
  isSuperAdmin,
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
  requestPasswordResetByAdmin,
  backToUserList,
  getSaveButtonText,
  v$,
} = useUser();

const { isTenantSubdomain } = useUrl();
// Create a ref to track if all components are ready to save
const componentsReadyToSave = ref(true);
const saveCallbacks = ref([]);

// Provide a method for child components to register their save callbacks
provide("registerSaveCallback", (callback) => {
  saveCallbacks.value.push(callback);
});

// Provide a method for child components to report save readiness
provide("setComponentReadiness", (isReady) => {
  if (!isReady) {
    componentsReadyToSave.value = false;
  }
});
const onSubmit = async () => {
  // Reset readiness state
  componentsReadyToSave.value = true;

  // Notify all components to validate their data
  // Each component should call setComponentReadiness(false) if validation fails
  await Promise.all(
    saveCallbacks.value.map((callback) => callback("validate"))
  );

  // Only proceed if all components are ready
  if (componentsReadyToSave.value) {
    // First save the main user data
    await saveUser();

    // Then tell all extension components to save their data
    await Promise.all(saveCallbacks.value.map((callback) => callback("save")));
  }
};

onMounted(() => {
  fetchUser()
    .then(() => {
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
});
const disabled = ref(false);

const onEnabledChange = async (enabled: boolean) => {
  disabled.value = true;
  await DefaultService.updateUserStatus(user.id, {
    name: "DISABLED",
    value: !enabled,
  })
    .then(() => {
      toast({
        title: t("core.user.status.updated"),
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
