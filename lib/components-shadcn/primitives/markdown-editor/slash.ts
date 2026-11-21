import { reactive, type Component } from "vue";
import { Extension, type Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import {
  Columns3,
  Rows3,
  Table,
  Trash2,
  Code2,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
} from "lucide-vue-next";

// SlashItem is one entry of the "/" menu: run gets the "/query" range to
// replace (lms RichTextBlock's slash menu, shared).
export interface SlashItem {
  key: string;
  label: string;
  icon?: Component;
  group?: string;
  keywords?: string[];
  run(editor: Editor, range: { from: number; to: number }): void;
}

const TRIGGER = /(?:^|\s)\/([\w-]{0,30})$/;

// slashQuery is what follows a "/" that starts a word, just before the caret.
export function slashQuery(textBefore: string): string | null {
  return TRIGGER.exec(textBefore)?.[1] ?? null;
}

export function matchSlash(items: SlashItem[], q: string): SlashItem[] {
  const query = q.toLowerCase();
  return items.filter(
    (it) =>
      !query ||
      it.label.toLowerCase().includes(query) ||
      it.key.toLowerCase().includes(query) ||
      (it.keywords ?? []).some((k) => k.toLowerCase().includes(query))
  );
}

// formatSlashItems are the built-in "/" entries: what Markdown can carry.
export function formatSlashItems(
  t: (key: string) => string,
  group: string
): SlashItem[] {
  const block =
    (fn: (e: Editor) => void) =>
    (e: Editor, range: { from: number; to: number }) => {
      e.chain().focus().deleteRange(range).run();
      fn(e);
    };
  return [
    {
      key: "h2",
      label: t("editor.slash.heading2"),
      icon: Heading2,
      group,
      keywords: ["heading", "title"],
      run: block((e) => e.chain().focus().setHeading({ level: 2 }).run()),
    },
    {
      key: "h3",
      label: t("editor.slash.heading3"),
      icon: Heading3,
      group,
      keywords: ["heading", "subtitle"],
      run: block((e) => e.chain().focus().setHeading({ level: 3 }).run()),
    },
    {
      key: "bullet",
      label: t("editor.slash.bulletList"),
      icon: List,
      group,
      keywords: ["list", "ul"],
      run: block((e) => e.chain().focus().toggleBulletList().run()),
    },
    {
      key: "numbered",
      label: t("editor.slash.orderedList"),
      icon: ListOrdered,
      group,
      keywords: ["list", "ol"],
      run: block((e) => e.chain().focus().toggleOrderedList().run()),
    },
    {
      key: "quote",
      label: t("editor.slash.quote"),
      icon: Quote,
      group,
      keywords: ["blockquote"],
      run: block((e) => e.chain().focus().toggleBlockquote().run()),
    },
    {
      key: "code",
      label: t("editor.slash.codeBlock"),
      icon: Code2,
      group,
      keywords: ["pre"],
      run: block((e) => e.chain().focus().toggleCodeBlock().run()),
    },
    {
      key: "divider",
      label: t("editor.slash.divider"),
      icon: Minus,
      group,
      keywords: ["hr", "rule"],
      run: block((e) => e.chain().focus().setHorizontalRule().run()),
    },
    {
      key: "table",
      label: t("editor.slash.table"),
      icon: Table,
      group,
      keywords: ["grid", "columns"],
      run: block((e) =>
        e
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      ),
    },
  ];
}

// tableSlashItems are offered while the caret is in a table.
export function tableSlashItems(
  t: (key: string) => string,
  group: string
): SlashItem[] {
  const edit =
    (fn: (e: Editor) => void) =>
    (e: Editor, range: { from: number; to: number }) => {
      e.chain().focus().deleteRange(range).run();
      fn(e);
    };
  const item = (
    key: string,
    label: string,
    icon: Component,
    fn: (e: Editor) => void
  ): SlashItem => ({
    key,
    label: t(label),
    icon,
    group,
    keywords: ["table"],
    run: edit(fn),
  });
  return [
    item("row", "editor.slash.addRow", Rows3, (e) =>
      e.chain().focus().addRowAfter().run()
    ),
    item("column", "editor.slash.addColumn", Columns3, (e) =>
      e.chain().focus().addColumnAfter().run()
    ),
    item("delete-row", "editor.slash.deleteRow", Trash2, (e) =>
      e.chain().focus().deleteRow().run()
    ),
    item("delete-column", "editor.slash.deleteColumn", Trash2, (e) =>
      e.chain().focus().deleteColumn().run()
    ),
    item("delete-table", "editor.slash.deleteTable", Trash2, (e) =>
      e.chain().focus().deleteTable().run()
    ),
  ];
}

// useSlashMenu opens the menu while "/query" sits before the caret, filters
// items(), and takes the arrow keys, Enter and Esc while open.
export function useSlashMenu(items: () => SlashItem[]) {
  const state = reactive({
    open: false,
    query: "",
    from: 0,
    to: 0,
    x: 0,
    y: 0,
    active: 0,
    hits: [] as SlashItem[],
  });
  let editor: Editor | null = null;
  // The "/" the author dismissed with Esc stays closed until the caret
  // leaves it; other transactions (collaboration) must not reopen it.
  let dismissedAt: number | null = null;

  function close() {
    state.open = false;
  }

  function dismiss() {
    if (state.open) dismissedAt = state.from;
    close();
  }

  function detect() {
    if (!editor) return;
    const { $from, empty } = editor.state.selection;
    const before = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 40),
      $from.parentOffset,
      undefined,
      "￼"
    );
    const q =
      empty && $from.parent.type.name !== "codeBlock"
        ? slashQuery(before)
        : null;
    if (q === null) {
      dismissedAt = null;
      return close();
    }
    const from = $from.pos - q.length - 1;
    if (from === dismissedAt) return close();
    state.query = q;
    state.from = from;
    state.to = $from.pos;
    state.hits = matchSlash(items(), q);
    if (state.active >= state.hits.length) state.active = 0;
    const at = editor.view.coordsAtPos($from.pos);
    state.x = at.left;
    state.y = at.bottom + 4;
    state.open = true;
  }

  function choose(item: SlashItem | undefined) {
    if (!editor || !item) return;
    const range = { from: state.from, to: state.to };
    close();
    item.run(editor, range);
  }

  const extension = Extension.create({
    name: "slashMenu",
    // Before the default Enter (split block) and arrow keys.
    priority: 1000,
    addProseMirrorPlugins: () => [
      new Plugin({
        props: {
          handleKeyDown(_view, e) {
            if (!state.open || !state.hits.length) return false;
            const n = state.hits.length;
            if (e.key === "ArrowDown") state.active = (state.active + 1) % n;
            else if (e.key === "ArrowUp")
              state.active = (state.active - 1 + n) % n;
            else if (e.key === "Enter") choose(state.hits[state.active]);
            else if (e.key === "Escape") dismiss();
            else return false;
            return true;
          },
        },
      }),
    ],
  });

  // Esc closes the menu wherever focus went (the + beside a block opens it).
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && state.open) dismiss();
  };

  function attach(ed: Editor) {
    editor = ed;
    ed.on("transaction", detect);
    ed.on("blur", close);
    window.addEventListener("keydown", onEscape);
    ed.on("destroy", () => window.removeEventListener("keydown", onEscape));
  }

  return { state, extension, attach, choose, close };
}
