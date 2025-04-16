<template>
  <div class="editor">
    <div class="menubar q-pa-sm">
      <q-btn
        size="10px"
        v-for="action in toolbarActions"
        :key="action.name"
        :icon="action.icon"
        :label="action.label"
        :color="action.isActive() ? 'primary' : 'grey-1'"
        :class="{ 'is-active': action.isActive() }"
        @click="action.handler"
        flat
        dense
      />
    </div>

    <editor-content class="editor__content" :editor="editor" />
  </div>
</template>

<script>
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";

export default {
  name: "HTMLEditor",
  components: {
    EditorContent,
  },
  props: {
    initialContent: {
      type: String,
      required: true,
      default: "<p>Enter your content here...</p>",
    },
    activeButtons: {
      type: Array,
      default: () => ["bold", "italic", "link"],
    },
  },
  emits: ["update"],
  data() {
    return {
      editor: null,
    };
  },
  computed: {
    toolbarActions() {
      return [
        {
          name: "bold",
          icon: "format_bold",
          isActive: () => this.editor?.isActive("bold"),
          handler: () => this.editor.chain().focus().toggleBold().run(),
        },
        {
          name: "italic",
          icon: "format_italic",
          isActive: () => this.editor?.isActive("italic"),
          handler: () => this.editor.chain().focus().toggleItalic().run(),
        },
        {
          name: "underline",
          icon: "format_underlined",
          isActive: () => this.editor?.isActive("underline"),
          handler: () => this.editor.chain().focus().toggleUnderline().run(),
        },
        {
          name: "link",
          icon: "link",
          isActive: () => this.editor?.isActive("link"),
          handler: () => {
            const url = window.prompt("URL:");
            if (url) {
              this.editor.chain().focus().setLink({ href: url }).run();
            }
          },
        },
        {
          name: "align-left",
          icon: "format_align_left",
          isActive: () => this.editor?.isActive({ textAlign: "left" }),
          handler: () => this.editor.chain().focus().setTextAlign("left").run(),
        },
        {
          name: "align-center",
          icon: "format_align_center",
          isActive: () => this.editor?.isActive({ textAlign: "center" }),
          handler: () =>
            this.editor.chain().focus().setTextAlign("center").run(),
        },
        {
          name: "align-right",
          icon: "format_align_right",
          isActive: () => this.editor?.isActive({ textAlign: "right" }),
          handler: () =>
            this.editor.chain().focus().setTextAlign("right").run(),
        },
        {
          name: "table",
          icon: "table_chart",
          isActive: () => this.editor?.isActive("table"),
          handler: () =>
            this.editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        },
        {
          name: "undo",
          icon: "undo",
          isActive: () => false,
          handler: () => this.editor.chain().focus().undo().run(),
        },
        {
          name: "redo",
          icon: "redo",
          isActive: () => false,
          handler: () => this.editor.chain().focus().redo().run(),
        },
      ].filter((btn) => this.activeButtons.includes(btn.name));
    },
  },
  created() {
    this.editor = new Editor({
      content: this.initialContent,
      extensions: [
        StarterKit,
        Underline,
        Link,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
      ],
    });

    this.editor.on("update", () => {
      this.$emit("update", this.editor.getHTML());
    });
  },
  beforeUnmount() {
    this.editor.destroy();
  },
};
</script>

<style lang="scss">
.ProseMirror {
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;

  &:focus {
    outline: none;
    border-color: #1976d2;
  }

  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td,
    th {
      border: 2px solid #ced4da;
      box-sizing: border-box;
      min-width: 1em;
      padding: 3px 5px;
      position: relative;
      vertical-align: top;

      > * {
        margin-bottom: 0;
      }
    }
  }
}
</style>
