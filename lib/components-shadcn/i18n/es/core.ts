export default {
  info: {
    noData: "No se han encontrado datos...",
    notSpecified: "No especificado",
  },
  notifications: {
    failed: "La acción ha fallado",
    success: "La acción se ha realizado con éxito",
  },
  tenantProfile: {
    title: "Configuración del perfil",
    displayName: "Nombre para mostrar",
    companyName: "Nombre de la empresa",
    values: "Valores de la empresa",
    tabs: {
      display: "Visualización",
      company: "Empresa",
      pictures: "Imágenes",
    },
    colors: {
      primary: "Color principal",
      secondary: "Color secundario",
      tertiary: "Color terciario",
      background: "Color de fondo",
      accent: "Color de acento",
      info: "Color de información",
      positive: "Color de éxito",
      warning: "Color de advertencia",
      text: "Color del texto",
    },
    themes: {
      light: "Tema claro",
      dark: "Tema oscuro",
    },
    validation: {
      required: "Este campo es obligatorio",
      maxLength: "La longitud máxima es de {n} caracteres",
      invalidFormat: "Formato inválido",
    },
    placeholders: {
      displayName: "Introduce el nombre para mostrar",
      companyName: "Introduce el nombre de la empresa",
      values: "Introduce los valores de la empresa",
    },
  },
  apiToken: {
    name: "Token API",
    create: "Crear un token API",
    revoke: "Revocar el token",
    home: {
      title: "Tokens API",
      createLabel: "Crear un token",
    },
    detail: {
      title: "Detalles del token API",
    },
    fields: {
      name: "Nombre",
      description: "Descripción",
      tokenPrefix: "Prefijo del token",
      expiresAt: "Fecha de expiración",
      scopes: "Permisos",
      revokeReason: "Motivo de la revocación",
      status: "Estado",
      lastUsed: "Último uso",
      lastUsedIp: "Última IP utilizada",
      token: "Token API",
    },
    copyWarning:
      "Importante: Copia este token ahora. ¡No podrás volver a verlo después!",
    usage: "Cómo usar este token:",
    actions: {
      includeRevoked: "Incluir los tokens revocados",
      includeExpired: "Incluir los tokens caducados",
      copyToken: "Copiar el token",
      revoke: {
        label: "Revocar",
        confirm: "¿Estás seguro de que deseas revocar el token %{name}?",
      },
      delete: {
        label: "Eliminar",
        confirm: "¿Estás seguro de que deseas eliminar el token %{name}?",
      },
    },
  },
  clientApplication: {
    name: "Aplicación cliente",
    home: {
      title: "Aplicaciones cliente",
      createLabel: "Crear una aplicación",
    },
    detail: {
      title: "Detalles de la aplicación cliente",
    },
    fields: {
      name: "Nombre",
      description: "Descripción",
      active: "Activa",
      lastUsed: "Último uso",
      tokens: "Tokens API",
      createdAt: "Creada el",
      updatedAt: "Actualizada el",
    },
    actions: {
      deactivate: {
        label: "Desactivar",
        confirm: "¿Estás seguro de que deseas desactivar la aplicación %{name}?",
      },
      delete: {
        label: "Eliminar",
        confirm: "¿Estás seguro de que deseas eliminar la aplicación %{name}?",
      },
      manageTokens: "Gestionar los tokens",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Crear una configuración global",
    },
    detail: {
      title: "Configuración global",
    },
    fields: {
      name: "Nombre",
      value: "Valor",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm:
          "¿Estás seguro de que deseas eliminar la configuración global %{name}?",
      },
    },
  },
  tenantConfig: {
    name: "Configuración del tenant",
    home: {
      title: "Configuraciones del tenant",
      createLabel: "Crea una configuración del tenant",
    },
    detail: {
      title: "Configuración del tenant",
    },
    fields: {
      name: "Nombre",
      value: "Valor",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm:
          "¿Estás seguro de que deseas eliminar la configuración del tenant %{name}?",
      },
    },
  },
  tenant: {
    name: "Tenant",
    home: {
      title: "Tenants",
      createLabel: "Crea un tenant",
    },
    detail: {
      title: "Tenant",
    },
    fields: {
      tenantId: "Tenant Id",
      name: "Nombre",
      subdomain: "Subdomain",
      enableEmailLinkSignIn: "Activar el enlace de inicio de sesión por correo electrónico",
      allowPasswordSignUp: "Permitir el registro por contraseña",
      allowSignUp: "Permitir el registro",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "¿Estás seguro de que deseas eliminar el tenant %{name}?",
      },
    },
    features: {
      title: "Funcionalidades",
    },
  },
  role: {
    admin: "Admin",
    superAdmin: "Super Admin",
    customer_admin: "Administrador del cliente",
    user: "Usuario",
  },
  client: {
    name: "Nombre",
    home: {
      title: "Clientes",
      createLabel: "Crea cliente",
    },
    detail: {
      title: "Cliente",
    },
    fields: {
      name: "Nombre",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "¿Estás seguro de que deseas eliminar el cliente %{name}?",
      },
    },
  },
  user: {
    home: {
      title: "Usuarios",
      createLabel: "Crea",
    },
    detail: {
      title: "Usuario",
      addUser: "Añadir un usuario",
    },
    fields: {
      name: "Nombre",
      email: "Correo electrónico",
      password: "Contraseña",
      roles: "Roles",
      commercialLevel: "Nivel comercial",
      tenantRoles: "Roles del tenant",
      globalRoles: "Roles globales",
    },
    status: {
      emailVerified: "Correo electrónico verificado",
      enabled: "Activado",
      updated: "Actualizado",
    },
    validation: {
      invalidEmail: "Correo electrónico no válido",
      rolesRequired:
        "Los usuarios pueden tener varios roles. Se debe seleccionar al menos un rol.",
      nameRequired: "Campo requerido y longitud máxima de 50",
    },
    actions: {
      delete: {
        confirm: "¿Estás seguro de que deseas eliminar al usuario {name}?",
      },
      removeFromTenant: "Quitar del tenant",
      checkEmail: "Verificar",
      checking: "Verificando...",
    },
    messages: {
      emailPlaceholder: "Introduce el correo electrónico para verificar si el usuario existe",
      userFound: "Usuario encontrado: {name}",
      userFoundDescription:
        "Este usuario existe y es miembro de {count} tenant(s). Selecciona los roles a continuación para añadirlo a este tenant.",
      alreadyMember: "Ya es miembro",
      alreadyMemberDescription: "Este usuario ya es miembro de este tenant.",
      editUser: "Editar el usuario",
      userNotFound: "Usuario no encontrado",
      userNotFoundDescription:
        "Este correo electrónico no está registrado. Rellena los detalles a continuación para crear un nuevo usuario.",
    },
    roleDescriptions: {
      admin: "Acceso completo al tenant",
      customerAdmin: "Acceso administrativo",
      user: "Acceso de usuario estándar",
      superAdmin: "Acceso completo al sistema",
    },
  },
  userProfile: {
    title: "Perfil de usuario",
    fields: {
      name: "Nombre",
      title: "Título",
      about: "Acerca de",
      interests: "Intereses",
      skills: "Competencias",
      socialNetworks: "Redes sociales",
    },
  },
  actions: {
    confirm: "Confirmar",
    cancel: "Cancelar",
    verify: "Verificar",
    verifying: "Verificando...",
    invite: "Invitar",
  },
};
