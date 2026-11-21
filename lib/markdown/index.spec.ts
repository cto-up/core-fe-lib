import { describe, expect, it } from "vitest";
import { fromMarkdown, toMarkdown } from "./index";

const roundTrip = (md: string) => toMarkdown(fromMarkdown(md));

// Every element the editor offers in Markdown mode, in the serializer's own
// (canonical) spelling.
const FIXTURE = [
  "# Refunds",
  "Refund a customer within **120 days**, *politely* and ~~quickly~~ — see [Card disputes](/kb/p/42) or `REF-1`.",
  "## Who approves",
  "| Amount | Approver |\n| --- | --- |\n| Up to €500 | Support **agent** |\n| A \\| B | Finance |",
  "### Steps",
  "1. Open the charge\n2. Choose **Refund**\n\n   Paste the ticket number.",
  "- one\n- two\n  - nested",
  "> Never refund after a chargeback.\n>\n> Ask Finance.",
  "```sql\nSELECT 1;\n```",
  "---",
  "#### Fine print",
  "Line one\\\nline two",
].join("\n\n");

describe("Markdown round trip", () => {
  it("keeps every supported element unchanged", () => {
    expect(roundTrip(FIXTURE)).toBe(FIXTURE);
  });

  it("is stable once normalised", () => {
    const loose =
      "Intro\nwrapped line\n\n* star list\n* second\n\n__bold__ and _em_";
    const once = roundTrip(loose);
    expect(once).toBe(
      "Intro wrapped line\n\n- star list\n- second\n\n**bold** and *em*"
    );
    expect(roundTrip(once)).toBe(once);
  });
});

describe("toMarkdown", () => {
  it("keeps one marker across neighbouring text and puts spaces outside it", () => {
    expect(
      toMarkdown({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "a " },
              { type: "text", text: "bold ", marks: [{ type: "bold" }] },
              {
                type: "text",
                text: "and italic",
                marks: [{ type: "bold" }, { type: "italic" }],
              },
              { type: "text", text: " end" },
            ],
          },
        ],
      })
    ).toBe("a **bold *and italic*** end");
  });

  it("escapes Markdown characters and a line that would start a block", () => {
    expect(
      toMarkdown({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "# not a title, *no* [link]" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "- not a list" }],
          },
        ],
      })
    ).toBe("\\# not a title, \\*no\\* \\[link\\]\n\n\\- not a list");
    expect(roundTrip("\\# not a title, \\*no\\* \\[link\\]")).toBe(
      "\\# not a title, \\*no\\* \\[link\\]"
    );
  });
});

describe("fromMarkdown", () => {
  it("never turns raw HTML into markup", () => {
    const doc = fromMarkdown("<script>alert(1)</script>");
    expect(JSON.stringify(doc)).not.toContain('"type":"script"');
    expect(toMarkdown(doc)).toContain("<script>");
  });

  it("caps headings at level 4 and keeps a code block's language", () => {
    const doc = fromMarkdown("###### Deep\n\n```ts\nconst a = 1\n```");
    expect(doc.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 4 },
    });
    expect(doc.content?.[1]).toMatchObject({
      type: "codeBlock",
      attrs: { language: "ts" },
    });
  });
});
