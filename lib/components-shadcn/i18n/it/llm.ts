export default {
  select: {
    placeholder: "Seleziona un modello…",
    loading: "Caricamento…",
    empty: "Nessun modello disponibile — aggiungi una chiave in Fornitori IA",
    noKey: {
      badge: "senza chiave",
      tooltip:
        "Nessuna chiave API configurata per questo fornitore: le esecuzioni che lo usano falliranno.",
      selected:
        "Questo modello è salvato su questa scheda, ma non è configurata alcuna chiave API per {provider}, quindi le esecuzioni che lo usano falliranno. Aggiungi una chiave in Fornitori IA o scegli un altro modello.",
    },
    price: {
      free: "locale · gratuito",
      unknown: "—",
      perMillion: "{input} ingresso / {output} uscita per M",
    },
    stats: {
      reliability: "A",
      formatting: "F",
      approval: "★",
      tooltip: {
        header: "Ultimi 30 giorni · {samples} chiamata/e · {votes} voto/i",
        reliability: "Affidabilità: {value} (chiamate completate)",
        formatting: "Formattazione: {value} (JSON corretto al primo tentativo)",
        approval: "Approvazione: {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
