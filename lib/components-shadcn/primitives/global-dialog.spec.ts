// @vitest-environment happy-dom
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import GlobalDialog from "./GlobalDialog.vue";
import { useDialog } from "../composables/useDialog";
import enActions from "../i18n/en-US/actions";
import frActions from "../i18n/fr/actions";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  fallbackLocale: "en-US",
  messages: {
    "en-US": { actions: enActions },
    fr: { actions: frActions },
  },
});

function mountDialog() {
  return mount(GlobalDialog, {
    attachTo: document.body,
    global: { plugins: [i18n] },
  });
}

function buttonLabels(): string[] {
  return [...document.body.querySelectorAll("button")].map(
    (b) => b.textContent?.trim() ?? ""
  );
}

/**
 * A confirmation that destroys something gets a red OK. The gradient default
 * variant used to win even with variant="destructive", because the Action
 * always started from buttonVariants() and bg-destructive does not override a
 * background-image.
 */
function okButton(): HTMLElement {
  const buttons = [...document.body.querySelectorAll("button")];
  return buttons.find((b) => b.textContent?.trim() === "Delete")!;
}

let wrapper: VueWrapper | undefined;

afterEach(async () => {
  i18n.global.locale.value = "en-US";
  useDialog().cancel();
  await nextTick();
  wrapper?.unmount();
  wrapper = undefined;
});

describe("GlobalDialog", () => {
  it("renders OK as destructive when the dialog destroys something", async () => {
    wrapper = mountDialog();
    void useDialog().confirmDialog({
      title: "Delete course?",
      message: "Gone for good.",
      ok: "Delete",
      destructive: true,
    });
    await nextTick();
    await nextTick();
    const cls = okButton().className;
    expect(cls).toContain("bg-destructive");
    expect(cls).not.toContain("linear-gradient");
  });

  it("keeps the brand default for an ordinary confirmation", async () => {
    wrapper = mountDialog();
    void useDialog().confirmDialog({ message: "Sure?", ok: "Delete" });
    await nextTick();
    await nextTick();
    const cls = okButton().className;
    expect(cls).toContain("linear-gradient");
    expect(cls).not.toContain("bg-destructive");
  });

  it("resets destructive between dialogs", () => {
    const { confirmDialog, dialogState, cancel } = useDialog();
    void confirmDialog({ message: "a", destructive: true });
    expect(dialogState.value.destructive).toBe(true);
    cancel();
    void confirmDialog({ message: "b" });
    expect(dialogState.value.destructive).toBe(false);
  });

  it("defaults OK and Cancel to the user's language", async () => {
    i18n.global.locale.value = "fr";
    wrapper = mountDialog();
    void useDialog().confirmDialog({ message: "Sûr ?" });
    await nextTick();
    await nextTick();
    const labels = buttonLabels();
    expect(labels).toContain(frActions.confirm);
    expect(labels).toContain(frActions.cancel);
    expect(labels).not.toContain("OK");
    expect(labels).not.toContain("Cancel");
  });

  it("keeps the labels a caller passes", async () => {
    i18n.global.locale.value = "fr";
    wrapper = mountDialog();
    void useDialog().confirmDialog({ message: "x", ok: "Retirez" });
    await nextTick();
    await nextTick();
    expect(buttonLabels()).toEqual([frActions.cancel, "Retirez"]);
  });
});
