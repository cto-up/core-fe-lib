export default {
  select: {
    placeholder: "Choisir un modèle…",
    loading: "Chargement…",
    empty: "Aucun modèle disponible — ajoutez une clé dans Fournisseurs IA",
    noKey: {
      badge: "sans clé",
      tooltip:
        "Aucune clé API n'est configurée pour ce fournisseur — les exécutions qui l'utilisent échoueront.",
      selected:
        "Ce modèle est enregistré sur cette fiche, mais aucune clé API n'est configurée pour {provider} : les exécutions qui l'utilisent échoueront. Ajoutez une clé dans Fournisseurs IA, ou choisissez un autre modèle.",
    },
    price: {
      free: "local · gratuit",
      unknown: "—",
      perMillion: "{input} entrée / {output} sortie par M",
    },
    stats: {
      reliability: "F",
      formatting: "M",
      approval: "★",
      tooltip: {
        header: "30 derniers jours · {samples} appel(s) · {votes} vote(s)",
        reliability: "Fiabilité : {value} (appels aboutis)",
        formatting: "Mise en forme : {value} (JSON correct du premier coup)",
        approval: "Approbation : {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
