export default {
  select: {
    placeholder: "Seleccionar un modelo…",
    loading: "Cargando…",
    empty: "Ningún modelo disponible — añada una clave en Proveedores de IA",
    noKey: {
      badge: "sin clave",
      tooltip:
        "No hay ninguna clave API configurada para este proveedor: las ejecuciones que lo usen fallarán.",
      selected:
        "Este modelo está guardado en este registro, pero no hay ninguna clave API configurada para {provider}, por lo que las ejecuciones que lo usen fallarán. Añada una clave en Proveedores de IA o elija otro modelo.",
    },
    price: {
      free: "local · gratis",
      unknown: "—",
      perMillion: "{input} entrada / {output} salida por M",
    },
    stats: {
      reliability: "F",
      formatting: "M",
      approval: "★",
      tooltip: {
        header: "Últimos 30 días · {samples} llamada(s) · {votes} voto(s)",
        reliability: "Fiabilidad: {value} (llamadas completadas)",
        formatting: "Formato: {value} (JSON correcto al primer intento)",
        approval: "Aprobación: {value} (👍 ÷ 👍+👎)",
      },
    },
  },
};
