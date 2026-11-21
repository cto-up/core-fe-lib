import { reactive } from "vue";
import { Extension, type Editor } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

// topBlockAt is the start of the top-level block holding pos, or null.
export function topBlockAt(
  editor: Editor,
  pos: number
): { from: number; size: number } | null {
  const $pos = editor.state.doc.resolve(
    Math.min(pos, editor.state.doc.content.size)
  );
  if ($pos.depth < 1) {
    const node = editor.state.doc.nodeAt(pos);
    return node ? { from: pos, size: node.nodeSize } : null;
  }
  const from = $pos.before(1);
  const node = editor.state.doc.nodeAt(from);
  return node ? { from, size: node.nodeSize } : null;
}

// moveBlock swaps the top-level block at pos with its neighbour (dir -1 up,
// +1 down), keeping the caret in it; false when it cannot move.
export function moveBlock(editor: Editor, pos: number, dir: -1 | 1): boolean {
  const block = topBlockAt(editor, pos);
  if (!block) return false;
  const { doc } = editor.state;
  const node = doc.nodeAt(block.from)!;
  const offset = pos - block.from;
  if (dir === -1) {
    if (block.from === 0) return false;
    const prev = doc.resolve(block.from).nodeBefore;
    if (!prev) return false;
    const to = block.from - prev.nodeSize;
    const tr = editor.state.tr
      .delete(block.from, block.from + block.size)
      .insert(to, node);
    tr.setSelection(TextSelection.near(tr.doc.resolve(to + offset)));
    editor.view.dispatch(tr.scrollIntoView());
    return true;
  }
  const end = block.from + block.size;
  const next = doc.nodeAt(end);
  if (!next) return false;
  const tr = editor.state.tr.delete(block.from, end);
  const to = block.from + next.nodeSize;
  tr.insert(to, node);
  tr.setSelection(TextSelection.near(tr.doc.resolve(to + offset)));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

// blockKeys: Alt+Shift+↑/↓ moves the block with the caret, the keyboard way
// to do what the grip does.
export const BlockKeys = Extension.create({
  name: "blockKeys",
  addKeyboardShortcuts() {
    return {
      "Alt-Shift-ArrowUp": () =>
        moveBlock(this.editor, this.editor.state.selection.from, -1),
      "Alt-Shift-ArrowDown": () =>
        moveBlock(this.editor, this.editor.state.selection.from, 1),
    };
  },
});

// useBlockHandle follows the pointer to the top-level block under it, for
// a + (insert below) and a grip (drag to move), as in lms LessonWysiwyg.
export function useBlockHandle() {
  const state = reactive({ visible: false, top: 0, from: 0 });
  let editor: Editor | null = null;

  function attach(ed: Editor) {
    editor = ed;
  }

  function track(e: MouseEvent, host: HTMLElement) {
    if (!editor) return;
    const root = editor.view.dom as HTMLElement;
    let el = e.target as HTMLElement | null;
    while (el && el.parentElement !== root) el = el.parentElement;
    if (!el) return;
    const pos = editor.view.posAtDOM(el, 0);
    const block = topBlockAt(editor, pos);
    if (!block) return;
    state.from = block.from;
    state.top =
      el.getBoundingClientRect().top - host.getBoundingClientRect().top;
    state.visible = true;
  }

  function insertBelow() {
    if (!editor) return;
    const node = editor.state.doc.nodeAt(state.from);
    if (!node) return;
    const at = state.from + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(at, { type: "paragraph" })
      .setTextSelection(at + 1)
      .insertContent("/")
      .run();
  }

  function dragStart(e: DragEvent) {
    if (!editor || !e.dataTransfer) return;
    const { view } = editor;
    const sel = NodeSelection.create(view.state.doc, state.from);
    view.dispatch(view.state.tr.setSelection(sel));
    const dom = view.nodeDOM(state.from) as HTMLElement | null;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sel.node.textContent);
    if (dom) e.dataTransfer.setDragImage(dom, 0, 0);
    // ProseMirror moves the slice it is told is being dragged on drop.
    (view as unknown as { dragging: unknown }).dragging = {
      slice: sel.content(),
      move: true,
    };
  }

  return { state, attach, track, insertBelow, dragStart };
}
