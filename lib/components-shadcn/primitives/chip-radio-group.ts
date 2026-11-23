export interface ChipOption {
  value: string;
  label: string;
  /** Names the chip's id and data-test (`<idPrefix>-<key>`); value by default. */
  key?: string;
  /** A short line beside the option in the search results ("30 min"). */
  hint?: string;
}

/** Words without case, accents or punctuation, each after a space. */
const words = (s: string) =>
  " " +
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** A match starts a word: "board" finds "Board or committee meeting", not
 * "Onboarding welcome"; "reunion" finds "Réunion générale". */
export function startsAWord(text: string, query: string): boolean {
  const q = words(query).trim();
  return !q || words(text).includes(` ${q}`);
}
