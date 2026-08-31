export default {
  menu: {
    close: "Schließen",
    install: "App installieren",
    referenceData: "Referenzdaten",
    administration: "Administration",
    management: "Verwaltung",
  },
  sidebar: {
    toggle: "Seitenleiste umschalten",
    closeMobile: "Menü schließen",
  },
  header: {
    language: "Sprache",
    menu: "Menü",
    home: "Startseite",
    login: "Anmelden",
  },
  userPanel: {
    roles: "Rolle(n)",
    signout: "Abmelden",
    profile: "Profil",
  },
  navigation: {
    // Shared section: several modules contribute items to it via
    // `sectionId: "settings"`, so the label is owned here rather than by
    // whichever module happens to be registered first.
    settings: {
      title: "Einstellungen",
      caption: "Zugangsdaten, Audit-Protokoll und Referenzdaten",
    },
    moduleAdministration: {
      title: "Modulverwaltung",
      caption: "Modulverwaltung",
    },
    admin: {
      title: "Administration",
      caption: "Mandanten- & Benutzerverwaltung",
      users: {
        title: "Benutzer",
        caption: "Benutzer verwalten",
      },
      customize: {
        title: "Passen Sie Ihren Bereich an",
        caption: "Design usw.",
      },
      tenantConfig: {
        title: "Mandantenkonfiguration",
        caption: "Schlüssel-Wert-Paare Ihres Mandanten",
      },
      clientApps: {
        title: "Client-Anwendungen",
        caption: "Anwendungs-Token verwalten",
      },
    },
    superAdmin: {
      title: "Globale Administration",
      caption: "Mandanten & Konfiguration",
      globalConfig: {
        title: "Globale Konfiguration",
        caption: "Globale Einstellungen verwalten",
      },
      tenants: {
        title: "Mandanten",
        caption: "Mandanten verwalten",
      },
    },
    account: {
      title: "Ich",
      caption: "Profil",
    },
    organizations: {
      title: "Organisationen",
      caption: "Organisationen, denen Sie angehören",
    },
    security: {
      title: "Sicherheit",
      caption: "Multi-Faktor-Authentifizierung",
    },
    seed: {
      title: "Daten initialisieren",
      caption: "Referenz- und Beispieldaten initialisieren",
      reference: {
        title: "Referenzdaten",
        caption:
          "Branchen, Fähigkeiten und andere Referenzdaten initialisieren",
        action: "Referenzdaten befüllen",
        success: "Referenzdaten erfolgreich initialisiert",
        error: "Referenzdaten konnten nicht initialisiert werden",
      },
      sample: {
        title: "Beispieldaten",
        caption: "Beispielunternehmen und zugehörige Daten initialisieren",
        action: "Beispieldaten befüllen",
        success: "Beispieldaten erfolgreich initialisiert",
        error: "Beispieldaten konnten nicht initialisiert werden",
      },
    },
  },
  backoffice: "Globale Administration",
  version: "Version",
};
