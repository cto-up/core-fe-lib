export default {
  info: {
    noData: "Nenhum dado encontrado...",
    notSpecified: "Não especificado",
  },
  notifications: {
    failed: "A ação falhou",
    success: "A ação foi bem-sucedida",
  },
  tenantProfile: {
    title: "Definições do perfil",
    displayName: "Nome a apresentar",
    companyName: "Nome da empresa",
    values: "Valores da empresa",
    tabs: {
      display: "Apresentação",
      company: "Empresa",
      pictures: "Imagens",
    },
    colors: {
      primary: "Cor primária",
      secondary: "Cor secundária",
      tertiary: "Cor terciária",
      background: "Cor de fundo",
      accent: "Cor de destaque",
      info: "Cor de informação",
      positive: "Cor de sucesso",
      warning: "Cor de aviso",
      text: "Cor do texto",
    },
    themes: {
      light: "Tema claro",
      dark: "Tema escuro",
    },
    validation: {
      required: "Este campo é obrigatório",
      maxLength: "O comprimento máximo é de {n} caracteres",
      invalidFormat: "Formato inválido",
    },
    placeholders: {
      displayName: "Introduza o nome a apresentar",
      companyName: "Introduza o nome da empresa",
      values: "Introduza os valores da empresa",
    },
  },
  apiToken: {
    name: "Token de API",
    create: "Criar token de API",
    revoke: "Revogar token",
    home: {
      title: "Tokens de API",
      createLabel: "Criar token",
    },
    detail: {
      title: "Detalhes do token de API",
    },
    fields: {
      name: "Nome",
      description: "Descrição",
      tokenPrefix: "Prefixo do token",
      expiresAt: "Data de expiração",
      scopes: "Permissões",
      revokeReason: "Motivo da revogação",
      status: "Estado",
      lastUsed: "Última utilização",
      lastUsedIp: "IP da última utilização",
      token: "Token de API",
    },
    copyWarning:
      "Importante: Copie este token agora. Não o poderá voltar a ver!",
    usage: "Como utilizar este token:",
    actions: {
      includeRevoked: "Incluir tokens revogados",
      includeExpired: "Incluir tokens expirados",
      copyToken: "Copiar token",
      revoke: {
        label: "Revogar",
        confirm: "Tem a certeza de que pretende revogar o token %{name}?",
      },
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar o token %{name}?",
      },
    },
  },
  clientApplication: {
    name: "Aplicação cliente",
    home: {
      title: "Aplicações cliente",
      createLabel: "Criar aplicação",
    },
    detail: {
      title: "Detalhes da aplicação cliente",
    },
    fields: {
      name: "Nome",
      description: "Descrição",
      active: "Ativo",
      lastUsed: "Última utilização",
      tokens: "Tokens de API",
      createdAt: "Criado em",
      updatedAt: "Atualizado em",
    },
    actions: {
      deactivate: {
        label: "Desativar",
        confirm: "Tem a certeza de que pretende desativar a aplicação %{name}?",
      },
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar a aplicação %{name}?",
      },
      manageTokens: "Gerir tokens",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Criar configuração global",
    },
    detail: {
      title: "Configuração global",
    },
    fields: {
      name: "Nome",
      value: "Valor",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar a configuração global %{name}?",
      },
    },
  },
  tenantConfig: {
    name: "TenantConfig",
    home: {
      title: "TenantConfigs",
      createLabel: "Criar TenantConfig",
    },
    detail: {
      title: "TenantConfig",
    },
    fields: {
      name: "Nome",
      value: "Valor",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar a configuração do inquilino %{name}?",
      },
    },
  },
  tenant: {
    name: "Inquilino",
    home: {
      title: "Inquilinos",
      createLabel: "Criar inquilino",
    },
    detail: {
      title: "Inquilino",
    },
    fields: {
      tenantId: "ID do inquilino",
      name: "Nome",
      subdomain: "Subdomínio",
      enableEmailLinkSignIn: "Ativar início de sessão por ligação de email",
      allowPasswordSignUp: "Permitir registo com palavra-passe",
      allowSignUp: "Permitir registo",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar o inquilino %{name}?",
      },
    },
    features: {
      title: "Funcionalidades",
    },
  },
  role: {
    admin: "Administrador",
    superAdmin: "Superadministrador",
    customer_admin: "Administrador de cliente",
    user: "Utilizador",
  },
  client: {
    name: "Nome",
    home: {
      title: "Clientes",
      createLabel: "Criar cliente",
    },
    detail: {
      title: "Cliente",
    },
    fields: {
      name: "Nome",
    },
    actions: {
      delete: {
        label: "Eliminar",
        confirm: "Tem a certeza de que pretende eliminar o cliente %{name}?",
      },
    },
  },
  user: {
    home: {
      title: "Utilizadores",
      createLabel: "Criar",
    },
    detail: {
      title: "Utilizador",
      addUser: "Adicionar utilizador",
    },
    fields: {
      name: "Nome",
      email: "Email",
      password: "Palavra-passe",
      roles: "Funções",
      commercialLevel: "Nível comercial",
      tenantRoles: "Funções do inquilino",
      globalRoles: "Funções globais",
    },
    status: {
      emailVerified: "Email verificado",
      enabled: "Ativado",
      updated: "Atualizado",
    },
    validation: {
      invalidEmail: "Não é um email válido",
      rolesRequired:
        "Os utilizadores podem ter várias funções. Deve ser selecionada pelo menos uma função.",
      nameRequired: "Campo obrigatório e comprimento máximo de 50",
    },
    actions: {
      delete: {
        confirm: "Tem a certeza de que pretende eliminar o utilizador {name}?",
      },
      removeFromTenant: "Remover do inquilino",
      checkEmail: "Verificar",
      checking: "A verificar...",
    },
    messages: {
      emailPlaceholder: "Introduza o email para verificar se o utilizador existe",
      userFound: "Utilizador encontrado: {name}",
      userFoundDescription:
        "Este utilizador existe e é membro de {count} inquilino(s). Selecione as funções abaixo para o adicionar a este inquilino.",
      alreadyMember: "Já é membro",
      alreadyMemberDescription: "Este utilizador já é membro deste inquilino.",
      editUser: "Editar utilizador",
      userNotFound: "Utilizador não encontrado",
      userNotFoundDescription:
        "Este email não está registado. Preencha os dados abaixo para criar um novo utilizador.",
    },
    roleDescriptions: {
      admin: "Acesso total ao inquilino",
      customerAdmin: "Acesso administrativo",
      user: "Acesso de utilizador padrão",
      superAdmin: "Acesso total ao sistema",
    },
  },
  userProfile: {
    title: "Perfil do utilizador",
    fields: {
      name: "Nome",
      title: "Cargo",
      about: "Sobre",
      interests: "Interesses",
      skills: "Competências",
      socialNetworks: "Redes sociais",
    },
  },
  actions: {
    confirm: "Confirmar",
    cancel: "Cancelar",
    verify: "Verificar",
    verifying: "A verificar...",
    invite: "Convidar",
  },
};
