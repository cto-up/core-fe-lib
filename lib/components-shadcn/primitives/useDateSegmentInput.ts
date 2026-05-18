import { ref, computed, nextTick, watch } from "vue";

export interface Segment {
  len: number;
  placeholder: string;
  /** Auto-pad to full width and advance if the first typed digit exceeds this value */
  autoAdvanceOver?: number;
}

export function useDateSegmentInput(
  getModelValue: () => string | undefined,
  emitFn: (val: string) => void,
  segments: Segment[],
  separators: string[],
  parseValue: (val: string) => string[],
  buildValue: (segs: string[]) => string | null
) {
  const segValues = ref<string[]>(segments.map(() => ""));
  const activeSegIdx = ref(0);
  const typedCount = ref(0);
  const lastEmitted = ref(getModelValue() ?? "");

  function initFromValue(val?: string) {
    if (!val) {
      segValues.value = segments.map(() => "");
      return;
    }
    const parsed = parseValue(val);
    segValues.value = segments.map((_, i) => parsed[i] ?? "");
  }

  initFromValue(getModelValue());

  watch(getModelValue, (val) => {
    if (val === lastEmitted.value) return;
    lastEmitted.value = val ?? "";
    initFromValue(val);
  });

  // Build display string: each segment shows its value or placeholder
  const display = computed(() =>
    segments
      .map((seg, i) => segValues.value[i] || seg.placeholder)
      .reduce((acc, val, i) => (i === 0 ? val : acc + separators[i - 1] + val))
  );

  // Character start position of segment i in the display string
  function segStart(i: number): number {
    let pos = 0;
    for (let j = 0; j < i; j++) pos += segments[j].len + separators[j].length;
    return pos;
  }
  function segEnd(i: number): number {
    return segStart(i) + segments[i].len;
  }

  const inputRef = ref<HTMLInputElement>();

  function selectSeg(i: number) {
    const idx = Math.max(0, Math.min(i, segments.length - 1));
    activeSegIdx.value = idx;
    typedCount.value = 0;
    nextTick(() => {
      inputRef.value?.setSelectionRange(segStart(idx), segEnd(idx));
    });
  }

  function onFocus() {
    // Re-select active segment on focus
    nextTick(() => {
      inputRef.value?.setSelectionRange(
        segStart(activeSegIdx.value),
        segEnd(activeSegIdx.value)
      );
    });
  }

  function onClick() {
    // Detect which segment the click landed in and select it
    nextTick(() => {
      const pos = inputRef.value?.selectionStart ?? 0;
      for (let i = 0; i < segments.length; i++) {
        if (pos <= segEnd(i)) {
          selectSeg(i);
          return;
        }
      }
      selectSeg(segments.length - 1);
    });
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) return;

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      typeDigit(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (e.key === "Delete") {
      e.preventDefault();
      segValues.value[activeSegIdx.value] = "";
      typedCount.value = 0;
      nextTick(() =>
        inputRef.value?.setSelectionRange(
          segStart(activeSegIdx.value),
          segEnd(activeSegIdx.value)
        )
      );
      emitValue();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (activeSegIdx.value > 0) selectSeg(activeSegIdx.value - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (activeSegIdx.value < segments.length - 1)
        selectSeg(activeSegIdx.value + 1);
    } else if (e.key === "Tab") {
      return; // let Tab navigate naturally
    } else {
      e.preventDefault();
    }
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";
    if (!text) return;
    const parsed = parseValue(text);
    if (parsed.some(Boolean)) {
      segValues.value = segments.map((_, i) => parsed[i] ?? "");
      emitValue();
      selectSeg(segments.length - 1);
    }
  }

  function typeDigit(d: string) {
    const seg = segments[activeSegIdx.value];

    if (typedCount.value === 0) {
      segValues.value[activeSegIdx.value] = d;
    } else {
      segValues.value[activeSegIdx.value] += d;
    }
    typedCount.value++;

    // Auto-pad and advance if first digit can't form a valid 2-digit value
    if (typedCount.value === 1 && seg.autoAdvanceOver !== undefined) {
      if (parseInt(d) > seg.autoAdvanceOver) {
        segValues.value[activeSegIdx.value] = d.padStart(seg.len, "0");
        emitValue();
        advance();
        return;
      }
    }

    // Auto-advance when segment is full
    if (typedCount.value >= seg.len) {
      emitValue();
      advance();
    } else {
      nextTick(() =>
        inputRef.value?.setSelectionRange(
          segStart(activeSegIdx.value),
          segEnd(activeSegIdx.value)
        )
      );
      emitValue();
    }
  }

  function advance() {
    if (activeSegIdx.value < segments.length - 1) {
      selectSeg(activeSegIdx.value + 1);
    } else {
      // Last segment — stay selected
      nextTick(() =>
        inputRef.value?.setSelectionRange(
          segStart(activeSegIdx.value),
          segEnd(activeSegIdx.value)
        )
      );
    }
  }

  function backspace() {
    const current = segValues.value[activeSegIdx.value];
    if (current.length > 0) {
      segValues.value[activeSegIdx.value] = current.slice(0, -1);
      typedCount.value = Math.max(0, typedCount.value - 1);
      nextTick(() =>
        inputRef.value?.setSelectionRange(
          segStart(activeSegIdx.value),
          segEnd(activeSegIdx.value)
        )
      );
      emitValue();
    } else if (activeSegIdx.value > 0) {
      selectSeg(activeSegIdx.value - 1);
    }
  }

  function emitValue() {
    const result = buildValue(segValues.value);
    lastEmitted.value = result ?? "";
    emitFn(result ?? "");
  }

  return { inputRef, display, onFocus, onClick, onKeydown, onPaste, selectSeg };
}
