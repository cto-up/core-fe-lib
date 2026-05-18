<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{ $t("core.clientApplication.detail.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveClientApplication">
          <!-- Name Field -->
          <div class="space-y-2">
            <Label for="name">{{
              $t("core.clientApplication.fields.name")
            }}</Label>
            <Input
              id="name"
              v-model="clientApplication.name"
              :class="{ 'border-destructive': (v$ as any).name.$error }"
              @keydown.enter.prevent
            />
            <p v-if="(v$ as any).name.$error" class="text-sm text-destructive">
              Field required & max length 50
            </p>
          </div>

          <!-- Description Field -->
          <div class="space-y-2">
            <Label for="description">{{
              $t("core.clientApplication.fields.description")
            }}</Label>
            <Input
              id="description"
              v-model="clientApplication.description"
              :class="{ 'border-destructive': (v$ as any).description.$error }"
              @keydown.enter.prevent
            />
            <p
              v-if="(v$ as any).description.$error"
              class="text-sm text-destructive"
            >
              Field required & max length 50
            </p>
          </div>

          <!-- Active Checkbox -->
          <div class="flex items-center space-x-2">
            <Checkbox id="active" v-model:checked="clientApplication.active" />
            <Label for="active" class="cursor-pointer">
              {{ $t("core.clientApplication.fields.active") }}
            </Label>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToClientApplicationList"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              {{ $t("actions.backToList") }}
            </Button>
            <Button type="submit" :disabled="loading">
              <Save class="mr-2 h-4 w-4" />
              {{ $t("actions.save") }}
            </Button>
            <Button
              type="button"
              variant="secondary"
              :disabled="loading || !clientApplication.id"
              @click="deleteClientApplication"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              {{ $t("actions.delete") }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useClientApplication } from "../composables/useClientApplication";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Save, ArrowLeft, Trash2 } from "lucide-vue-next";

const {
  clientApplication,
  loading,
  saveClientApplication,
  deleteClientApplication,
  fetchClientApplication,
  backToClientApplicationList,
  v$,
} = useClientApplication();

onMounted(() => {
  fetchClientApplication();
});
</script>
