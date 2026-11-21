// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import type { Editor } from "@tiptap/vue-3";
import MarkdownEditor from "./MarkdownEditor.vue";

const FIXTURE = [
  "# Refunds",
  "Within **120 days**, *politely*, ~~quickly~~, [disputes](/kb/p/42) and `REF-1`.",
  "| Amount | Approver |\n| --- | --- |\n| Up to €500 | Support |",
  "1. Open the charge\n2. Choose **Refund**",
  "- one\n  - nested",
  "> Ask Finance.",
  "```sql\nSELECT 1;\n```",
  "---",
  "#### Fine print",
].join("\n\n");

const stubs = { Icon: true };
const editorOf = (w: ReturnType<typeof mount>) =>
  (w.vm as unknown as { editor: Editor }).editor;

describe("MarkdownEditor", () => {
  it("in Markdown mode loads Markdown into the real schema and emits it back unchanged", async () => {
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: FIXTURE,
        format: "markdown",
        activeButtons: ["bold", "underline"],
      },
      global: { stubs },
      attachTo: document.body,
    });
    await nextTick();
    const editor = editorOf(w);
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: "paragraph",
      content: [{ type: "text", text: "End." }],
    });
    await nextTick();
    const [markdown, doc] = (w.emitted("update:markdown")?.at(-1) ?? []) as [
      string,
      unknown,
    ];
    expect(markdown).toBe(`${FIXTURE}\n\nEnd.`);
    expect(doc).toMatchObject({ type: "doc" });
    expect(w.emitted("update")).toBeUndefined();
    expect(w.findAll("button")).toHaveLength(1);
    w.unmount();
  });

  it("without a format behaves as before: HTML in, HTML out, underline offered", async () => {
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "<p>Hi</p>",
        activeButtons: ["bold", "underline"],
      },
      global: { stubs },
      attachTo: document.body,
    });
    await nextTick();
    editorOf(w).commands.insertContent(" there");
    await nextTick();
    expect(w.emitted("update")?.at(-1)?.[0]).toMatch(/^<p>.*there.*<\/p>$/);
    expect(w.emitted("update:markdown")).toBeUndefined();
    expect(w.findAll("button")).toHaveLength(2);
    w.unmount();
  });
});
