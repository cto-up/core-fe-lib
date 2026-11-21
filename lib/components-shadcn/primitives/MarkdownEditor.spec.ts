// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import type { Editor } from "@tiptap/vue-3";
import { createI18n } from "vue-i18n";
import { EditorView } from "@codemirror/view";
import MarkdownEditor from "./MarkdownEditor.vue";
import editorMessages from "../i18n/en-US/editor";
import {
  matchSlash,
  slashQuery,
  type SlashItem,
} from "./markdown-editor/slash";
import { moveBlock } from "./markdown-editor/blocks";

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
const i18n = () =>
  createI18n({
    legacy: false,
    locale: "en-US",
    messages: { "en-US": { editor: editorMessages } },
  });
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
      global: { stubs, plugins: [i18n()] },
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
      global: { stubs, plugins: [i18n()] },
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

  it("reads a slash query only where a word starts, and filters by label, key or keyword", () => {
    expect(slashQuery("Text /hea")).toBe("hea");
    expect(slashQuery("/")).toBe("");
    expect(slashQuery("a/b")).toBeNull();
    const items = [
      { key: "h2", label: "Heading 2", keywords: ["title"] },
      { key: "tasks", label: "Task list" },
    ] as SlashItem[];
    expect(matchSlash(items, "tit").map((i) => i.key)).toEqual(["h2"]);
    expect(matchSlash(items, "").length).toBe(2);
  });

  it("opens a / menu with the built-in formats and the consumer's items, and runs the chosen one", async () => {
    const ran: { from: number; to: number }[] = [];
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "Intro",
        format: "markdown",
        slash: true,
        slashItems: [
          {
            key: "tasks",
            label: "Task list",
            group: "Insert",
            run: (_e, r) => ran.push(r),
          },
        ],
      },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    const editor = editorOf(w);
    editor.commands.focus("end");
    editor.commands.insertContent(" /head");
    await nextTick();
    const menu = () => document.body.querySelector('[data-test="slash-menu"]');
    expect(menu()?.textContent).toContain("Heading 2");
    expect(menu()?.textContent).not.toContain("Task list");
    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await nextTick();
    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 2 },
    });
    expect(editor.getText().trim()).toBe("Intro");

    editor.commands.focus("end");
    editor.commands.insertContent(" /task");
    await nextTick();
    (
      document.body.querySelector(
        '[data-test="slash-item-tasks"]'
      ) as HTMLElement
    ).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(ran).toHaveLength(1);
    expect(editor.state.doc.textBetween(ran[0].from, ran[0].to)).toBe("/task");
    w.unmount();
  });

  it("edits the raw Markdown as one change and shows it back in Visual", async () => {
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "Old **text**, see [Refunds](/kb/p/42).",
        format: "markdown",
        rawToggle: true,
        linkMarker: (href: string) =>
          href.startsWith("/kb/p/") ? "page" : null,
      },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    await w.get('[data-test="md-mode-markdown"]').trigger("click");
    await nextTick();
    const cm = EditorView.findFromDOM(
      w.get('[data-test="markdown-source"] .cm-editor').element as HTMLElement
    )!;
    expect(cm.state.doc.toString()).toBe(
      "Old **text**, see [Refunds](/kb/p/42)."
    );
    const content = w.get(".cm-content").text();
    expect(content).toContain("[Refunds]");
    expect(content).not.toContain("/kb/p/42");
    expect(
      w.findAll('[data-test="markdown-link-marker"]').map((m) => m.text())
    ).toEqual(["page"]);

    cm.dispatch({
      changes: { from: 0, to: cm.state.doc.length, insert: "## New\n\nBody." },
    });
    await w.get('[data-test="md-mode-visual"]').trigger("click");
    const editor = editorOf(w);
    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 2 },
    });
    expect((w.emitted("update:markdown")?.at(-1) as [string])[0]).toBe(
      "## New\n\nBody."
    );
    expect(w.find('[data-test="markdown-source"]').exists()).toBe(false);
    w.unmount();
  });

  it("offers table edits in / only inside a table, and lists tips with the consumer's", async () => {
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "Intro",
        format: "markdown",
        slash: true,
        rawToggle: true,
        tips: [{ keys: "[[", label: "Link a page" }],
      },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    const editor = editorOf(w);
    const menu = () => document.body.querySelector('[data-test="slash-menu"]');
    editor.commands.focus("end");
    editor.commands.insertContent(" /table");
    await nextTick();
    expect(menu()?.textContent).toContain("Table");
    expect(menu()?.textContent).not.toContain("Add a row below");
    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await nextTick();
    expect(editor.isActive("table")).toBe(true);
    editor.commands.insertContent("/row");
    await nextTick();
    expect(menu()?.textContent).toContain("Add a row below");

    await w.get('[data-test="md-help"]').trigger("click");
    const help = w.get('[data-test="md-help-panel"]').text();
    expect(help).toContain("Insert a heading, list, table, link");
    expect(help).toContain("Link a page");
    w.unmount();
  });

  it("renders a code block of a registered language through its view and keeps the others as code", async () => {
    const Card = {
      props: ["code", "update", "remove"],
      template: `<div data-test="card">{{ code }}<button data-test="edit" @click="update('board: mine')" /></div>`,
    };
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "```tasks\nstatus: TODO\n```\n\n```sql\nSELECT 1;\n```",
        format: "markdown",
        codeBlockViews: { tasks: Card },
      },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();
    expect(w.get('[data-test="card"]').text()).toBe("status: TODO");
    expect(w.find("pre code").text()).toContain("SELECT 1;");
    await w.get('[data-test="edit"]').trigger("click");
    await nextTick();
    expect((w.emitted("update:markdown")?.at(-1) as [string])[0]).toBe(
      "```tasks\nboard: mine\n```\n\n```sql\nSELECT 1;\n```"
    );
    w.unmount();
  });

  it("moves a top-level block up and down, keeping the caret in it", async () => {
    const w = mount(MarkdownEditor, {
      props: {
        initialContent: "One\n\nTwo\n\nThree",
        format: "markdown",
        blockHandles: true,
      },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    const editor = editorOf(w);
    const twoAt = 6;
    expect(moveBlock(editor, twoAt, -1)).toBe(true);
    expect(editor.getText({ blockSeparator: "|" })).toBe("Two|One|Three");
    expect(editor.state.selection.$from.parent.textContent).toBe("Two");
    expect(moveBlock(editor, editor.state.selection.from, -1)).toBe(false);
    expect(moveBlock(editor, editor.state.selection.from, 1)).toBe(true);
    expect(moveBlock(editor, editor.state.selection.from, 1)).toBe(true);
    expect(editor.getText({ blockSeparator: "|" })).toBe("One|Three|Two");
    w.unmount();
  });

  it("in document mode has no frame and shows its toolbar only while editing", async () => {
    const w = mount(MarkdownEditor, {
      props: { initialContent: "x", format: "markdown", variant: "document" },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    expect(w.classes()).not.toContain("border");
    expect(w.get('[data-test="md-toolbar"]').classes()).toEqual(
      expect.arrayContaining(["hidden", "group-focus-within/md:flex", "sticky"])
    );
    w.unmount();
  });

  it("keeps a / menu dismissed with Esc closed through other changes until the caret leaves it", async () => {
    const w = mount(MarkdownEditor, {
      props: { initialContent: "Intro", format: "markdown", slash: true },
      global: { stubs, plugins: [i18n()] },
      attachTo: document.body,
    });
    await nextTick();
    const editor = editorOf(w);
    const menu = () => document.body.querySelector('[data-test="slash-menu"]');
    editor.commands.focus("end");
    editor.commands.insertContent(" /");
    await nextTick();
    expect(menu()).not.toBeNull();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(menu()).toBeNull();
    editor.view.dispatch(editor.state.tr.setMeta("remote", true));
    await nextTick();
    expect(menu()).toBeNull();
    editor.commands.insertContent(" /");
    await nextTick();
    expect(menu()).not.toBeNull();
    w.unmount();
  });
});
