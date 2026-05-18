<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{{ $t("core.tenantConfig.detail.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveTenantConfig">
          <!-- Name Field with autocomplete -->
          <div class="space-y-2">
            <Label for="name">{{ $t("core.tenantConfig.fields.name") }}</Label>
            <Input
              id="name"
              v-model="tenantConfig.name"
              list="tenant-config-schema-keys"
              :class="{ 'border-destructive': (v$ as any).name.$error }"
              :disabled="!!tenantConfig.id"
              autocomplete="off"
              @keydown.enter.prevent
            />
            <datalist id="tenant-config-schema-keys">
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
              <span>{{ schemaEntry.key }}</span>
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
              $t("core.tenantConfig.fields.value")
            }}</Label>

            <!-- Boolean toggle -->
            <div
              v-if="schemaEntry?.type === 'boolean'"
              class="flex items-center gap-3"
            >
              <Switch
                :checked="tenantConfig.value === 'true'"
                @update:checked="
                  (v) => (tenantConfig.value = v ? 'true' : 'false')
                "
              />
              <span class="text-sm text-muted-foreground">
                {{ tenantConfig.value === "true" ? "Enabled" : "Disabled" }}
              </span>
            </div>

            <!-- LLM Registry Select — backed by /api/v1/pipeline/llm-models -->
            <RegistryLLMSelect
              v-else-if="schemaEntry?.type === 'llm'"
              :id="`tenant-config-llm-${tenantConfig.name}`"
              :model-value="tenantConfig.value"
              :capability="schemaEntry.requiresCapability ?? 'text'"
              :task-type="schemaEntry.taskType"
              :placeholder="schemaEntry.defaultValue ?? 'Select a model…'"
              :fetcher="llmFetcher"
              @update:model-value="(v) => (tenantConfig.value = v)"
            />

            <!-- Select -->
            <Select
              v-else-if="schemaEntry?.type === 'enum'"
              :model-value="tenantConfig.value"
              @update:model-value="(v) => (tenantConfig.value = v)"
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
              v-model="tenantConfig.value"
              type="number"
              @keydown.enter.prevent
            />

            <!-- String / unknown (fallback) -->
            <Input
              v-else
              id="value"
              v-model="tenantConfig.value"
              @keydown.enter.prevent
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              :disabled="loading"
              @click="backToTenantConfigList"
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
              :disabled="loading || !tenantConfig.id"
              @click="deleteTenantConfig"
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
import { useTenantConfig } from "../composables/useTenantConfig";
import { useErrors } from "../composables/useErrors";
import {
  type TenantConfigSchemaEntry,
  buildSchemaMap,
} from "../composables/configSchemaTypes";
import type {
  LLMFetcherArgs,
  LLMRegistryEntry,
} from "../primitives/LLMSelect.vue";
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
import RegistryLLMSelect from "../primitives/LLMSelect.vue";
import { Save, ArrowLeft, Trash2, Info } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    schema?: TenantConfigSchemaEntry[];
    llmFetcher?: (args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>;
  }>(),
  {
    schema: () => [],
    llmFetcher: undefined,
  }
);

const schemaMap = computed(() => buildSchemaMap(props.schema));
const getSchemaEntry = (key: string) => schemaMap.value.get(key);

const {
  tenantConfig,
  loading,
  saveTenantConfig,
  deleteTenantConfig,
  fetchTenantConfig,
  backToTenantConfigList,
  v$,
} = useTenantConfig((key) => getSchemaEntry(key)?.defaultValue);

const { handleError } = useErrors();

const schemaEntry = computed(() => getSchemaEntry(tenantConfig.name));

onMounted(() => {
  fetchTenantConfig().catch((error) => handleError(error));
});
</script>
