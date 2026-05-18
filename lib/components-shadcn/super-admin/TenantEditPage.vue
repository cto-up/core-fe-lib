<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{ $t("core.tenant.detail.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveTenant">
          <!-- Name Field -->
          <div class="space-y-2">
            <Label for="name">{{ $t("core.tenant.fields.name") }}</Label>
            <Input
              id="name"
              v-model="tenant.name"
              :class="{ 'border-destructive': (v$ as any).name.$error }"
              @update:model-value="clearName"
              @keydown.enter.prevent
            />
            <p v-if="(v$ as any).name.$error" class="text-sm text-destructive">
              Should start with a letter and only consist of letters, digits and
              hyphens with 4-20 characters
            </p>
          </div>

          <!-- Subdomain Field -->
          <div class="space-y-2">
            <Label for="subdomain">{{
              $t("core.tenant.fields.subdomain")
            }}</Label>
            <Input
              id="subdomain"
              v-model="tenant.subdomain"
              :class="{ 'border-destructive': (v$ as any).subdomain.$error }"
              @update:model-value="clearSubdomain"
              @keydown.enter.prevent
            />
            <p
              v-if="(v$ as any).subdomain.$error"
              class="text-sm text-destructive"
            >
              Field required & max length 50
            </p>
          </div>

          <!-- Allow Sign Up Checkbox -->
          <div class="flex items-center space-x-2">
            <Checkbox
              id="allow_sign_up"
              v-model:checked="tenant.allow_sign_up"
            />
            <Label for="allow_sign_up" class="cursor-pointer">
              {{ $t("core.tenant.fields.allowSignUp") }}
            </Label>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToTenantList"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              {{ $t("actions.backToList") }}
            </Button>
            <Button type="submit" :disabled="loading">
              <Save class="mr-2 h-4 w-4" />
              {{ $t("actions.save") }}
            </Button>
            <Button
              v-if="tenant.id"
              type="button"
              variant="secondary"
              @click="onUsersSelect()"
            >
              <Users class="mr-2 h-4 w-4" />
              {{ $t("core.user.home.title") }}
            </Button>
            <Button
              v-if="tenant.id"
              type="button"
              variant="secondary"
              @click="onFeaturesSelect()"
            >
              <Grid3x3 class="mr-2 h-4 w-4" />
              {{ $t("core.tenant.features.title") }}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :disabled="loading || !tenant.id"
                  :title="$t('actions.more')"
                >
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  :disabled="loading || !tenant.id"
                  class="text-destructive focus:text-destructive"
                  @click="deleteTenant"
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
import { onMounted } from "vue";
import { useTenant } from "../composables/useTenant";
import { useErrors } from "../composables/useErrors";
import { useRouter } from "vue-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Save,
  Users,
  Grid3x3,
  ArrowLeft,
  MoreVertical,
  Trash2,
} from "lucide-vue-next";

const { handleError } = useErrors();

const {
  tenant,
  loading,
  saveTenant,
  deleteTenant,
  fetchTenant,
  clearName,
  clearSubdomain,
  backToTenantList,
  v$,
} = useTenant();

const props = withDefaults(
  defineProps<{
    tenantUsersRouteName?: string;
    tenantFeaturesRouteName?: string;
  }>(),
  {
    tenantUsersRouteName: "super-admin-users",
    tenantFeaturesRouteName: "super-admin-tenant-features",
  }
);

const router = useRouter();

const onUsersSelect = () => {
  void router.push({
    name: props.tenantUsersRouteName,
    params: { tenantid: tenant.id },
  });
};

const onFeaturesSelect = () => {
  void router.push({
    name: props.tenantFeaturesRouteName,
    params: { tenantid: tenant.id },
  });
};

onMounted(() => {
  fetchTenant()
    .then(() => {
      loading.value = false;
    })
    .catch((e) => {
      handleError(e);
      loading.value = false;
    });
});
</script>
