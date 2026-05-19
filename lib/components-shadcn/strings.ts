export function truncate(text: string, length: number) {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
}
