export type Modality = "text" | "image" | "audio" | "video" | "file";

export interface ModalityCarrier {
  llm_key: string;
  effective_input_modalities?: Modality[];
  effective_output_modalities?: Modality[];
}

/**
 * True when the model can read every `input` and produce every `output`, on
 * its EFFECTIVE lists. An entry that does not say is not assumed to serve.
 */
export function servesModalities(
  entry: ModalityCarrier,
  input?: readonly Modality[],
  output?: readonly Modality[]
): boolean {
  const reads = entry.effective_input_modalities ?? [];
  const produces = entry.effective_output_modalities ?? [];
  return (
    (input ?? []).every((m) => reads.includes(m)) &&
    (output ?? []).every((m) => produces.includes(m))
  );
}

/**
 * Narrow a list to the models that serve the modalities asked for. The saved
 * value is kept whatever it serves, for the same reason an unreachable one is:
 * dropping it would empty the picker and let the next save rewrite the model.
 */
export function filterByModalities<T extends ModalityCarrier>(
  entries: readonly T[],
  input?: readonly Modality[],
  output?: readonly Modality[],
  currentKey?: string
): T[] {
  if (!input?.length && !output?.length) return [...entries];
  return entries.filter(
    (e) =>
      (currentKey && e.llm_key === currentKey) ||
      servesModalities(e, input, output)
  );
}

/** Output worth an icon: every model produces text, so text alone says nothing. */
export function producesMedia(entry: ModalityCarrier): boolean {
  return (entry.effective_output_modalities ?? []).some((m) => m !== "text");
}
