<template>
  <div class="space-y-3">
    <p v-if="!fields.length" class="text-xs text-muted-foreground">
      No fields declared for this schema.
    </p>
    <div v-for="field in fields" :key="field.name" class="space-y-1">
      <!-- Secret fields delegate to the caller via the scoped slot.
           Caller owns the input shape (typically SecretPicker). -->
      <slot
        v-if="field.isSecret"
        name="secret-field"
        :field-name="field.name"
        :field-schema="field.schema"
        :value="secretRefValue(field.name)"
        :on-change="(v: string | null) => setSecretRef(field.name, v)"
      >
        <!-- Fallback when the consumer didn't fill the slot: render a
             plain text input so the form still works (degraded). -->
        <Label :for="`jsf-${field.name}`">
          {{ titleFor(field) }}
          <span v-if="field.required" class="text-destructive">*</span>
        </Label>
        <Input
          :id="`jsf-${field.name}`"
          type="password"
          :model-value="secretRefValue(field.name) ?? ''"
          :placeholder="field.name"
          @update:model-value="
            (v: string | number) => setSecretRef(field.name, String(v) || null)
          "
        />
      </slot>

      <template v-else>
        <Label :for="`jsf-${field.name}`">
          {{ titleFor(field) }}
          <span v-if="field.required" class="text-destructive">*</span>
        </Label>

        <!-- enum: select -->
        <select
          v-if="field.enum && field.enum.length"
          :id="`jsf-${field.name}`"
          class="w-full border rounded-md px-3 py-2 bg-background text-sm"
          :value="configValue(field.name) ?? ''"
          @change="
            (e) => setConfig(field.name, (e.target as HTMLSelectElement).value)
          "
        >
          <option value="" disabled>
            {{ field.placeholder ?? "Select…" }}
          </option>
          <option v-for="opt in field.enum" :key="String(opt)" :value="opt">
            {{ opt }}
          </option>
        </select>

        <!-- boolean: checkbox -->
        <label
          v-else-if="field.type === 'boolean'"
          class="flex items-center gap-2"
        >
          <input
            :id="`jsf-${field.name}`"
            type="checkbox"
            :checked="Boolean(configValue(field.name))"
            @change="
              (e) =>
                setConfig(field.name, (e.target as HTMLInputElement).checked)
            "
          />
          <span class="text-sm text-muted-foreground">
            {{ field.description ?? "" }}
          </span>
        </label>

        <!-- integer / number -->
        <Input
          v-else-if="field.type === 'integer' || field.type === 'number'"
          :id="`jsf-${field.name}`"
          type="number"
          :model-value="configValue(field.name) ?? ''"
          :placeholder="placeholderFor(field)"
          @update:model-value="
            (v: string | number) =>
              setConfig(field.name, toNumber(v, field.type))
          "
        />

        <!-- string default -->
        <Input
          v-else
          :id="`jsf-${field.name}`"
          :model-value="configValue(field.name) ?? ''"
          :placeholder="placeholderFor(field)"
          @update:model-value="
            (v: string | number) => setConfig(field.name, String(v))
          "
        />

        <p v-if="field.description" class="text-xs text-muted-foreground">
          {{ field.description }}
        </p>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// JsonSchemaForm renders an editable form for a tiny subset of JSON Schema:
// only top-level `object` with `properties`. Each property may be:
//   - string (text input; with `enum` → select; with `format: password` →
//     password input)
//   - integer / number → number input
//   - boolean → checkbox
//
// Secret fields (names listed in `secretFields`) are not stored inline in
// `value.config`; instead the form tracks `value.secretRefs[name]` (a secret
// name string). The form does NOT render a default control for them — the
// caller fills the `secret-field` scoped slot (typically with SecretPicker)
// so consumers stay decoupled from any specific secrets backend.
//
// Out of scope (intentionally): arrays, oneOf/anyOf, $ref, nested objects.
// When you need those, write a bespoke form — schema-driven beyond this
// depth becomes more confusing than helpful.

export interface JsonSchemaFormValue {
  config: Record<string, unknown>;
  secretRefs: Record<string, string>;
}

interface FieldDef {
  name: string;
  schema: Record<string, unknown>;
  type: string;
  required: boolean;
  isSecret: boolean;
  enum?: unknown[];
  description?: string;
  placeholder?: string;
  title?: string;
}

const props = defineProps<{
  /**
   * JSON Schema object with `type: "object"` and a `properties` map.
   * Other shapes are tolerated but produce an empty form.
   */
  schema: Record<string, unknown> | null | undefined;
  /**
   * Field names (top-level property keys) whose values come from a
   * secrets vault rather than being stored in `config`.
   */
  secretFields?: string[];
  modelValue: JsonSchemaFormValue;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: JsonSchemaFormValue): void;
}>();

const secretSet = computed(() => new Set(props.secretFields ?? []));

const fields = computed<FieldDef[]>(() => {
  const schema = props.schema;
  if (!schema || typeof schema !== "object") return [];
  const props_ = (
    schema as { properties?: Record<string, Record<string, unknown>> }
  ).properties;
  if (!props_) return [];
  const required = new Set(
    Array.isArray((schema as { required?: unknown[] }).required)
      ? ((schema as { required: unknown[] }).required as string[])
      : []
  );
  return Object.entries(props_).map(([name, fieldSchema]) => {
    const type = String(fieldSchema?.type ?? "string");
    return {
      name,
      schema: fieldSchema,
      type,
      required: required.has(name),
      isSecret: secretSet.value.has(name),
      enum: Array.isArray(fieldSchema?.enum)
        ? (fieldSchema.enum as unknown[])
        : undefined,
      description:
        typeof fieldSchema?.description === "string"
          ? (fieldSchema.description as string)
          : undefined,
      title:
        typeof fieldSchema?.title === "string"
          ? (fieldSchema.title as string)
          : undefined,
      placeholder:
        typeof fieldSchema?.examples === "object" &&
        Array.isArray(fieldSchema.examples) &&
        fieldSchema.examples.length
          ? String(fieldSchema.examples[0])
          : undefined,
    };
  });
});

function configValue(name: string): unknown {
  return props.modelValue?.config?.[name];
}

function secretRefValue(name: string): string | null {
  return props.modelValue?.secretRefs?.[name] ?? null;
}

function setConfig(name: string, value: unknown) {
  const next: JsonSchemaFormValue = {
    config: { ...(props.modelValue?.config ?? {}), [name]: value },
    secretRefs: { ...(props.modelValue?.secretRefs ?? {}) },
  };
  emit("update:modelValue", next);
}

function setSecretRef(name: string, value: string | null) {
  const refs = { ...(props.modelValue?.secretRefs ?? {}) };
  if (value && value.length) {
    refs[name] = value;
  } else {
    delete refs[name];
  }
  emit("update:modelValue", {
    config: { ...(props.modelValue?.config ?? {}) },
    secretRefs: refs,
  });
}

function titleFor(field: FieldDef): string {
  return field.title ?? humanise(field.name);
}

function placeholderFor(field: FieldDef): string | undefined {
  if (field.placeholder) return field.placeholder;
  const dflt = (field.schema as { default?: unknown })?.default;
  return dflt !== undefined ? String(dflt) : undefined;
}

function humanise(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toNumber(v: string | number, type: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  if (Number.isNaN(n)) return null;
  if (type === "integer") return Math.trunc(n);
  return n;
}
</script>
