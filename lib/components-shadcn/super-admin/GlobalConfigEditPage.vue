<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{ $t("core.globalConfig.detail.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveGlobalConfig">
          <!-- Name Field with autocomplete -->
          <div class="space-y-2">
            <Label for="name">{{ $t("core.globalConfig.fields.name") }}</Label>
            <Input
              id="name"
              v-model="globalConfig.name"
              list="global-config-schema-keys"
              :class="{ 'border-destructive': (v$ as any).name.$error }"
              :disabled="!!globalConfig.id"
              autocomplete="off"
              @keydown.enter.prevent
            />
            <datalist id="global-config-schema-keys">
              <option
                v-for="entry in schema"
                :key="entry.key"
                :value="entry.key"
              />
            </datalist>
            <p v-if="(v$ as any).name.$error" class="text-sm text-destructive">
              Field required & max length 50
            </p>
          </div>

          <!-- Schema info card: shown when name matches a known key -->
          <Alert v-if="schemaEntry" class="border-info/30 bg-info/5">
            <Info class="h-4 w-4 text-info" />
            <AlertTitle class="flex items-center gap-2">
              <span>{{ schemaEntry.label }}</span>
              <Badge variant="outline" class="text-xs font-mono">
                {{ schemaEntry.type }}
              </Badge>
              <Badge variant="secondary" class="text-xs">
                {{ schemaEntry.category }}
              </Badge>
            </AlertTitle>
            <AlertDescription>
              {{ schemaEntry.description }}
              <span
                v-if="schemaEntry.defaultValue !== undefined"
                class="block mt-1 text-xs text-muted-foreground"
              >
                Default:
                <code class="font-mono bg-muted px-1 rounded">{{
                  schemaEntry.defaultValue
                }}</code>
              </span>
            </AlertDescription>
          </Alert>

          <!-- Value Field — widget depends on schema type -->
          <div class="space-y-2">
            <Label for="value">{{
              $t("core.globalConfig.fields.value")
            }}</Label>

            <!-- Boolean toggle -->
            <div
              v-if="schemaEntry?.type === 'boolean'"
              class="flex items-center gap-3"
            >
              <Switch
                :checked="globalConfig.value === 'true'"
                @update:checked="
                  (v) => (globalConfig.value = v ? 'true' : 'false')
                "
              />
              <span class="text-sm text-muted-foreground">
                {{ globalConfig.value === "true" ? "Enabled" : "Disabled" }}
              </span>
            </div>

            <!-- Enum select -->
            <Select
              v-else-if="schemaEntry?.type === 'enum'"
              :model-value="globalConfig.value"
              @update:model-value="(v) => (globalConfig.value = v)"
            >
              <SelectTrigger>
                <SelectValue
                  :placeholder="schemaEntry.defaultValue ?? 'Select a value'"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in schemaEntry.options"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Number -->
            <Input
              v-else-if="schemaEntry?.type === 'number'"
              id="value"
              v-model="globalConfig.value"
              type="number"
              @keydown.enter.prevent
            />

            <!-- Text / unknown (fallback) -->
            <Input
              v-else
              id="value"
              v-model="globalConfig.value"
              @keydown.enter.prevent
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToGlobalConfigList"
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
              :disabled="loading || !globalConfig.id"
              @click="deleteGlobalConfig"
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
import { computed, onMounted } from "vue";
import { useGlobalConfig } from "../composables/useGlobalConfig";
import { useErrors } from "../composables/useErrors";
import {
  type GlobalConfigSchemaEntry,
  buildSchemaMap,
} from "../composables/configSchemaTypes";

const props = withDefaults(
  defineProps<{ schema?: GlobalConfigSchemaEntry[] }>(),
  { schema: () => [] }
);

const schemaMap = computed(() => buildSchemaMap(props.schema));
const getSchemaEntry = (key: string) => schemaMap.value.get(key);
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Save, ArrowLeft, Trash2, Info } from "lucide-vue-next";

const {
  globalConfig,
  loading,
  saveGlobalConfig,
  deleteGlobalConfig,
  fetchGlobalConfig,
  backToGlobalConfigList,
  v$,
} = useGlobalConfig((key) => getSchemaEntry(key)?.defaultValue);

const { handleError } = useErrors();

const schemaEntry = computed(() => getSchemaEntry(globalConfig.name));

onMounted(() => {
  fetchGlobalConfig().catch((error) => handleError(error));
});
</script>
