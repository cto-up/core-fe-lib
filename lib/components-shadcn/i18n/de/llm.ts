export default {
  select: {
    placeholder: "Modell auswählen…",
    loading: "Wird geladen…",
    empty:
      "Kein Modell verfügbar — fügen Sie unter KI-Anbieter einen Schlüssel hinzu",
    noKey: {
      badge: "kein Schlüssel",
      tooltip:
        "Für diesen Anbieter ist kein API-Schlüssel konfiguriert — Ausführungen damit schlagen fehl.",
      selected:
        "Dieses Modell ist auf diesem Datensatz gespeichert, aber für {provider} ist kein API-Schlüssel konfiguriert; Ausführungen damit schlagen fehl. Fügen Sie unter KI-Anbieter einen Schlüssel hinzu oder wählen Sie ein anderes Modell.",
    },
    price: {
      free: "lokal · kostenlos",
      unknown: "—",
      perMillion: "{input} Eingabe / {output} Ausgabe pro M",
    },
    stats: {
      reliability: "Z",
      formatting: "F",
      approval: "★",
      tooltip: {
        header: "Letzte 30 Tage · {samples} Aufruf(e) · {votes} Bewertung(en)",
        reliability: "Zuverlässigkeit: {value} (abgeschlossene Aufrufe)",
        formatting: "Formatierung: {value} (sauberes JSON beim ersten Versuch)",
        approval: "Nutzerzustimmung: {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
