export default {
  info: {
    noData: "Keine Daten gefunden...",
    notSpecified: "Nicht angegeben",
  },
  notifications: {
    failed: "Aktion fehlgeschlagen",
    success: "Aktion war erfolgreich",
  },
  tenantProfile: {
    title: "Profileinstellungen",
    displayName: "Anzeigename",
    companyName: "Firmenname",
    values: "Unternehmenswerte",
    tabs: {
      display: "Anzeige",
      company: "Unternehmen",
      pictures: "Bilder",
    },
    colors: {
      primary: "Primärfarbe",
      secondary: "Sekundärfarbe",
      tertiary: "Tertiärfarbe",
      background: "Hintergrundfarbe",
      accent: "Akzentfarbe",
      info: "Infofarbe",
      positive: "Erfolgsfarbe",
      warning: "Warnfarbe",
      text: "Textfarbe",
    },
    themes: {
      light: "Helles Design",
      dark: "Dunkles Design",
    },
    validation: {
      required: "Dieses Feld ist erforderlich",
      maxLength: "Die maximale Länge beträgt {n} Zeichen",
      invalidFormat: "Ungültiges Format",
    },
    placeholders: {
      displayName: "Anzeigename eingeben",
      companyName: "Firmenname eingeben",
      values: "Unternehmenswerte eingeben",
    },
  },
  apiToken: {
    name: "API-Token",
    create: "API-Token erstellen",
    revoke: "Token widerrufen",
    home: {
      title: "API-Token",
      createLabel: "Token erstellen",
    },
    detail: {
      title: "API-Token-Details",
    },
    fields: {
      name: "Name",
      description: "Beschreibung",
      tokenPrefix: "Token-Präfix",
      expiresAt: "Ablaufdatum",
      scopes: "Berechtigungen",
      revokeReason: "Widerrufsgrund",
      status: "Status",
      lastUsed: "Zuletzt verwendet",
      lastUsedIp: "Zuletzt verwendete IP",
      token: "API-Token",
    },
    copyWarning:
      "Wichtig: Kopieren Sie diesen Token jetzt. Sie können ihn später nicht mehr einsehen!",
    usage: "So verwenden Sie diesen Token:",
    actions: {
      includeRevoked: "Widerrufene Token einschließen",
      includeExpired: "Abgelaufene Token einschließen",
      copyToken: "Token kopieren",
      revoke: {
        label: "Widerrufen",
        confirm: "Möchten Sie den Token %{name} wirklich widerrufen?",
      },
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie den Token %{name} wirklich löschen?",
      },
    },
  },
  clientApplication: {
    name: "Client-Anwendung",
    home: {
      title: "Client-Anwendungen",
      createLabel: "Anwendung erstellen",
    },
    detail: {
      title: "Details der Client-Anwendung",
    },
    fields: {
      name: "Name",
      description: "Beschreibung",
      active: "Aktiv",
      lastUsed: "Zuletzt verwendet",
      tokens: "API-Token",
      createdAt: "Erstellt am",
      updatedAt: "Aktualisiert am",
    },
    actions: {
      deactivate: {
        label: "Deaktivieren",
        confirm: "Möchten Sie die Anwendung %{name} wirklich deaktivieren?",
      },
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie die Anwendung %{name} wirklich löschen?",
      },
      manageTokens: "Token verwalten",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Globale Konfiguration erstellen",
    },
    detail: {
      title: "Globale Konfiguration",
    },
    fields: {
      name: "Name",
      value: "Wert",
    },
    actions: {
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie die globale Konfiguration %{name} wirklich löschen?",
      },
    },
  },
  tenantConfig: {
    name: "TenantConfig",
    home: {
      title: "TenantConfigs",
      createLabel: "TenantConfig erstellen",
    },
    detail: {
      title: "TenantConfig",
    },
    fields: {
      name: "Name",
      value: "Wert",
    },
    actions: {
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie die Mandantenkonfiguration %{name} wirklich löschen?",
      },
    },
  },
  tenant: {
    name: "Mandant",
    home: {
      title: "Mandanten",
      createLabel: "Mandant erstellen",
    },
    detail: {
      title: "Mandant",
    },
    fields: {
      tenantId: "Mandanten-ID",
      name: "Name",
      subdomain: "Subdomain",
      enableEmailLinkSignIn: "Anmeldung per E-Mail-Link aktivieren",
      allowPasswordSignUp: "Registrierung mit Passwort erlauben",
      allowSignUp: "Registrierung erlauben",
    },
    actions: {
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie den Mandanten %{name} wirklich löschen?",
      },
    },
    features: {
      title: "Funktionen",
    },
  },
  role: {
    admin: "Admin",
    superAdmin: "Super-Admin",
    customer_admin: "Kundenadministrator",
    user: "Benutzer",
  },
  client: {
    name: "Name",
    home: {
      title: "Clients",
      createLabel: "Client erstellen",
    },
    detail: {
      title: "Client",
    },
    fields: {
      name: "Name",
    },
    actions: {
      delete: {
        label: "Löschen",
        confirm: "Möchten Sie den Client %{name} wirklich löschen?",
      },
    },
  },
  user: {
    home: {
      title: "Benutzer",
      createLabel: "Erstellen",
    },
    detail: {
      title: "Benutzer",
      addUser: "Benutzer hinzufügen",
    },
    fields: {
      name: "Name",
      email: "E-Mail",
      password: "Passwort",
      roles: "Rollen",
      commercialLevel: "Vertriebsstufe",
      tenantRoles: "Mandantenrollen",
      globalRoles: "Globale Rollen",
    },
    status: {
      emailVerified: "E-Mail verifiziert",
      enabled: "Aktiviert",
      updated: "Aktualisiert",
    },
    validation: {
      invalidEmail: "Keine gültige E-Mail-Adresse",
      rolesRequired:
        "Benutzer können mehrere Rollen haben. Es muss mindestens eine Rolle ausgewählt werden.",
      nameRequired: "Feld erforderlich & max. Länge 50",
    },
    actions: {
      delete: {
        confirm: "Möchten Sie den Benutzer {name} wirklich löschen?",
      },
      removeFromTenant: "Aus Mandant entfernen",
      checkEmail: "Prüfen",
      checking: "Wird geprüft...",
    },
    messages: {
      emailPlaceholder: "E-Mail eingeben, um zu prüfen, ob der Benutzer existiert",
      userFound: "Benutzer gefunden: {name}",
      userFoundDescription:
        "Dieser Benutzer existiert und ist Mitglied von {count} Mandant(en). Wählen Sie unten Rollen aus, um ihn diesem Mandanten hinzuzufügen.",
      alreadyMember: "Bereits Mitglied",
      alreadyMemberDescription: "Dieser Benutzer ist bereits Mitglied dieses Mandanten.",
      editUser: "Benutzer bearbeiten",
      userNotFound: "Benutzer nicht gefunden",
      userNotFoundDescription:
        "Diese E-Mail-Adresse ist nicht registriert. Füllen Sie die Angaben unten aus, um einen neuen Benutzer zu erstellen.",
    },
    roleDescriptions: {
      admin: "Voller Mandantenzugriff",
      customerAdmin: "Administrativer Zugriff",
      user: "Standardbenutzerzugriff",
      superAdmin: "Voller Systemzugriff",
    },
  },
  userProfile: {
    title: "Benutzerprofil",
    fields: {
      name: "Name",
      title: "Titel",
      about: "Über",
      interests: "Interessen",
      skills: "Fähigkeiten",
      socialNetworks: "Soziale Netzwerke",
    },
  },
  actions: {
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    verify: "Verifizieren",
    verifying: "Wird verifiziert...",
    invite: "Einladen",
  },
};
