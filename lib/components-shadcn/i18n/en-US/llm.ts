export default {
  select: {
    placeholder: "Select a model…",
    loading: "Loading…",
    // The list only offers models the workspace holds a credential for, so an
    // empty one is a configuration state with an action, not a failure.
    empty: "No model available — add a key under AI Providers",
    noKey: {
      badge: "no key",
      tooltip:
        "No API key is configured for this provider — runs using it will fail.",
      // Shown under the select when the SAVED value is the unreachable one.
      // That entry is deliberately kept in the list (dropping it would let the
      // next save silently rewrite the stored model), which is why one unusable
      // model can appear while others are filtered out. Say so.
      selected:
        "This model is saved on this record, but no API key is configured for {provider}, so runs using it will fail. Add a key under AI Providers, or pick another model.",
    },
    price: {
      free: "local · free",
      unknown: "—",
      perMillion: "{input} in / {output} out per M",
    },
    stats: {
      reliability: "R",
      formatting: "F",
      approval: "★",
      tooltip: {
        header: "Last 30 days · {samples} call(s) · {votes} vote(s)",
        reliability: "Reliability: {value} (calls that completed)",
        formatting: "Formatting: {value} (clean JSON on first try)",
        approval: "User approval: {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
