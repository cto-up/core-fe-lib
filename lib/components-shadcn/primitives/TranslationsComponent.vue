<template>
  <Collapsible v-if="entityId" v-model:open="isOpen" class="border rounded-lg">
    <CollapsibleTrigger
      class="flex w-full items-center justify-between p-4 hover:bg-accent"
    >
      <span class="text-primary font-medium">{{ translationsLabel }}</span>
      <ChevronDown
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card>
        <CardContent class="pt-6 space-y-4">
          <div class="space-y-2">
            <Label>{{ languageLabel }}</Label>
            <Select v-model="selectedLanguage">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in languages"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-4">
            <div v-for="(field, index) in fields" :key="index">
              <TranslationItem
                :entity-type="entityType"
                :entity-id="entityId"
                :field-name="field.name"
                :field-display="field.display"
                :language="selectedLanguage"
                :service="service"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import TranslationItem, {
  type TranslationService,
} from "./TranslationItem.vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { ChevronDown } from "lucide-vue-next";

interface TranslationField {
  name: string;
  display: string;
}

interface LanguageOption {
  label: string;
  value: "en" | "fr";
}

withDefaults(
  defineProps<{
    entityType: string;
    entityId: string;
    fields: TranslationField[];
    service?: TranslationService;
    translationsLabel?: string;
    languageLabel?: string;
    languages?: LanguageOption[];
  }>(),
  {
    service: undefined,
    translationsLabel: "Translations",
    languageLabel: "Language",
    languages: () => [
      { label: "English", value: "en" },
      { label: "Français", value: "fr" },
    ],
  }
);

const isOpen = ref(false);
const selectedLanguage = ref<"en" | "fr">("en");
</script>
