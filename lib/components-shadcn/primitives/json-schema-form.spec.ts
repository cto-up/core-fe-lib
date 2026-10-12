import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import JsonSchemaForm from "./JsonSchemaForm.vue";

const schema = {
  type: "object",
  properties: {
    tls: {
      type: "boolean",
      title: "Implicit TLS",
      default: true,
      description: "On for port 993.",
    },
  },
};

function mountForm(config: Record<string, unknown>) {
  return mount(JsonSchemaForm, {
    props: { schema, modelValue: { config, secretRefs: {} } },
  });
}

const checkbox = (w: ReturnType<typeof mountForm>) =>
  w.find<HTMLInputElement>("#jsf-tls").element;

describe("JsonSchemaForm boolean field", () => {
  // A saved tls:true read back as unchecked, and Save then wrote false.
  it("shows a saved true as checked", () => {
    expect(checkbox(mountForm({ tls: true })).checked).toBe(true);
  });

  it("shows a saved false as unchecked, even when the default is true", () => {
    expect(checkbox(mountForm({ tls: false })).checked).toBe(false);
  });

  it("shows the schema default when the field is unset", () => {
    expect(checkbox(mountForm({})).checked).toBe(true);
  });

  it("prints the description once", () => {
    const w = mountForm({ tls: true });
    expect(w.text().split("On for port 993.").length - 1).toBe(1);
  });
});
