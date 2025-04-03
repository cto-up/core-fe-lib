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
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export default {
  name: 'MarkdownEditor',
  components: {
    EditorContent,
  },
  props: {
    initialContent: {
      type: String,
      required: true,
      default: '<em>editable text</em>',
    },
    activeButtons: {
      type: Array,
      default: () => ['bold', 'italic'],
    },
  },
  emits: ['update'],
  data() {
    return {
      editor: null,
    };
  },
  computed: {
    toolbarActions() {
      return [
        {
          name: 'bold',
          icon: 'format_bold',
          //label: 'B',
          isActive: () => this.editor?.isActive('bold'),
          handler: () => this.editor.chain().focus().toggleBold().run(),
        },
        {
          name: 'italic',
          icon: 'format_italic',
          //label: 'I',
          isActive: () => this.editor?.isActive('italic'),
          handler: () => this.editor.chain().focus().toggleItalic().run(),
        },
        {
          name: 'strike',
          icon: 'format_strikethrough',
          //label: 'S',
          isActive: () => this.editor?.isActive('strike'),
          handler: () => this.editor.chain().focus().toggleStrike().run(),
        },
        {
          name: 'underline',
          icon: 'format_underlined',
          //label: 'U',
          isActive: () => this.editor?.isActive('underline'),
          handler: () => this.editor.chain().focus().toggleUnderline().run(),
        },
        {
          name: 'code',
          icon: 'code',
          //label: '{}',
          isActive: () => this.editor?.isActive('code'),
          handler: () => this.editor.chain().focus().toggleCode().run(),
        },
        {
          name: 'h1',
          //icon: 'title',
          label: 'H1',
          isActive: () => this.editor?.isActive('heading', { level: 1 }),
          handler: () =>
            this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
          name: 'h2',
          //icon: 'title',
          label: 'H2',
          isActive: () => this.editor?.isActive('heading', { level: 2 }),
          handler: () =>
            this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          name: 'h3',
          //icon: 'title',
          label: 'H3',
          isActive: () => this.editor?.isActive('heading', { level: 3 }),
          handler: () =>
            this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          name: 'bulletList',
          icon: 'format_list_bulleted',
          //label: '•',
          isActive: () => this.editor?.isActive('bulletList'),
          handler: () => this.editor.chain().focus().toggleBulletList().run(),
        },
        {
          name: 'orderedList',
          icon: 'format_list_numbered',
          //label: '1.',
          isActive: () => this.editor?.isActive('orderedList'),
          handler: () => this.editor.chain().focus().toggleOrderedList().run(),
        },
        {
          name: 'blockquote',
          icon: 'format_quote',
          //label: '❝',
          isActive: () => this.editor?.isActive('blockquote'),
          handler: () => this.editor.chain().focus().toggleBlockquote().run(),
        },
        {
          name: 'codeBlock',
          icon: 'code',
          //label: '</>',
          isActive: () => this.editor?.isActive('codeBlock'),
          handler: () => this.editor.chain().focus().toggleCodeBlock().run(),
        },
        {
          name: 'horizontalRule',
          icon: 'remove',
          //label: '─',
          isActive: () => false,
          handler: () => this.editor.chain().focus().setHorizontalRule().run(),
        },
        {
          name: 'undo',
          icon: 'undo',
          //label: '↺',
          isActive: () => false,
          handler: () => this.editor.chain().focus().undo().run(),
        },
        {
          name: 'redo',
          icon: 'redo',
          //label: '↻',
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
        Markdown,
        Table.configure({
          resizable: true, // Allows table resizing
        }),
        TableRow,
        TableCell,
        TableHeader,
      ],
    });

    this.editor.on('update', () => {
      this.$emit('update', this.editor.storage.markdown.getMarkdown());
    });
  },
  beforeUnmount() {
    this.editor.destroy();
  },
};
</script>
<style lang="scss">
.ProseMirror:focus {
  outline: none;
}
</style>
