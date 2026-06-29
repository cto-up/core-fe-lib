export default {
  info: {
    noData: "Nessun dato trovato...",
    notSpecified: "Non specificato",
  },
  notifications: {
    failed: "L'azione non è riuscita",
    success: "L'azione è riuscita",
  },
  tenantProfile: {
    title: "Impostazioni del profilo",
    displayName: "Nome visualizzato",
    companyName: "Nome dell'azienda",
    values: "Valori dell'azienda",
    tabs: {
      display: "Visualizzazione",
      company: "Azienda",
      pictures: "Immagini",
    },
    colors: {
      primary: "Colore principale",
      secondary: "Colore secondario",
      tertiary: "Colore terziario",
      background: "Colore di sfondo",
      accent: "Colore di accento",
      info: "Colore di informazione",
      positive: "Colore di successo",
      warning: "Colore di avviso",
      text: "Colore del testo",
    },
    themes: {
      light: "Tema chiaro",
      dark: "Tema scuro",
    },
    validation: {
      required: "Questo campo è obbligatorio",
      maxLength: "La lunghezza massima è di {n} caratteri",
      invalidFormat: "Formato non valido",
    },
    placeholders: {
      displayName: "Inserisci il nome visualizzato",
      companyName: "Inserisci il nome dell'azienda",
      values: "Inserisci i valori dell'azienda",
    },
  },
  apiToken: {
    name: "Token API",
    create: "Crea un token API",
    revoke: "Revoca il token",
    home: {
      title: "Token API",
      createLabel: "Crea un token",
    },
    detail: {
      title: "Dettagli del token API",
    },
    fields: {
      name: "Nome",
      description: "Descrizione",
      tokenPrefix: "Prefisso del token",
      expiresAt: "Data di scadenza",
      scopes: "Permessi",
      revokeReason: "Motivo della revoca",
      status: "Stato",
      lastUsed: "Ultimo utilizzo",
      lastUsedIp: "Ultimo IP utilizzato",
      token: "Token API",
    },
    copyWarning:
      "Importante: Copia questo token ora. Non potrai più vederlo in seguito!",
    usage: "Come usare questo token:",
    actions: {
      includeRevoked: "Includi i token revocati",
      includeExpired: "Includi i token scaduti",
      copyToken: "Copia il token",
      revoke: {
        label: "Revoca",
        confirm: "Sei sicuro di voler revocare il token %{name}?",
      },
      delete: {
        label: "Elimina",
        confirm: "Sei sicuro di voler eliminare il token %{name}?",
      },
    },
  },
  clientApplication: {
    name: "Applicazione client",
    home: {
      title: "Applicazioni client",
      createLabel: "Crea un'applicazione",
    },
    detail: {
      title: "Dettagli dell'applicazione client",
    },
    fields: {
      name: "Nome",
      description: "Descrizione",
      active: "Attiva",
      lastUsed: "Ultimo utilizzo",
      tokens: "Token API",
      createdAt: "Creata il",
      updatedAt: "Aggiornata il",
    },
    actions: {
      deactivate: {
        label: "Disattiva",
        confirm: "Sei sicuro di voler disattivare l'applicazione %{name}?",
      },
      delete: {
        label: "Elimina",
        confirm: "Sei sicuro di voler eliminare l'applicazione %{name}?",
      },
      manageTokens: "Gestisci i token",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Crea una configurazione globale",
    },
    detail: {
      title: "Configurazione globale",
    },
    fields: {
      name: "Nome",
      value: "Valore",
    },
    actions: {
      delete: {
        label: "Elimina",
        confirm:
          "Sei sicuro di voler eliminare la configurazione globale %{name}?",
      },
    },
  },
  tenantConfig: {
    name: "Configurazione del tenant",
    home: {
      title: "Configurazioni del tenant",
      createLabel: "Crea una configurazione del tenant",
    },
    detail: {
      title: "Configurazione del tenant",
    },
    fields: {
      name: "Nome",
      value: "Valore",
    },
    actions: {
      delete: {
        label: "Elimina",
        confirm:
          "Sei sicuro di voler eliminare la configurazione del tenant %{name}?",
      },
    },
  },
  tenant: {
    name: "Tenant",
    home: {
      title: "Tenant",
      createLabel: "Crea un tenant",
    },
    detail: {
      title: "Tenant",
    },
    fields: {
      tenantId: "Tenant Id",
      name: "Nome",
      subdomain: "Subdomain",
      enableEmailLinkSignIn: "Attiva il link di accesso tramite email",
      allowPasswordSignUp: "Consenti la registrazione tramite password",
      allowSignUp: "Consenti la registrazione",
    },
    actions: {
      delete: {
        label: "Elimina",
        confirm: "Sei sicuro di voler eliminare il tenant %{name}?",
      },
    },
    features: {
      title: "Funzionalità",
    },
  },
  role: {
    admin: "Admin",
    superAdmin: "Super Admin",
    customer_admin: "Amministratore del cliente",
    user: "Utente",
  },
  client: {
    name: "Nome",
    home: {
      title: "Clienti",
      createLabel: "Crea cliente",
    },
    detail: {
      title: "Cliente",
    },
    fields: {
      name: "Nome",
    },
    actions: {
      delete: {
        label: "Elimina",
        confirm: "Sei sicuro di voler eliminare il cliente %{name}?",
      },
    },
  },
  user: {
    home: {
      title: "Utenti",
      createLabel: "Crea",
    },
    detail: {
      title: "Utente",
      addUser: "Aggiungi un utente",
    },
    fields: {
      name: "Nome",
      email: "Email",
      password: "Password",
      roles: "Ruoli",
      commercialLevel: "Livello commerciale",
      tenantRoles: "Ruoli del tenant",
      globalRoles: "Ruoli globali",
    },
    status: {
      emailVerified: "Email verificata",
      enabled: "Attivato",
      updated: "Aggiornato",
    },
    validation: {
      invalidEmail: "Email non valida",
      rolesRequired:
        "Gli utenti possono avere più ruoli. Deve essere selezionato almeno un ruolo.",
      nameRequired: "Campo obbligatorio e lunghezza massima di 50",
    },
    actions: {
      delete: {
        confirm: "Sei sicuro di voler eliminare l'utente {name}?",
      },
      removeFromTenant: "Rimuovi dal tenant",
      checkEmail: "Verifica",
      checking: "Verifica in corso...",
    },
    messages: {
      emailPlaceholder: "Inserisci l'email per verificare se l'utente esiste",
      userFound: "Utente trovato: {name}",
      userFoundDescription:
        "Questo utente esiste ed è membro di {count} tenant. Seleziona i ruoli qui sotto per aggiungerlo a questo tenant.",
      alreadyMember: "Già membro",
      alreadyMemberDescription: "Questo utente è già membro di questo tenant.",
      editUser: "Modifica l'utente",
      userNotFound: "Utente non trovato",
      userNotFoundDescription:
        "Questa email non è registrata. Compila i dettagli qui sotto per creare un nuovo utente.",
    },
    roleDescriptions: {
      admin: "Accesso completo al tenant",
      customerAdmin: "Accesso amministrativo",
      user: "Accesso utente standard",
      superAdmin: "Accesso completo al sistema",
    },
  },
  userProfile: {
    title: "Profilo utente",
    fields: {
      name: "Nome",
      title: "Titolo",
      about: "Informazioni",
      interests: "Interessi",
      skills: "Competenze",
      socialNetworks: "Reti sociali",
    },
  },
  actions: {
    confirm: "Conferma",
    cancel: "Annulla",
    verify: "Verifica",
    verifying: "Verifica in corso...",
    invite: "Invita",
  },
};
