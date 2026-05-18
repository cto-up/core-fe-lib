<template>
  <div class="container mx-auto p-6">
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Seed: {{ module }}</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Reference Data Card -->
        <Card>
          <CardHeader>
            <CardTitle class="text-xl">
              {{ t(`layout.navigation.seed.reference.title`) }}
            </CardTitle>
            <CardDescription>
              {{ seedReferenceCaption }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              :disabled="loadingReference || loadingSample"
              class="w-full"
              @click="seedReferenceData"
            >
              <Database class="mr-2 h-4 w-4" />
              <span v-if="!loadingReference">
                {{ t(`layout.navigation.seed.reference.action`) }}
              </span>
              <span v-else class="flex items-center">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </span>
            </Button>
          </CardContent>
        </Card>

        <!-- Sample Data Card -->
        <Card v-if="!hideSampleData">
          <CardHeader>
            <CardTitle class="text-xl">
              {{ t(`layout.navigation.seed.sample.title`) }}
            </CardTitle>
            <CardDescription>
              {{ seedSampleCaption }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              :disabled="loadingReference || loadingSample"
              variant="secondary"
              class="w-full"
              @click="seedSampleData"
            >
              <FileStack class="mr-2 h-4 w-4" />
              <span v-if="!loadingSample">
                {{ t(`layout.navigation.seed.sample.action`) }}
              </span>
              <span v-else class="flex items-center">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Database, FileStack, Loader2 } from "lucide-vue-next";

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  seedReferenceFn: {
    type: Function,
    required: true,
  },
  seedReferenceCaption: {
    type: String,
    required: true,
  },
  seedSampleFn: {
    type: Function,
    required: true,
  },
  seedSampleCaption: {
    type: String,
    required: true,
  },
  hideSampleData: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const { toast } = useToast();
const loadingReference = ref(false);
const loadingSample = ref(false);

async function seedReferenceData() {
  loadingReference.value = true;
  try {
    await props.seedReferenceFn();
    toast({
      title: "Success",
      description: t(
        `layout.navigation.${props.module}.seed.reference.success`
      ),
    });
  } catch (error) {
    console.error(`Failed to seed reference data (${props.module}):`, error);
    toast({
      title: "Error",
      description: t(`layout.navigation.${props.module}.seed.reference.error`),
      variant: "destructive",
    });
  } finally {
    loadingReference.value = false;
  }
}

async function seedSampleData() {
  loadingSample.value = true;
  try {
    await props.seedSampleFn();
    toast({
      title: "Success",
      description: t(`layout.navigation.${props.module}.seed.sample.success`),
    });
  } catch (error) {
    console.error(`Failed to seed sample data (${props.module}):`, error);
    toast({
      title: "Error",
      description: t(`layout.navigation.${props.module}.seed.sample.error`),
      variant: "destructive",
    });
  } finally {
    loadingSample.value = false;
  }
}
</script>
