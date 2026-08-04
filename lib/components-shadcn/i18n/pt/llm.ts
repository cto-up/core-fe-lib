export default {
  select: {
    placeholder: "Selecionar um modelo…",
    loading: "A carregar…",
    empty:
      "Nenhum modelo disponível — adicione uma chave em Fornecedores de IA",
    noKey: {
      badge: "sem chave",
      tooltip:
        "Não há nenhuma chave API configurada para este fornecedor — as execuções que o usem irão falhar.",
      selected:
        "Este modelo está guardado neste registo, mas não há nenhuma chave API configurada para {provider}, pelo que as execuções que o usem irão falhar. Adicione uma chave em Fornecedores de IA ou escolha outro modelo.",
    },
    price: {
      free: "local · gratuito",
      unknown: "—",
      perMillion: "{input} entrada / {output} saída por M",
    },
    stats: {
      reliability: "F",
      formatting: "M",
      approval: "★",
      tooltip: {
        header: "Últimos 30 dias · {samples} chamada(s) · {votes} voto(s)",
        reliability: "Fiabilidade: {value} (chamadas concluídas)",
        formatting: "Formatação: {value} (JSON correto à primeira)",
        approval: "Aprovação: {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
