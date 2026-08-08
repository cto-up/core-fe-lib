export default {
  info: {
    noData: "Aucune donnée trouvée...",
    notSpecified: "Non spécifié",
  },
  notifications: {
    failed: "L'action a échoué",
    success: "L'action a réussi",
  },
  tenantProfile: {
    title: "Paramètres du Profil",
    displayName: "Nom d'affichage",
    companyName: "Nom de l'entreprise",
    values: "Valeurs de l'entreprise",
    tabs: {
      display: "Affichage",
      company: "Entreprise",
      pictures: "Images",
    },
    colors: {
      primary: "Couleur Principale",
      secondary: "Couleur Secondaire",
      tertiary: "Couleur Tertiaire",
      background: "Couleur de Fond",
      accent: "Couleur d'Accent",
      info: "Couleur d'Information",
      positive: "Couleur de Succès",
      warning: "Couleur d'Avertissement",
      text: "Couleur du Texte",
    },
    themes: {
      light: "Thème Clair",
      dark: "Thème Sombre",
    },
    validation: {
      required: "Ce champ est obligatoire",
      maxLength: "La longueur maximale est de {n} caractères",
      invalidFormat: "Format invalide",
    },
    placeholders: {
      displayName: "Entrez le nom d'affichage",
      companyName: "Entrez le nom de l'entreprise",
      values: "Entrez les valeurs de l'entreprise",
    },
  },
  apiToken: {
    name: "Jeton API",
    create: "Créer un Jeton API",
    revoke: "Révoquer le Jeton",
    home: {
      title: "Jetons API",
      createLabel: "Créer un Jeton",
    },
    detail: {
      title: "Détails du Jeton API",
    },
    fields: {
      name: "Nom",
      description: "Description",
      tokenPrefix: "Préfixe du Jeton",
      expiresAt: "Date d'expiration",
      scopes: "Permissions",
      revokeReason: "Motif de révocation",
      status: "Statut",
      lastUsed: "Dernière utilisation",
      lastUsedIp: "Dernière IP utilisée",
      token: "Jeton API",
    },
    copyWarning:
      "Important : Copiez ce jeton maintenant. Vous ne pourrez plus le voir après!",
    usage: "Comment utiliser ce jeton :",
    actions: {
      includeRevoked: "Inclure les Jetons Révoqués",
      includeExpired: "Inclure les Jetons Expirés",
      copyToken: "Copier le jeton",
      revoke: {
        label: "Révoquer",
        confirm: "Êtes-vous sûr de vouloir révoquer le jeton %{name} ?",
      },
      delete: {
        label: "Supprimer",
        confirm: "Êtes-vous sûr de vouloir supprimer le jeton %{name} ?",
      },
    },
  },
  clientApplication: {
    name: "Application Cliente",
    home: {
      title: "Applications Clientes",
      createLabel: "Créer une Application",
    },
    detail: {
      title: "Détails de l'Application Cliente",
    },
    fields: {
      name: "Nom",
      description: "Description",
      active: "Active",
      lastUsed: "Dernière utilisation",
      tokens: "Jetons API",
      createdAt: "Créée le",
      updatedAt: "Mise à jour le",
    },
    actions: {
      deactivate: {
        label: "Désactiver",
        confirm: "Êtes-vous sûr de vouloir désactiver l'application %{name} ?",
      },
      delete: {
        label: "Supprimer",
        confirm: "Êtes-vous sûr de vouloir supprimer l'application %{name} ?",
      },
      manageTokens: "Gérer les Jetons",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Créer une Configuration Globale",
    },
    detail: {
      title: "Configuration Globale",
    },
    fields: {
      name: "Nom",
      value: "Valeur",
    },
    actions: {
      delete: {
        label: "Supprimer",
        confirm:
          "Êtes-vous sûr de vouloir supprimer Configuration Globale %{name}?",
      },
    },
  },
  tenantConfig: {
    name: "Configuration Tenant",
    home: {
      title: "Configurations Tenant",
      createLabel: "Créez une Configuration Tenant",
    },
    detail: {
      title: "Configuration Tenant",
    },
    fields: {
      name: "Nom",
      value: "Valeur",
    },
    actions: {
      delete: {
        label: "Supprimez",
        confirm:
          "Etes-vous sûr de vouloir supprimer la configuration tenant %{name}?",
      },
    },
  },
  tenant: {
    name: "Tenant",
    home: {
      title: "Tenants",
      createLabel: "Créez un Tenant",
    },
    detail: {
      title: "Tenant",
    },
    fields: {
      tenantId: "Tenant Id",
      name: "Nom",
      subdomain: "Subdomain",
      enableEmailLinkSignIn: "Activer le lien de connexion par Email",
      allowPasswordSignUp: "Autoriser l'inscription par mot de passe",
      allowSignUp: "Autoriser l'inscription",
    },
    actions: {
      delete: {
        label: "Supprimez",
        confirm: "Etes-vous sûr de vouloir supprimer le tenant %{name}?",
      },
    },
    features: {
      title: "Fonctionnalités",
    },
  },
  role: {
    admin: "Admin",
    superAdmin: "Super Admin",
    customer_admin: "Administrateur Client",
    user: "Utilisateur",
  },
  client: {
    name: "Nom",
    home: {
      title: "Clients",
      createLabel: "Créez Client",
    },
    detail: {
      title: "Client",
    },
    fields: {
      name: "Nom",
    },
    actions: {
      delete: {
        label: "Supprimez",
        confirm: "Êtes-vous sur de vouloir supprimer le client %{name}?",
      },
    },
  },
  user: {
    home: {
      title: "Utilisateurs",
      createLabel: "Créez",
    },
    detail: {
      title: "Utilisateur",
      addUser: "Ajouter un Utilisateur",
    },
    fields: {
      name: "Nom",
      email: "Email",
      password: "Mot de passe",
      roles: "Rôles",
      commercialLevel: "Niveau Commercial",
      tenantRoles: "Rôles du Tenant",
      globalRoles: "Rôles Globaux",
    },
    status: {
      emailVerified: "Email vérifié",
      enabled: "Activé",
      updated: "Mis à jour",
    },
    validation: {
      invalidEmail: "Email non valide",
      rolesRequired:
        "Les utilisateurs peuvent avoir plusieurs rôles. Au moins un rôle doit être sélectionné.",
      nameRequired: "Champ requis et longueur maximale de 50",
    },
    actions: {
      delete: {
        confirm: "Êtes-vous sûr de vouloir supprimer l'utilisateur {name} ?",
      },
      removeFromTenant: "Retirer du Tenant",
      checkEmail: "Vérifier",
      checking: "Vérification...",
    },
    messages: {
      emailPlaceholder: "Entrez l'email pour vérifier si l'utilisateur existe",
      userFound: "Utilisateur Trouvé : {name}",
      userFoundDescription:
        "Cet utilisateur existe et est membre de {count} tenant(s). Sélectionnez les rôles ci-dessous pour l'ajouter à ce tenant.",
      alreadyMember: "Déjà Membre",
      alreadyMemberDescription: "Cet utilisateur est déjà membre de ce tenant.",
      editUser: "Modifier l'utilisateur",
      userNotFound: "Utilisateur Non Trouvé",
      userNotFoundDescription:
        "Cet email n'est pas enregistré. Remplissez les détails ci-dessous pour créer un nouvel utilisateur.",
    },
    roleDescriptions: {
      admin: "Accès complet au tenant",
      customerAdmin: "Accès administratif",
      user: "Accès utilisateur standard",
      superAdmin: "Accès complet au système",
    },
  },
  organizations: {
    title: "Organisations",
    subtitle: "Les organisations dont vous faites partie. En quitter une conserve votre compte et toutes vos autres adhésions.",
    loading: "Chargement de vos organisations…",
    empty: "Vous ne faites partie d'aucune organisation.",
    joined: "membre depuis le {date}",
    onlyOrganization:
      "Votre seule organisation — fermez votre compte ci-dessous pour la quitter.",
    leaveAction: "Quitter",
    leftToast: "Vous avez quitté l'organisation.",
    dangerZone: "Zone sensible",
    closeHint: "Fermer votre compte vous retire de toutes les organisations et supprime votre compte au bout de 30 jours.",
    closeAction: "Fermer mon compte",
    deletionBlocksNavigation:
      "La suppression de votre compte est prévue le {date}. Conservez votre compte pour continuer à l'utiliser.",
    deletionScheduled: "La suppression de votre compte est prévue le {date}.",
    keepAccount: "Conserver mon compte",
    deletionCancelled: "Votre compte est conservé.",
    impacts: {
      lms_enrollments: "Vous perdez l'accès à {count} cours dans cette organisation",
      lms_certificates: "{count} certificat(s) restent valides et vérifiables",
      lms_authoredPublishedCourses: "{count} cours publié(s) dont vous êtes l'auteur demandent une décision",
      lms_authoredDraftCourses:
        "{count} cours en brouillon dont vous êtes propriétaire demandent une décision",
      lms_decks: "{count} paquet(s) de révision que vous avez créés",
      lms_clonedVoices: "{count} voix clonée(s) vous appartenant",
      lms_activeSubscription: "{count} abonnement(s) actif(s) dans cette organisation",
    },
    leave: {
      title: "Quitter {name} ?",
      subtitle: "Votre progression est conservée un temps : revenir la restaure.",
      loading: "Vérification de ce que vous perdez…",
      dormancy: "Si vous ne revenez pas avant le {date}, vos données d'apprentissage ici seront supprimées.",
      confirm: "Quitter l'organisation",
      transferTarget: "Identifiant du membre destinataire",
      decisionsOutstanding: "Répondez aux points ci-dessus avant de partir.",
      previewFailed: "Impossible de vérifier ce que vous perdez.",
      failed: "Impossible de quitter cette organisation.",
      actions: {
        transfer: "Transférer à un autre membre",
        keep: "Les laisser à l'organisation",
        unpublish: "Les dépublier",
        cancelAtPeriodEnd: "Résilier l'abonnement",
      },
    },
    close: {
      title: "Fermer votre compte",
      subtitle: "Cela vous retire de {count} organisation(s) et supprime votre compte.",
      grace: "Rien n'est supprimé aujourd'hui. Vous avez 30 jours pour changer d'avis : vous connecter annule la suppression.",
      export: "Télécharger mes données",
      exportFailed: "Impossible de préparer l'export de vos données.",
      confirmLabel: "Saisissez votre adresse e-mail pour confirmer",
      confirm: "Programmer la suppression",
      emailMismatch: "Ce n'est pas l'adresse e-mail de ce compte.",
      failed: "Impossible de programmer la suppression.",
    },
  },
  userProfile: {
    title: "Profil Utilisateur",
    fields: {
      name: "Nom",
      title: "Titre",
      about: "À propos",
      interests: "Centres d'intérêt",
      skills: "Compétences",
      socialNetworks: "Réseaux sociaux",
    },
  },
  actions: {
    confirm: "Confirmer",
    cancel: "Annuler",
    verify: "Vérifier",
    verifying: "Vérification en cours...",
    invite: "Inviter",
  },
};
