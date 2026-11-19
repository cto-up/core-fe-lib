import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import enUS from "../../i18n/en-US";
import fr from "../../i18n/fr";
import MultiSelect from "./MultiSelect.vue";

// Every word MultiSelect shows came from its template in English, so a French
// user saw "Create …" and "Suggestions" in every tag field (office#7).

const i18n = (locale: "fr" | "en-US") =>
  createI18n({ legacy: false, locale, messages: { "en-US": enUS, fr } });

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

async function open(
  locale: "fr" | "en-US",
  props: Record<string, unknown> = {}
) {
  const wrapper = mount(MultiSelect, {
    props: { options: ["b2b", "emea"], ...props },
    global: { plugins: [i18n(locale)] },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  const trigger = wrapper.text();
  await wrapper
    .find("[aria-haspopup], button, [role='combobox']")
    .trigger("click");
  await flushPromises();
  return { trigger };
}

async function type(text: string) {
  const input = document.body.querySelector("input") as HTMLInputElement;
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
}

describe("MultiSelect in French", () => {
  it("names its suggestions, the empty search and the create button in French", async () => {
    const { trigger } = await open("fr");
    expect(trigger).toContain("Sélectionner…");
    expect(document.body.textContent).toContain("Suggestions");
    expect(
      (document.body.querySelector("input") as HTMLInputElement).placeholder
    ).toBe("Rechercher ou ajouter…");

    await type("zz");
    expect(document.body.textContent).toContain("Aucun résultat pour « zz »");
    expect(document.body.textContent).toContain("Créer « zz »");
  });

  it("keeps a caller's placeholder in both places", async () => {
    const { trigger } = await open("fr", { placeholder: "Ajouter un tag" });
    expect(trigger).toContain("Ajouter un tag");
    expect(
      (document.body.querySelector("input") as HTMLInputElement).placeholder
    ).toBe("Ajouter un tag");
  });
});

describe("MultiSelect in English", () => {
  it("keeps the English trigger text and create button", async () => {
    const { trigger } = await open("en-US");
    expect(trigger).toContain("Select options...");
    await type("zz");
    expect(document.body.textContent).toContain('Create "zz"');
    expect(document.body.textContent).toContain('No matches found for "zz"');
  });
});
