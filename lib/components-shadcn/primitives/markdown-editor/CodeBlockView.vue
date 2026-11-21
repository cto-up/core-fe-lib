<template>
  <NodeViewWrapper as="div" class="md-code-block">
    <div v-if="view" contenteditable="false" data-test="md-block-view">
      <component
        :is="view"
        :code="node.textContent"
        :update="update"
        :remove="deleteNode"
      />
    </div>
    <pre v-else><NodeViewContent as="code" /></pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";

// A code block whose language has a view renders through it (a tasks block
// as a live card); any other stays code. The Markdown is unchanged.
const props = defineProps(nodeViewProps);
const view = computed(
  () =>
    (props.extension.options.views as Record<string, unknown>)[
      String(props.node.attrs.language ?? "")
    ]
);

function update(code: string) {
  const pos = props.getPos();
  if (typeof pos !== "number") return;
  const { schema, tr } = props.editor.state;
  const from = pos + 1;
  const to = pos + props.node.nodeSize - 1;
  props.editor.view.dispatch(
    code ? tr.replaceWith(from, to, schema.text(code)) : tr.delete(from, to)
  );
}
</script>
