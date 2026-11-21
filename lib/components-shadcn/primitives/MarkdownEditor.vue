<template>
  <div
    :class="
      document
        ? 'md-doc group/md relative'
        : 'border rounded-md overflow-hidden'
    "
  >
    <div
      v-if="(rawToggle && markdown) || tips.length"
      class="relative mb-2 flex items-center justify-end gap-1"
    >
      <button
        type="button"
        class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        :aria-label="t('editor.tips.title')"
        :aria-expanded="helpOpen"
        :title="t('editor.tips.title')"
        data-test="md-help"
        @mousedown.prevent
        @click="helpOpen = !helpOpen"
      >
        <CircleHelp class="h-4 w-4" />
      </button>
      <div
        v-if="helpOpen"
        class="absolute right-0 top-full z-20 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-3 text-sm shadow-ambient"
        role="dialog"
        :aria-label="t('editor.tips.title')"
        data-test="md-help-panel"
        @keydown.esc="helpOpen = false"
      >
        <p class="mb-2 font-semibold">{{ t("editor.tips.title") }}</p>
        <dl class="space-y-1.5">
          <div v-for="tip in allTips" :key="tip.keys" class="flex gap-3">
            <dt class="w-28 shrink-0 font-mono text-xs text-muted-foreground">
              {{ tip.keys }}
            </dt>
            <dd>{{ tip.label }}</dd>
          </div>
        </dl>
      </div>
      <div
        v-if="rawToggle && markdown"
        role="group"
        :aria-label="t('editor.view')"
        class="inline-flex rounded-md bg-muted p-0.5 text-xs"
      >
        <button
          type="button"
          class="rounded px-2 py-1"
          :class="!raw ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          :aria-pressed="!raw"
          data-test="md-mode-visual"
          @mousedown.prevent
          @click="setRaw(false)"
        >
          {{ t("editor.visual") }}
        </button>
        <button
          type="button"
          class="rounded px-2 py-1"
          :class="raw ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          :aria-pressed="raw"
          data-test="md-mode-markdown"
          @mousedown.prevent
          @click="setRaw(true)"
        >
          {{ t("editor.markdown") }}
        </button>
      </div>
    </div>
    <div
      v-show="!raw"
      :class="
        document
          ? 'sticky top-0 z-10 mb-2 hidden flex-wrap items-center gap-0.5 rounded-md border bg-background/95 p-0.5 shadow-ambient backdrop-blur group-focus-within/md:flex'
          : 'flex flex-wrap gap-1 p-2 border-b bg-muted/50'
      "
      data-test="md-toolbar"
    >
      <Button
        v-for="action in activeToolbarActions"
        :key="action.name"
        size="sm"
        :variant="action.isActive() ? 'default' : 'ghost'"
        :class="document ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'"
        :aria-label="action.label ?? action.name"
        @mousedown.prevent
        @click="action.handler"
      >
        <Icon v-if="action.icon" :name="action.icon" class="h-4 w-4" />
        <span v-else class="text-xs font-semibold">{{ action.label }}</span>
      </Button>
      <template v-if="markdown && editor?.isActive('table')">
        <span class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              size="sm"
              variant="ghost"
              class="h-7 gap-1 px-2 text-xs"
              data-test="md-table-menu"
              @mousedown.prevent
            >
              <TableIcon class="h-4 w-4" />
              {{ t("editor.table.label") }}
              <ChevronDown class="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            @close-auto-focus.prevent="refocus"
          >
            <template v-for="action in tableActions" :key="action.name">
              <DropdownMenuSeparator v-if="action.danger" />
              <DropdownMenuItem
                :class="
                  action.danger
                    ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
                    : ''
                "
                :data-test="`md-table-${action.name}`"
                @select="action.run()"
              >
                <component :is="action.icon" class="mr-2 h-4 w-4" />
                {{ action.label }}
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
      <slot name="toolbar-end" :editor="editor" />
    </div>

    <RawMarkdownView
      v-if="raw"
      v-model="rawText"
      :link-marker="linkMarker"
      @focus="rawFocused = true"
      @blur="rawFocused = false"
    />
    <div
      v-show="!raw"
      ref="surface"
      class="relative"
      :class="blockHandles ? 'pl-12' : ''"
      @mousemove="(e) => surface && handle.track(e, surface)"
      @mouseleave="handle.state.visible = false"
    >
      <div
        v-if="blockHandles && handle.state.visible"
        class="absolute left-0 z-10 flex items-center text-muted-foreground"
        :style="{ top: `${handle.state.top}px` }"
      >
        <button
          type="button"
          class="rounded p-0.5 hover:bg-muted hover:text-foreground"
          :aria-label="t('editor.addBlock')"
          :title="t('editor.addBlock')"
          data-test="md-block-add"
          @mousedown.prevent="handle.insertBelow()"
        >
          <Plus class="h-4 w-4" />
        </button>
        <button
          type="button"
          draggable="true"
          class="cursor-grab rounded p-0.5 hover:bg-muted hover:text-foreground"
          :aria-label="t('editor.dragBlock')"
          :title="t('editor.dragBlock')"
          data-test="md-block-grip"
          @dragstart="handle.dragStart"
        >
          <GripVertical class="h-4 w-4" />
        </button>
      </div>
      <EditorContent
        :editor="editor ?? undefined"
        :class="
          document
            ? 'prose max-w-none min-h-[12rem]'
            : 'prose prose-sm max-w-none p-4 min-h-[200px]'
        "
      />
    </div>
    <SlashMenu
      v-if="slash"
      :state="slashMenu.state"
      @choose="slashMenu.choose"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  computed,
  watch,
  type Component,
  type PropType,
  type Ref,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  CircleHelp,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  ChevronDown,
  Columns3,
  GripVertical,
  Plus,
  Rows3,
  Table as TableIcon,
  Trash2,
} from "lucide-vue-next";
import { CodeBlock, type CodeBlockOptions } from "@tiptap/extension-code-block";
import type { AnyExtension, JSONContent } from "@tiptap/core";
import { Editor, EditorContent, VueNodeViewRenderer } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { fromMarkdown, toMarkdown } from "../../markdown";
import CodeBlockView from "./markdown-editor/CodeBlockView.vue";
import RawMarkdownView from "./markdown-editor/RawMarkdownView.vue";
import SlashMenu from "./markdown-editor/SlashMenu.vue";
import { BlockKeys, useBlockHandle } from "./markdown-editor/blocks";
import {
  formatSlashItems,
  tableSlashItems,
  useSlashMenu,
  type SlashItem,
} from "./markdown-editor/slash";

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
  // "markdown": initialContent is Markdown, the editor offers only what
  // Markdown can carry, and it emits update:markdown. "html" is unchanged.
  format: {
    type: String as PropType<"html" | "markdown">,
    default: "html",
  },
  // Markdown mode: start from this editor document instead of parsing
  // initialContent, so editors edited together share one starting point.
  initialDoc: {
    type: Object as PropType<JSONContent | null>,
    default: null,
  },
  // More Tiptap extensions, appended (a collaboration plugin, a page link).
  extensions: {
    type: Array as PropType<AnyExtension[]>,
    default: () => [],
  },
  // "document": no frame, the toolbar shows only while editing, sticky and
  // compact (lms RichTextBlock). "boxed" is unchanged.
  variant: {
    type: String as PropType<"boxed" | "document">,
    default: "boxed",
  },
  // A "/" menu: the built-in formatting entries, then slashItems.
  slash: { type: Boolean, default: false },
  slashItems: {
    type: Array as PropType<SlashItem[]>,
    default: () => [],
  },
  // Markdown mode: a Visual | Markdown switch to edit the raw source.
  rawToggle: { type: Boolean, default: false },
  // A + and a drag grip beside each top-level block; Alt+Shift+↑/↓ moves it.
  blockHandles: { type: Boolean, default: false },
  // Code blocks of these languages render through the component, given
  // { code, update(code), remove() }; the Markdown is unchanged.
  codeBlockViews: {
    type: Object as PropType<Record<string, Component>>,
    default: () => ({}),
  },
  // More lines for the ? list (how to invoke what the consumer adds).
  tips: {
    type: Array as PropType<{ keys: string; label: string }[]>,
    default: () => [],
  },
  // Markdown view: a short marker shown instead of a link target it names.
  linkMarker: {
    type: Function as PropType<(href: string) => string | null>,
    default: undefined,
  },
});

const emit = defineEmits<{
  update: [html: string];
  "update:markdown": [markdown: string, doc: JSONContent];
}>();
const markdown = computed(() => props.format === "markdown");
const document = computed(() => props.variant === "document");
const { t } = useI18n();
const slashMenu = useSlashMenu(() => [
  ...(editor.value?.isActive("table")
    ? tableSlashItems(t, t("editor.slash.inTable"))
    : []),
  ...formatSlashItems(t, t("editor.slash.format")),
  ...props.slashItems,
]);
// While the caret is in a table, the toolbar's Table menu changes its shape,
// each action in words (office#181).
const tableActions = computed(() => {
  const chain = () => editor.value!.chain().focus();
  return [
    {
      name: "add-row",
      label: t("editor.slash.addRow"),
      icon: BetweenHorizontalEnd,
      run: () => chain().addRowAfter().run(),
    },
    {
      name: "add-column",
      label: t("editor.slash.addColumn"),
      icon: BetweenVerticalEnd,
      run: () => chain().addColumnAfter().run(),
    },
    {
      name: "delete-row",
      label: t("editor.slash.deleteRow"),
      icon: Rows3,
      run: () => chain().deleteRow().run(),
    },
    {
      name: "delete-column",
      label: t("editor.slash.deleteColumn"),
      icon: Columns3,
      run: () => chain().deleteColumn().run(),
    },
    {
      name: "delete-table",
      label: t("editor.slash.deleteTable"),
      icon: Trash2,
      danger: true,
      run: () => chain().deleteTable().run(),
    },
  ];
});
// Back to the cell once the Table menu has closed and given focus away.
function refocus() {
  setTimeout(() => {
    if (editor.value && !editor.value.isDestroyed)
      editor.value.commands.focus();
  });
}
const helpOpen = ref(false);
// The ? list: what the editor itself offers, then the consumer's tips.
const allTips = computed(() => [
  ...(props.slash ? [{ keys: "/", label: t("editor.tips.slash") }] : []),
  { keys: "## · - · 1. · >", label: t("editor.tips.markdown") },
  { keys: "**b** · *i* · `c`", label: t("editor.tips.inline") },
  ...(props.blockHandles
    ? [{ keys: "Alt+Shift+↑/↓", label: t("editor.tips.move") }]
    : []),
  { keys: "Tab", label: t("editor.tips.tableTab") },
  ...props.tips,
]);
const handle = useBlockHandle();
const surface = ref<HTMLElement | null>(null);
const raw = ref(false);
const rawText = ref("");
const rawFocused = ref(false);
let applyingRaw = false;
let rawTimer: ReturnType<typeof setTimeout> | undefined;

// The raw source applies to the document as one change, so collaborators and
// undo see it like any edit.
function applyRaw() {
  clearTimeout(rawTimer);
  const ed = editor.value;
  if (!ed || toMarkdown(ed.getJSON()) === rawText.value) return;
  applyingRaw = true;
  ed.commands.setContent(fromMarkdown(rawText.value), { emitUpdate: true });
  applyingRaw = false;
}

function setRaw(on: boolean) {
  if (on === raw.value || !editor.value) return;
  if (on) rawText.value = toMarkdown(editor.value.getJSON());
  else applyRaw();
  raw.value = on;
}

watch(rawText, () => {
  if (!raw.value) return;
  clearTimeout(rawTimer);
  rawTimer = setTimeout(applyRaw, 300);
});
// Underline has no Markdown form.
const NOT_IN_MARKDOWN = ["underline"];

// shallowRef: a deep ref would wrap ProseMirror's state in proxies, which
// breaks plugins that compare it by identity (collaboration).
const editor = shallowRef<Editor | null>(null) as Ref<Editor | null>;

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
  return toolbarActions.value.filter(
    (btn) =>
      props.activeButtons.includes(btn.name) &&
      !(markdown.value && NOT_IN_MARKDOWN.includes(btn.name))
  );
});

onMounted(() => {
  editor.value = markdown.value
    ? new Editor({
        content: props.initialDoc ?? fromMarkdown(props.initialContent),
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3, 4] },
            underline: false,
            link: { openOnClick: false },
            codeBlock: Object.keys(props.codeBlockViews).length ? false : {},
          }),
          ...(Object.keys(props.codeBlockViews).length
            ? [
                CodeBlock.extend<
                  CodeBlockOptions & { views: Record<string, Component> }
                >({
                  addOptions() {
                    return {
                      ...(this.parent?.() as CodeBlockOptions),
                      views: {} as Record<string, Component>,
                    };
                  },
                  addNodeView() {
                    return VueNodeViewRenderer(CodeBlockView);
                  },
                }).configure({ views: props.codeBlockViews }),
              ]
            : []),
          ...(props.slash ? [slashMenu.extension] : []),
          ...(props.blockHandles ? [BlockKeys] : []),
          Table,
          TableRow,
          TableCell,
          TableHeader,
          ...props.extensions,
        ],
        onUpdate: () => {
          const doc = editor.value?.getJSON() ?? { type: "doc" };
          const md = toMarkdown(doc);
          // Someone else's change while the raw source is shown, not typed in.
          if (raw.value && !applyingRaw && !rawFocused.value)
            rawText.value = md;
          emit("update:markdown", md, doc);
        },
      })
    : new Editor({
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
          ...props.extensions,
        ],
        onUpdate: () => {
          emit("update", editor.value?.getHTML() ?? "");
        },
      });
});

watch(editor, (ed) => {
  if (!ed) return;
  if (props.slash) slashMenu.attach(ed);
  if (props.blockHandles) handle.attach(ed);
});

onBeforeUnmount(() => {
  clearTimeout(rawTimer);
  editor.value?.destroy();
});

defineExpose({ editor });
</script>

<style>
.ProseMirror:focus {
  outline: none;
}
</style>
