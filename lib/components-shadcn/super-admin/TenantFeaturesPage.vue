<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{ $t(titleKey) }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-3">
            <div
              v-for="key in featureKeys"
              :key="key"
              class="flex items-center space-x-2"
            >
              <Checkbox :id="key" v-model:checked="features[key]" />
              <Label :for="key" class="cursor-pointer">
                {{ $t(labelKey(key)) }}
              </Label>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              :disabled="loading"
              @click="backToTenant"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              {{ $t("actions.back") }}
            </Button>
            <Button type="submit" :disabled="loading">
              <Save class="mr-2 h-4 w-4" />
              {{ $t("actions.save") }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "../ui/toast/use-toast";
import useVuelidate from "@vuelidate/core";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import { type TenantFeatures } from "../../openapi/core/models/TenantFeatures";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Save } from "lucide-vue-next";
import { useErrors } from "../composables/useErrors";

/**
 * Renders one checkbox per key the backend returns in TenantFeatures.
 * The page is fully driven by the API payload — adding a new feature on the
 * backend automatically shows up here as long as the consumer ships an i18n
 * label for it under the configured namespace.
 */
const props = withDefaults(
  defineProps<{
    /** Route name to push back to the tenant edit page. */
    editTenantRouteName?: string;
    /** i18n key for the page title. */
    titleKey?: string;
    /** Builds the i18n key for each feature label given the feature's key. */
    labelKey?: (featureKey: string) => string;
  }>(),
  {
    editTenantRouteName: "super-admin-edit-tenant",
    titleKey: "core.features.title",
    labelKey: (key: string) => `core.features.${key}`,
  }
);

const router = useRouter();
const { toast } = useToast();
const route = useRoute();
const { handleError } = useErrors();
const { t } = useI18n();

const features = reactive({} as TenantFeatures);
const loading = ref(false);

const featureKeys = computed(() =>
  Object.keys(features).filter((k) => typeof (features as any)[k] === "boolean")
);

const backToTenant = () => {
  void router.push({
    name: props.editTenantRouteName,
    params: { id: route.params.tenantid },
  });
};

onMounted(() => {
  DefaultService.getTenantFeatures(route.params.tenantid as string)
    .then((data) => {
      Object.assign(features, data);
    })
    .catch((err) => {
      handleError(err);
    })
    .finally(() => {
      loading.value = false;
    });
});

const rules = {};
const v$ = useVuelidate(rules, features);

const onSubmit = async () => {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) {
    toast({ title: "Invalid form validation", variant: "destructive" });
    return;
  }
  loading.value = true;

  DefaultService.updateTenantFeatures(route.params.tenantid as string, features)
    .then(() => {
      loading.value = false;
      toast({ title: t("actions.saved") });
    })
    .catch((err) => {
      loading.value = false;
      handleError(err);
    });
};
</script>
