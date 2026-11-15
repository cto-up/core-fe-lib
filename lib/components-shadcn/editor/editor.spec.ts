// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import EditorShell from "./EditorShell.vue";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useDialog } from "../composables/useDialog";
import enActions from "../i18n/en-US/actions";
import enEditor from "../i18n/en-US/editor";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": { actions: enActions, editor: enEditor } },
});
const global = { plugins: [i18n] };

// Node's built-in localStorage (no --localstorage-file) has no methods and
// shadows happy-dom's; give the guard a real in-memory Storage.
const mem = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
});

afterEach(() => {
  const { dialogState, cancel } = useDialog();
  if (dialogState.value.show) cancel();
  mem.clear();
});

describe("EditorShell", () => {
  it("saves on Cmd/Ctrl+Enter and Cmd/Ctrl+S", async () => {
    const w = mount(EditorShell, {
      props: { title: "T", dirty: true },
      global,
    });
    await w.trigger("keydown", { key: "Enter", ctrlKey: true });
    await w.trigger("keydown", { key: "s", metaKey: true });
    expect(w.emitted("save")).toHaveLength(2);
  });

  it("does not save while saving", async () => {
    const w = mount(EditorShell, {
      props: { title: "T", dirty: true, saving: true },
      global,
    });
    await w.trigger("keydown", { key: "Enter", ctrlKey: true });
    expect(w.emitted("save")).toBeUndefined();
  });

  it("cancels a clean editor at once", async () => {
    const w = mount(EditorShell, {
      props: { title: "T", dirty: false },
      global,
    });
    await w.trigger("keydown", { key: "Escape" });
    await nextTick();
    expect(w.emitted("cancel")).toHaveLength(1);
  });

  it("asks before discarding dirty work, and keeps it on Keep editing", async () => {
    const { dialogState, cancel, confirm } = useDialog();
    const w = mount(EditorShell, {
      props: { title: "T", dirty: true },
      global,
    });
    await w.trigger("keydown", { key: "Escape" });
    expect(dialogState.value.show).toBe(true);
    expect(dialogState.value.title).toBe("Discard changes?");
    cancel();
    await nextTick();
    await nextTick();
    expect(w.emitted("cancel")).toBeUndefined();
    await w.trigger("keydown", { key: "Escape" });
    confirm();
    await nextTick();
    await nextTick();
    expect(w.emitted("cancel")).toHaveLength(1);
  });

  it("shows the error with its cause", () => {
    const w = mount(EditorShell, {
      props: { title: "T", dirty: false, error: "SVG is not well-formed" },
      global,
    });
    expect(w.find('[role="alert"]').text()).toContain("SVG is not well-formed");
  });
});

describe("useUnsavedGuard", () => {
  function host(dirty = ref(false), value = ref("")) {
    let api!: ReturnType<typeof useUnsavedGuard>;
    const C = defineComponent({
      setup() {
        api = useUnsavedGuard(dirty, { draftKey: "k", value });
        return () => h("div");
      },
    });
    const w = mount(C, { global });
    return { w, api: () => api, dirty, value };
  }

  it("blocks unload only while dirty", () => {
    const { dirty } = host();
    const e1 = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(e1);
    expect(e1.defaultPrevented).toBe(false);
    dirty.value = true;
    const e2 = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(e2);
    expect(e2.defaultPrevented).toBe(true);
    dirty.value = false;
  });

  it("keeps a draft while dirty and clears it on demand", async () => {
    const { api, dirty, value } = host();
    dirty.value = true;
    value.value = "<svg/>";
    await nextTick();
    await new Promise((r) => setTimeout(r, 450));
    expect(api().draft()).toBe("<svg/>");
    api().clearDraft();
    expect(api().draft()).toBeNull();
    dirty.value = false;
  });

  it("removes its listeners on unmount", () => {
    const { w, dirty } = host();
    dirty.value = true;
    w.unmount();
    const e = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });
});
