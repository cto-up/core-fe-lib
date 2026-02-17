export async function getSecretFromFlow(
  flow: Record<string, unknown>
): Promise<string> {
  const ui = flow.ui as Record<string, unknown> | undefined;
  const nodes = (ui?.nodes || []) as Array<Record<string, unknown>>;

  for (const node of nodes) {
    if (node.group === "totp" && node.type === "text") {
      const attrs = node.attributes as Record<string, unknown> | undefined;
      const text = attrs?.text as Record<string, unknown> | undefined;
      if (text?.text) {
        return String(text.text);
      }
      const context = text?.context as Record<string, unknown> | undefined;
      if (context?.secret) {
        return String(context.secret);
      }
    }
  }

  return "";
}

export function extractRecoveryCodes(
  response: Record<string, unknown>
): string[] {
  const ui = response.ui as Record<string, unknown> | undefined;
  const nodes = (ui?.nodes || []) as Array<Record<string, unknown>>;

  // Method 1: lookup_secret_codes node
  const codesNode = nodes.find(
    (n) =>
      (n.attributes as Record<string, unknown>)?.name === "lookup_secret_codes"
  );

  if (codesNode) {
    const attrs = codesNode.attributes as Record<string, unknown>;
    const text = attrs?.text as Record<string, unknown> | undefined;
    if (text?.text) {
      const codes = String(text.text)
        .split(",")
        .map((c: string) => c.trim());
      if (codes.length > 0 && codes[0] !== "") {
        console.log("✅ Extracted codes from text.text:", codes);
        return codes;
      }
    }
  }

  // Method 2: text node in lookup_secret group
  const textNode = nodes.find(
    (n) => n.group === "lookup_secret" && n.type === "text"
  );

  if (textNode) {
    const attrs = textNode.attributes as Record<string, unknown>;
    const text = attrs?.text as Record<string, unknown> | undefined;
    if (text?.text) {
      const codes = String(text.text)
        .split(",")
        .map((c: string) => c.trim());
      if (codes.length > 0 && codes[0] !== "") {
        console.log("✅ Extracted codes from text node:", codes);
        return codes;
      }
    }

    // Method 3: context.secrets
    const context = text?.context as Record<string, unknown> | undefined;
    if (
      context?.secrets &&
      Array.isArray(context.secrets) &&
      context.secrets.length > 0
    ) {
      console.log("✅ Extracted codes from context.secrets:", context.secrets);
      return context.secrets as string[];
    }
  }

  // Method 4: any node with recovery codes
  for (const node of nodes) {
    if (node.group === "lookup_secret") {
      const attrs = node.attributes as Record<string, unknown>;
      const text = attrs?.text as Record<string, unknown> | undefined;
      const context = text?.context as Record<string, unknown> | undefined;
      if (context?.secrets) {
        console.log("✅ Found codes in node.attributes.text.context.secrets");
        return context.secrets as string[];
      }
      if (text?.text) {
        const textStr = String(text.text);
        if (textStr.includes(",")) {
          const codes = textStr.split(",").map((c: string) => c.trim());
          console.log(
            "✅ Found codes in node.attributes.text.text (comma-separated)"
          );
          return codes;
        }
      }
    }
  }

  console.error("❌ No recovery codes found in response:", {
    nodes: nodes.map((n) => ({
      group: n.group,
      type: n.type,
      name: (n.attributes as Record<string, unknown>)?.name,
      hasText: !!(n.attributes as Record<string, unknown>)?.text,
      textKeys: (n.attributes as Record<string, unknown>)?.text
        ? Object.keys((n.attributes as Record<string, unknown>).text as object)
        : [],
    })),
  });

  return [];
}
