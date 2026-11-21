import markdownit from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type { JSONContent } from "@tiptap/core";

/**
 * Markdown in and out of the Tiptap editor, for a fixed set of elements:
 * paragraph, headings 1–4, bold, italic, strike, inline code, link, code block
 * (with language), blockquote, bullet and ordered lists, horizontal rule, hard
 * break and GFM tables with inline content. Anything else has no Markdown form
 * and is not offered by the editor in Markdown mode.
 */

type Mark = { type: string; attrs?: Record<string, unknown> };
const MARK_ORDER = ["link", "bold", "italic", "strike"];
const OPEN: Record<string, (m: Mark) => string> = {
  link: () => "[",
  bold: () => "**",
  italic: () => "*",
  strike: () => "~~",
};
const CLOSE: Record<string, (m: Mark) => string> = {
  link: (m) => `](${String(m.attrs?.href ?? "")})`,
  bold: () => "**",
  italic: () => "*",
  strike: () => "~~",
};

const sameMark = (a: Mark, b: Mark) =>
  a.type === b.type && (a.type !== "link" || a.attrs?.href === b.attrs?.href);

function escapeText(text: string, inTable: boolean): string {
  const out = text.replace(/[\\`*_[\]~]/g, "\\$&");
  return inTable ? out.replace(/\|/g, "\\|") : out;
}

// inline serializes a block's inline children, keeping a mark open across
// neighbouring text nodes and moving spaces outside the markers.
function inline(nodes: JSONContent[] = [], inTable = false): string {
  let out = "";
  const open: Mark[] = [];
  const closeTo = (keep: number) => {
    const spaces = out.match(/ +$/)?.[0] ?? "";
    out = out.slice(0, out.length - spaces.length);
    while (open.length > keep)
      out += CLOSE[open[open.length - 1].type](open.pop()!);
    out += spaces;
  };
  for (const node of nodes) {
    if (node.type === "hardBreak") {
      closeTo(0);
      // A line break inside a paragraph is a plain newline, as typed.
      out += "\n";
      continue;
    }
    const marks = (node.marks ?? []) as Mark[];
    const code = marks.some((m) => m.type === "code");
    const wanted = marks
      .filter((m) => m.type !== "code" && OPEN[m.type])
      .sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
    let keep = 0;
    while (
      keep < open.length &&
      keep < wanted.length &&
      sameMark(open[keep], wanted[keep])
    )
      keep++;
    closeTo(keep);
    let text = node.text ?? "";
    const lead = text.match(/^ +/)?.[0] ?? "";
    if (keep < wanted.length && lead) {
      out += lead;
      text = text.slice(lead.length);
    }
    for (const m of wanted.slice(keep)) {
      out += OPEN[m.type](m);
      open.push(m);
    }
    if (code) {
      const fence = text.includes("`") ? "``" : "`";
      out += `${fence}${text}${fence}`;
    } else out += escapeText(text, inTable);
  }
  closeTo(0);
  return out;
}

const indent = (text: string, prefix: string, first = prefix) =>
  text
    .split("\n")
    .map(
      (line, i) => (i === 0 ? first : line ? prefix : prefix.trimEnd()) + line
    )
    .join("\n");

function escapeBlockStart(text: string): string {
  return text.replace(/^(#{1,6} |>|[-+*] |\d+[.)] )/, "\\$1");
}

function block(node: JSONContent): string {
  const kids = node.content ?? [];
  switch (node.type) {
    case "paragraph":
      return escapeBlockStart(inline(kids));
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inline(kids)}`;
    case "codeBlock": {
      const text = kids.map((k) => k.text ?? "").join("");
      return `\`\`\`${String(node.attrs?.language ?? "")}\n${text}\n\`\`\``;
    }
    case "blockquote":
      return indent(blocks(kids), "> ");
    case "horizontalRule":
      return "---";
    case "bulletList":
      return kids
        .map((item) => indent(itemBlocks(item.content ?? []), "  ", "- "))
        .join("\n");
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1);
      return kids
        .map((item, i) => {
          const marker = `${start + i}. `;
          return indent(
            itemBlocks(item.content ?? []),
            " ".repeat(marker.length),
            marker
          );
        })
        .join("\n");
    }
    case "table": {
      const rows = kids.map((row) =>
        (row.content ?? []).map((cell) =>
          (cell.content ?? [])
            .map((p) => inline(p.content ?? [], true))
            .join(" ")
        )
      );
      if (!rows.length) return "";
      const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
      return [
        line(rows[0]),
        line(rows[0].map(() => "---")),
        ...rows.slice(1).map(line),
      ].join("\n");
    }
    default:
      return inline(kids);
  }
}

function blocks(nodes: JSONContent[]): string {
  return nodes.map(block).join("\n\n");
}

// itemBlocks keeps a list item tight: a sub-list follows its paragraph on the
// next line instead of after a blank one.
function itemBlocks(nodes: JSONContent[]): string {
  return nodes
    .map(
      (n, i) =>
        (i === 0 ? "" : /List$/.test(n.type ?? "") ? "\n" : "\n\n") + block(n)
    )
    .join("");
}

/** toMarkdown serializes an editor document (editor.getJSON()). */
export function toMarkdown(doc: JSONContent): string {
  const content = [...(doc.content ?? [])];
  // The editor keeps an empty paragraph after a closing block (a code block,
  // a table) so the caret can leave it; it is not part of the text.
  while (content.length > 1 && isEmptyParagraph(content[content.length - 1]))
    content.pop();
  return blocks(content);
}

function isEmptyParagraph(node: JSONContent): boolean {
  return node.type === "paragraph" && !(node.content ?? []).length;
}

const md = markdownit({ html: false, linkify: false });

/** fromMarkdown parses Markdown into an editor document (editor.setContent). */
export function fromMarkdown(markdown: string): JSONContent {
  const tokens = md.parse(markdown, {});
  const root: JSONContent = { type: "doc", content: [] };
  const stack: JSONContent[] = [root];
  const top = () => stack[stack.length - 1];
  const push = (node: JSONContent) => {
    (top().content ??= []).push(node);
    stack.push(node);
  };
  const add = (node: JSONContent) => (top().content ??= []).push(node);

  for (const tok of tokens) {
    switch (tok.type) {
      case "paragraph_open":
        push({ type: "paragraph" });
        break;
      case "heading_open":
        push({
          type: "heading",
          attrs: { level: Math.min(4, Number(tok.tag.slice(1))) },
        });
        break;
      case "blockquote_open":
        push({ type: "blockquote" });
        break;
      case "bullet_list_open":
        push({ type: "bulletList" });
        break;
      case "ordered_list_open":
        push({
          type: "orderedList",
          attrs: { start: Number(tok.attrGet("start") ?? 1) },
        });
        break;
      case "list_item_open":
        push({ type: "listItem" });
        break;
      case "table_open":
        push({ type: "table" });
        break;
      case "tr_open":
        push({ type: "tableRow" });
        break;
      case "th_open":
      case "td_open":
        push({ type: tok.type === "th_open" ? "tableHeader" : "tableCell" });
        push({ type: "paragraph" });
        break;
      case "th_close":
      case "td_close":
        stack.pop();
        stack.pop();
        break;
      case "paragraph_close":
      case "heading_close":
      case "blockquote_close":
      case "bullet_list_close":
      case "ordered_list_close":
      case "list_item_close":
      case "table_close":
      case "tr_close":
        stack.pop();
        break;
      case "fence":
      case "code_block": {
        const text = tok.content.replace(/\n$/, "");
        add({
          type: "codeBlock",
          attrs: { language: tok.info.trim() || null },
          ...(text ? { content: [{ type: "text", text }] } : {}),
        });
        break;
      }
      case "hr":
        add({ type: "horizontalRule" });
        break;
      case "inline": {
        const content = inlineNodes(tok.children ?? []);
        if (content.length) (top().content ??= []).push(...content);
        break;
      }
    }
  }
  return root;
}

function inlineNodes(children: Token[]): JSONContent[] {
  const out: JSONContent[] = [];
  const marks: Mark[] = [];
  const text = (t: string, extra: Mark[] = []) => {
    if (!t) return;
    const all = [...marks, ...extra];
    out.push(
      all.length
        ? { type: "text", text: t, marks: all.map((m) => ({ ...m })) }
        : { type: "text", text: t }
    );
  };
  const pop = (type: string) => {
    const i = marks.map((m) => m.type).lastIndexOf(type);
    if (i >= 0) marks.splice(i, 1);
  };
  for (const tok of children) {
    switch (tok.type) {
      case "text":
        text(tok.content);
        break;
      // A single newline is a line break, as the author typed it (Notion,
      // chat), not a space as CommonMark would have it.
      case "softbreak":
      case "hardbreak":
        out.push({ type: "hardBreak" });
        break;
      case "code_inline":
        text(tok.content, [{ type: "code" }]);
        break;
      case "strong_open":
        marks.push({ type: "bold" });
        break;
      case "em_open":
        marks.push({ type: "italic" });
        break;
      case "s_open":
        marks.push({ type: "strike" });
        break;
      case "link_open":
        marks.push({
          type: "link",
          attrs: { href: tok.attrGet("href") ?? "" },
        });
        break;
      case "strong_close":
        pop("bold");
        break;
      case "em_close":
        pop("italic");
        break;
      case "s_close":
        pop("strike");
        break;
      case "link_close":
        pop("link");
        break;
      case "image":
        text(tok.content);
        break;
    }
  }
  return out;
}
