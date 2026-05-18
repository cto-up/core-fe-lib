<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-3xl">
      <CardHeader>
        <CardTitle>{{ $t("core.tenantProfile.title") }}</CardTitle>
      </CardHeader>
      <form @submit.prevent="onSubmit">
        <CardContent>
          <Tabs v-model="activeTab" default-value="display">
            <TabsList
              class="grid w-full grid-cols-3 bg-muted/20"
              style="border: 1px solid hsl(var(--border))"
            >
              <TabsTrigger value="display">
                {{ $t("core.tenantProfile.tabs.display") }}
              </TabsTrigger>
              <TabsTrigger value="company">
                {{ $t("core.tenantProfile.tabs.company") }}
              </TabsTrigger>
              <TabsTrigger value="pictures">
                {{ $t("core.tenantProfile.tabs.pictures") }}
              </TabsTrigger>
            </TabsList>

            <!-- Display Tab -->
            <TabsContent value="display" class="pt-6">
              <Accordion type="single" collapsible class="w-full space-y-4">
                <!-- Light Mode Accordion Item -->
                <AccordionItem value="light">
                  <AccordionTrigger class="hover:no-underline">
                    <h3 class="text-lg font-bold flex items-center gap-2">
                      <Sun class="h-5 w-5 text-amber-500" />
                      {{ $t("core.tenantProfile.themes.light") }}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent class="pt-4 px-1">
                    <div
                      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      <!-- Brand / Core -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Brand & Core
                        </h4>
                        <BColorPicker
                          v-model="profile.lightColors.primary"
                          label="Primary"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['primary-foreground']"
                          label="Primary Foreground"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.secondary"
                          label="Secondary"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['secondary-foreground']"
                          label="Secondary Foreground"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.tertiary"
                          label="Tertiary"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['header-background']"
                          label="Header Background"
                        />
                      </div>

                      <!-- Base UI -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Base UI
                        </h4>
                        <BColorPicker
                          v-model="profile.lightColors.background"
                          label="Background"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.text"
                          label="Foreground (Text)"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.card"
                          label="Card"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['card-foreground']"
                          label="Card Foreground"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.popover"
                          label="Popover"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['popover-foreground']"
                          label="Popover Foreground"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.muted"
                          label="Muted"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['muted-foreground']"
                          label="Muted Foreground"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.accent"
                          label="Accent"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['accent-foreground']"
                          label="Accent Foreground"
                        />
                      </div>

                      <!-- Feedback & Interaction -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Feedback
                        </h4>
                        <BColorPicker
                          v-model="profile.lightColors.positive"
                          label="Positive (Success)"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.info"
                          label="Info"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.warning"
                          label="Warning"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.negative"
                          label="Negative (Destructive)"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.border"
                          label="Border"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.input"
                          label="Input"
                        />
                        <BColorPicker
                          v-model="profile.lightColors.ring"
                          label="Ring"
                        />
                      </div>

                      <!-- Charts -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Charts
                        </h4>
                        <BColorPicker
                          v-model="profile.lightColors['chart-1']"
                          label="Chart 1"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['chart-2']"
                          label="Chart 2"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['chart-3']"
                          label="Chart 3"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['chart-4']"
                          label="Chart 4"
                        />
                        <BColorPicker
                          v-model="profile.lightColors['chart-5']"
                          label="Chart 5"
                        />
                      </div>

                      <!-- Sidebar -->
                      <div class="space-y-4 lg:col-span-2">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Sidebar
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <BColorPicker
                            v-model="profile.lightColors.sidebar"
                            label="Background"
                          />
                          <BColorPicker
                            v-model="profile.lightColors['sidebar-foreground']"
                            label="Foreground"
                          />
                          <BColorPicker
                            v-model="profile.lightColors['sidebar-primary']"
                            label="Primary"
                          />
                          <BColorPicker
                            v-model="
                              profile.lightColors['sidebar-primary-foreground']
                            "
                            label="Primary Foreground"
                          />
                          <BColorPicker
                            v-model="profile.lightColors['sidebar-accent']"
                            label="Accent"
                          />
                          <BColorPicker
                            v-model="
                              profile.lightColors['sidebar-accent-foreground']
                            "
                            label="Accent Foreground"
                          />
                          <BColorPicker
                            v-model="profile.lightColors['sidebar-border']"
                            label="Border"
                          />
                          <BColorPicker
                            v-model="profile.lightColors['sidebar-ring']"
                            label="Ring"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <!-- Dark Mode Accordion Item -->
                <AccordionItem value="dark">
                  <AccordionTrigger class="hover:no-underline">
                    <h3 class="text-lg font-bold flex items-center gap-2">
                      <Moon class="h-5 w-5 text-indigo-400" />
                      {{ $t("core.tenantProfile.themes.dark") }}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent class="pt-4 px-1">
                    <div
                      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      <!-- Brand / Core -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Brand & Core
                        </h4>
                        <BColorPicker
                          v-model="profile.darkColors.primary"
                          label="Primary"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['primary-foreground']"
                          label="Primary Foreground"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.secondary"
                          label="Secondary"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['secondary-foreground']"
                          label="Secondary Foreground"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.tertiary"
                          label="Tertiary"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['header-background']"
                          label="Header Background"
                        />
                      </div>

                      <!-- Base UI -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Base UI
                        </h4>
                        <BColorPicker
                          v-model="profile.darkColors.background"
                          label="Background"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.text"
                          label="Foreground (Text)"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.card"
                          label="Card"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['card-foreground']"
                          label="Card Foreground"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.popover"
                          label="Popover"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['popover-foreground']"
                          label="Popover Foreground"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.muted"
                          label="Muted"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['muted-foreground']"
                          label="Muted Foreground"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.accent"
                          label="Accent"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['accent-foreground']"
                          label="Accent Foreground"
                        />
                      </div>

                      <!-- Feedback & Interaction -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Feedback
                        </h4>
                        <BColorPicker
                          v-model="profile.darkColors.positive"
                          label="Positive (Success)"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.info"
                          label="Info"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.warning"
                          label="Warning"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.negative"
                          label="Negative (Destructive)"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.border"
                          label="Border"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.input"
                          label="Input"
                        />
                        <BColorPicker
                          v-model="profile.darkColors.ring"
                          label="Ring"
                        />
                      </div>

                      <!-- Charts -->
                      <div class="space-y-4">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Charts
                        </h4>
                        <BColorPicker
                          v-model="profile.darkColors['chart-1']"
                          label="Chart 1"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['chart-2']"
                          label="Chart 2"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['chart-3']"
                          label="Chart 3"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['chart-4']"
                          label="Chart 4"
                        />
                        <BColorPicker
                          v-model="profile.darkColors['chart-5']"
                          label="Chart 5"
                        />
                      </div>

                      <!-- Sidebar -->
                      <div class="space-y-4 lg:col-span-2">
                        <h4
                          class="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          Sidebar
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <BColorPicker
                            v-model="profile.darkColors.sidebar"
                            label="Background"
                          />
                          <BColorPicker
                            v-model="profile.darkColors['sidebar-foreground']"
                            label="Foreground"
                          />
                          <BColorPicker
                            v-model="profile.darkColors['sidebar-primary']"
                            label="Primary"
                          />
                          <BColorPicker
                            v-model="
                              profile.darkColors['sidebar-primary-foreground']
                            "
                            label="Primary Foreground"
                          />
                          <BColorPicker
                            v-model="profile.darkColors['sidebar-accent']"
                            label="Accent"
                          />
                          <BColorPicker
                            v-model="
                              profile.darkColors['sidebar-accent-foreground']
                            "
                            label="Accent Foreground"
                          />
                          <BColorPicker
                            v-model="profile.darkColors['sidebar-border']"
                            label="Border"
                          />
                          <BColorPicker
                            v-model="profile.darkColors['sidebar-ring']"
                            label="Ring"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <!-- Company Tab -->
            <TabsContent value="company" class="pt-6">
              <div class="space-y-2">
                <Label for="displayName">{{
                  $t("core.tenantProfile.displayName")
                }}</Label>
                <Input
                  id="displayName"
                  v-model="profile.displayName"
                  :placeholder="
                    $t('core.tenantProfile.placeholders.displayName')
                  "
                  :class="{
                    'border-destructive': (v$ as any).displayName.$error,
                  }"
                />
                <p
                  v-if="(v$ as any).displayName.$error"
                  class="text-sm text-destructive"
                >
                  {{ $t("core.tenantProfile.validation.maxLength", { n: 50 }) }}
                </p>
              </div>
            </TabsContent>

            <!-- Pictures Tab -->
            <TabsContent value="pictures" class="pt-6 space-y-6">
              <PictureUploader
                :fetch-endpoint="fetchLogo"
                :upload-endpoint="DefaultService.uploadTenantLogo"
                alt="Logo"
                empty-text="Aucun logo"
                upload-label="Uploader le logo"
              />
              <PictureUploader
                :fetch-endpoint="fetchBackground"
                :upload-endpoint="DefaultService.uploadTenantBackground"
                alt="Background"
                empty-text="Aucun background"
                upload-label="Uploader le background"
              />
              <PictureUploader
                :fetch-endpoint="fetchBackgroundMobile"
                :upload-endpoint="DefaultService.uploadTenantBackgroundMobile"
                alt="Background mobile"
                empty-text="Aucun background mobile"
                upload-label="Uploader le background mobile"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <div class="flex justify-end pt-6 p-4">
          <Button type="submit" :disabled="loading">
            <Save class="mr-2 h-4 w-4" />
            {{ $t("actions.save") }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { useNotify } from "../composables/useNotify";
import { useErrors } from "../composables/useErrors";

import BColorPicker from "../primitives/BColorPicker.vue";
import PictureUploader from "../primitives/PictureUploader.vue";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { applyTheme } from "../themes";
import { useDark } from "../composables/useDark";
import { onMounted, reactive, ref, watch } from "vue";
import {
  DefaultService,
  type ColorSchema,
  type TenantProfile,
} from "../../openapi/core";
import { maxLength, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import { useI18n } from "vue-i18n";
import { Sun, Moon, Save } from "lucide-vue-next";

const activeTab = ref("display");

const { handleError } = useErrors();

const profile = reactive({
  displayName: "",
  lightColors: {} as ColorSchema,
  darkColors: {} as ColorSchema,
} as TenantProfile);

const loading = ref(false);
const { isDark } = useDark();

// Watch for changes to apply theme live
watch(
  () => profile.lightColors,
  (newColors) => {
    if (!isDark.value) {
      applyTheme(newColors);
    }
  },
  { deep: true }
);

watch(
  () => profile.darkColors,
  (newColors) => {
    if (isDark.value) {
      applyTheme(newColors);
    }
  },
  { deep: true }
);

// Apply current theme when switching light/dark mode
watch(
  () => isDark.value,
  (isDark) => {
    applyTheme(isDark ? profile.darkColors : profile.lightColors);
  }
);

/*
  DefaultService.getTenantLogo() getTenantBackground() getTenantBackgroundMobile()
  wrong application type generated by openapi-ts
  so we use axios to fetch the picture
*/
function getPictureUrl(type: "logo" | "background" | "background-mobile") {
  return `/public-api/v1/tenant/pictures/${type}`;
}

const fetchLogo = () => {
  return axios
    .get(getPictureUrl("logo"), {
      responseType: "blob",
      headers: {
        Accept: "image/webp,*/*",
      },
    })
    .then((r) => r.data);
};
const fetchBackground = () => {
  return axios
    .get(getPictureUrl("background"), {
      responseType: "blob",
      headers: {
        Accept: "image/webp,*/*",
      },
    })
    .then((r) => r.data);
};
const fetchBackgroundMobile = () => {
  return axios
    .get(getPictureUrl("background-mobile"), {
      responseType: "blob",
      headers: {
        Accept: "image/webp,*/*",
      },
    })
    .then((r) => r.data);
};

onMounted(() => {
  DefaultService.getTenantProfile()
    .then((data) => {
      Object.assign(profile, data);
      Object.assign(profile.lightColors, data.lightColors);
      Object.assign(profile.darkColors, data.darkColors);
      // Initial theme application
      applyTheme(isDark.value ? profile.darkColors : profile.lightColors);
    })
    .catch((err) => {
      handleError(err);
    })
    .finally(() => {
      loading.value = false;
    });
});

const rules = {
  displayName: { required, $autoDirty: true, maxLength: maxLength(50) },
};

const v$ = useVuelidate(rules, profile);
const { t } = useI18n();

const { notify } = useNotify();

const onSubmit = async () => {
  const isFormCorrect = await v$.value.$validate();
  // you can show some extra alert to the user or just leave each field to show it's `$errors`.
  if (!isFormCorrect) {
    notify({
      message: "Error",
      caption: "Invalid form validation",
    });
    return;
  }
  loading.value = true;

  DefaultService.updateTenantProfile(profile)
    .then(() => {
      loading.value = false;
      notify({
        message: "Success",
        caption: t("actions.saved"),
      });
    })
    .catch((err) => {
      handleError(err);
    });
};
</script>
