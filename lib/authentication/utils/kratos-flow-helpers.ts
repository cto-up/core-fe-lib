export async function getSecretFromFlow(flow: any): Promise<string> {
  // Look through all nodes to find the secret key
  // Kratos provides it in a text node with id "totp_secret_key"
  const nodes = flow.ui?.nodes || [];

  for (const node of nodes) {
    if (node.group === "totp" && node.type === "text") {
      // The secret is in attributes.text.text or attributes.text.context.secret
      if (node.attributes?.text?.text) {
        return node.attributes.text.text;
      }
      if (node.attributes?.text?.context?.secret) {
        return node.attributes.text.context.secret;
      }
    }
  }

  return "";
}

export function extractRecoveryCodes(response: any): string[] {
  // Recovery codes can be in different places depending on Kratos version
  // Try multiple extraction methods

  // Method 1: Look for lookup_secret_codes node with text
  const codesNode = response.ui?.nodes?.find(
    (n: any) => n.attributes?.name === "lookup_secret_codes"
  );

  if (codesNode?.attributes?.text?.text) {
    const codes = codesNode.attributes.text.text
      .split(",")
      .map((c: string) => c.trim());
    if (codes.length > 0 && codes[0] !== "") {
      console.log("✅ Extracted codes from text.text:", codes);
      return codes;
    }
  }

  // Method 2: Look for text node in lookup_secret group
  const textNode = response.ui?.nodes?.find(
    (n: any) => n.group === "lookup_secret" && n.type === "text"
  );

  if (textNode?.attributes?.text?.text) {
    const codes = textNode.attributes.text.text
      .split(",")
      .map((c: string) => c.trim());
    if (codes.length > 0 && codes[0] !== "") {
      console.log("✅ Extracted codes from text node:", codes);
      return codes;
    }
  }

  // Method 3: Look in text.context.secrets (array format)
  if (textNode?.attributes?.text?.context?.secrets) {
    const codes = textNode.attributes.text.context.secrets;
    if (Array.isArray(codes) && codes.length > 0) {
      console.log("✅ Extracted codes from context.secrets:", codes);
      return codes;
    }
  }

  // Method 4: Look for any node with recovery codes in various formats
  for (const node of response.ui?.nodes || []) {
    if (node.group === "lookup_secret") {
      // Check for codes in various attribute paths
      const attrs = node.attributes;
      if (attrs?.text?.context?.secrets) {
        console.log("✅ Found codes in node.attributes.text.context.secrets");
        return attrs.text.context.secrets;
      }
      if (attrs?.text?.text) {
        const text = attrs.text.text;
        if (typeof text === "string" && text.includes(",")) {
          const codes = text.split(",").map((c: string) => c.trim());
          console.log(
            "✅ Found codes in node.attributes.text.text (comma-separated)"
          );
          return codes;
        }
      }
    }
  }

  console.error("❌ No recovery codes found in response:", {
    nodes: response.ui?.nodes?.map((n: any) => ({
      group: n.group,
      type: n.type,
      name: n.attributes?.name,
      hasText: !!n.attributes?.text,
      textKeys: n.attributes?.text ? Object.keys(n.attributes.text) : [],
    })),
  });

  return [];
}
