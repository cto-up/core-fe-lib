<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{{ t("core.userProfile.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <!-- Name Field -->
              <div class="space-y-2">
                <Label for="name">{{
                  t("core.userProfile.fields.name")
                }}</Label>
                <Input
                  id="name"
                  v-model="profile.name"
                  :class="{ 'border-destructive': (v$ as any).name.$error }"
                />
                <p
                  v-if="(v$ as any).name.$error"
                  class="text-sm text-destructive"
                >
                  Field required & max length 50
                </p>
              </div>

              <!-- Title Field -->
              <div class="space-y-2">
                <Label for="title">{{
                  t("core.userProfile.fields.title")
                }}</Label>
                <Input id="title" v-model="profile.title" />
              </div>

              <!-- About Field -->
              <div class="space-y-2">
                <Label for="about">{{
                  t("core.userProfile.fields.about")
                }}</Label>
                <Textarea id="about" v-model="profile.about" />
              </div>

              <!-- Interests Field -->
              <div class="space-y-2">
                <Label for="interests">{{
                  t("core.userProfile.fields.interests")
                }}</Label>
                <MultiSelect
                  v-model="profile.interests"
                  :options="[]"
                  placeholder="Add interests"
                />
              </div>

              <!-- Skills Field -->
              <div class="space-y-2">
                <Label for="skills">{{
                  t("core.userProfile.fields.skills")
                }}</Label>
                <MultiSelect
                  v-model="profile.skills"
                  :options="[]"
                  placeholder="Add skills"
                />
              </div>
            </div>

            <div class="space-y-4">
              <!-- Image Uploader -->
              <BUploader
                accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp,.svg,.heic"
                :aspect-ratio="1"
                :post-end-point="postEndPoint"
                :get-end-point="getUserPictureURL()"
                :image-mode="true"
                @uploaded-with-uri="getUserPictureURL"
              />

              <!-- Social Networks Field -->
              <div class="space-y-2">
                <Label for="socialMedias">{{
                  t("core.userProfile.fields.socialNetworks")
                }}</Label>
                <MultiSelect
                  v-model="profile.socialMedias"
                  :options="[]"
                  placeholder="Add social links"
                />
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4">
            <Button type="submit" :disabled="loading">
              <Save class="mr-2 h-4 w-4" />
              {{ t("actions.save") }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import BUploader from "../primitives/BUploader.vue";
import { required, maxLength } from "@vuelidate/validators";
import { onMounted, reactive, ref } from "vue";
import { useToast } from "../ui/toast/use-toast";
import useVuelidate from "@vuelidate/core";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import { type UserProfileSchema } from "../../openapi/core/models/UserProfileSchema";
import useLoggedUser from "../composables/useLoggedUser";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../../stores/user-store";
import { useErrors } from "../composables/useErrors";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import MultiSelect from "../ui/multi-select/MultiSelect.vue"; // Assuming a custom MultiSelect component
import { Save } from "lucide-vue-next";
import { computed } from "vue";

const { toast } = useToast();
const { handleError } = useErrors();

const profile = reactive({
  name: "",
  title: "",
  about: "",
  pictureURL: "",
  backgroundPictureURL: "",
  interests: [] as string[],
  skills: [] as string[],
  socialMedias: [] as string[],
} as UserProfileSchema);

const userStore = useUserStore();
const postEndPoint = `${import.meta.env.VITE_HTTP_API}/api/v1/me/profile/picture`;
const { getUserPictureURL } = useLoggedUser();

const loading = ref(false);

onMounted(() => {
  loading.value = true;
  DefaultService.getMeProfile()
    .then((data) => {
      Object.assign(profile, data);
    })
    .catch((err) => {
      handleError(err);
    })
    .finally(() => {
      loading.value = false;
    });
});

const rules = {
  name: { required, $autoDirty: true, maxLength: maxLength(50) },
};

const v$ = useVuelidate(rules, profile as UserProfileSchema);
const { t } = useI18n();

const backgroundPictureURL = computed(() => {
  return profile && profile.backgroundPictureURL
    ? profile.backgroundPictureURL
    : undefined;
});

const onSubmit = async () => {
  const isFormCorrect = await v$.value.$validate();
  // you can show some extra alert to the user or just leave each field to show it's `$errors`.
  if (!isFormCorrect) {
    toast({
      title: "Invalid form validation",
      variant: "destructive",
    });
    return;
  }
  loading.value = true;

  try {
    await DefaultService.updateMeProfile({ ...profile });
    toast({
      title: t("actions.saved"),
      variant: "default",
    });
    // set user name in store
    userStore.setUser({ ...userStore.user, name: profile.name });
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped></style>
