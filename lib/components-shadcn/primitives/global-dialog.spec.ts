// @vitest-environment happy-dom
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import GlobalDialog from "./GlobalDialog.vue";
import { useDialog } from "../composables/useDialog";

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
  useDialog().cancel();
  await nextTick();
  wrapper?.unmount();
  wrapper = undefined;
});

describe("GlobalDialog", () => {
  it("renders OK as destructive when the dialog destroys something", async () => {
    wrapper = mount(GlobalDialog, { attachTo: document.body });
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
    wrapper = mount(GlobalDialog, { attachTo: document.body });
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
});
