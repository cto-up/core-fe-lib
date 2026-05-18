<template>
  <div class="border rounded-md overflow-hidden">
    <div class="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
      <Button
        v-for="action in activeToolbarActions"
        :key="action.name"
        size="sm"
        :variant="action.isActive() ? 'default' : 'ghost'"
        class="h-8 w-8 p-0"
        @click="action.handler"
      >
        <Icon v-if="action.icon" :name="action.icon" class="h-4 w-4" />
        <span v-else class="text-xs font-semibold">{{ action.label }}</span>
      </Button>
    </div>

    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none p-4 min-h-[200px]"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "../ui/button";

const props = defineProps({
  initialContent: {
    type: String,
    required: true,
    default: "<em>editable text</em>",
  },
  activeButtons: {
    type: Array as () => string[],
    default: () => ["bold", "italic"],
  },
});

const emit = defineEmits(["update"]);

const editor = ref<Editor | null>(null);

const toolbarActions = computed(() => [
  {
    name: "bold",
    icon: "bold",
    isActive: () => editor.value?.isActive("bold") ?? false,
    handler: () => editor.value?.chain().focus().toggleBold().run(),
  },
  {
    name: "italic",
    icon: "italic",
    isActive: () => editor.value?.isActive("italic") ?? false,
    handler: () => editor.value?.chain().focus().toggleItalic().run(),
  },
  {
    name: "strike",
    icon: "strikethrough",
    isActive: () => editor.value?.isActive("strike") ?? false,
    handler: () => editor.value?.chain().focus().toggleStrike().run(),
  },
  {
    name: "underline",
    icon: "underline",
    isActive: () => editor.value?.isActive("underline") ?? false,
    handler: () => editor.value?.chain().focus().toggleUnderline().run(),
  },
  {
    name: "code",
    icon: "code",
    isActive: () => editor.value?.isActive("code") ?? false,
    handler: () => editor.value?.chain().focus().toggleCode().run(),
  },
  {
    name: "h1",
    label: "H1",
    isActive: () => editor.value?.isActive("heading", { level: 1 }) ?? false,
    handler: () =>
      editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    name: "h2",
    label: "H2",
    isActive: () => editor.value?.isActive("heading", { level: 2 }) ?? false,
    handler: () =>
      editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    name: "h3",
    label: "H3",
    isActive: () => editor.value?.isActive("heading", { level: 3 }) ?? false,
    handler: () =>
      editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    name: "bulletList",
    icon: "list",
    isActive: () => editor.value?.isActive("bulletList") ?? false,
    handler: () => editor.value?.chain().focus().toggleBulletList().run(),
  },
  {
    name: "orderedList",
    icon: "list-ordered",
    isActive: () => editor.value?.isActive("orderedList") ?? false,
    handler: () => editor.value?.chain().focus().toggleOrderedList().run(),
  },
  {
    name: "blockquote",
    icon: "quote",
    isActive: () => editor.value?.isActive("blockquote") ?? false,
    handler: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
  {
    name: "codeBlock",
    icon: "code-2",
    isActive: () => editor.value?.isActive("codeBlock") ?? false,
    handler: () => editor.value?.chain().focus().toggleCodeBlock().run(),
  },
  {
    name: "horizontalRule",
    icon: "minus",
    isActive: () => false,
    handler: () => editor.value?.chain().focus().setHorizontalRule().run(),
  },
  {
    name: "undo",
    icon: "undo",
    isActive: () => false,
    handler: () => editor.value?.chain().focus().undo().run(),
  },
  {
    name: "redo",
    icon: "redo",
    isActive: () => false,
    handler: () => editor.value?.chain().focus().redo().run(),
  },
]);

const activeToolbarActions = computed(() => {
  return toolbarActions.value.filter((btn) =>
    props.activeButtons.includes(btn.name)
  );
});

onMounted(() => {
  editor.value = new Editor({
    content: props.initialContent,
    extensions: [
      StarterKit,
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    onUpdate: () => {
      emit("update", editor.value?.getHTML() ?? "");
    },
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style>
.ProseMirror:focus {
  outline: none;
}
</style>
