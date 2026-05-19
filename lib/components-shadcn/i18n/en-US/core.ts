export default {
  info: {
    noData: "No data found...",
    notSpecified: "Not specified",
  },
  notifications: {
    failed: "Action failed",
    success: "Action was successful",
  },
  tenantProfile: {
    title: "Profile Settings",
    displayName: "Display Name",
    companyName: "Company Name",
    values: "Company Values",
    tabs: {
      display: "Display",
      company: "Company",
      pictures: "Pictures",
    },
    colors: {
      primary: "Primary Color",
      secondary: "Secondary Color",
      tertiary: "Tertiary Color",
      background: "Background Color",
      accent: "Accent Color",
      info: "Info Color",
      positive: "Success Color",
      warning: "Warning Color",
      text: "Text Color",
    },
    themes: {
      light: "Light Theme",
      dark: "Dark Theme",
    },
    validation: {
      required: "This field is required",
      maxLength: "Maximum length is {n} characters",
      invalidFormat: "Invalid format",
    },
    placeholders: {
      displayName: "Enter display name",
      companyName: "Enter company name",
      values: "Enter company values",
    },
  },
  apiToken: {
    name: "API Token",
    create: "Create API Token",
    revoke: "Revoke Token",
    home: {
      title: "API Tokens",
      createLabel: "Create Token",
    },
    detail: {
      title: "API Token Details",
    },
    fields: {
      name: "Name",
      description: "Description",
      tokenPrefix: "Token Prefix",
      expiresAt: "Expiration Date",
      scopes: "Permissions",
      revokeReason: "Revocation Reason",
      status: "Status",
      lastUsed: "Last Used",
      lastUsedIp: "Last Used IP",
      token: "API Token",
    },
    copyWarning:
      "Important: Copy this token now. You won't be able to see it again!",
    usage: "How to use this token:",
    actions: {
      includeRevoked: "Include Revoked Tokens",
      includeExpired: "Include Expired Tokens",
      copyToken: "Copy token",
      revoke: {
        label: "Revoke",
        confirm: "Are you sure you want to revoke token %{name}?",
      },
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete token %{name}?",
      },
    },
  },
  clientApplication: {
    name: "Client Application",
    home: {
      title: "Client Applications",
      createLabel: "Create Application",
    },
    detail: {
      title: "Client Application Details",
    },
    fields: {
      name: "Name",
      description: "Description",
      active: "Active",
      lastUsed: "Last Used",
      tokens: "API Tokens",
      createdAt: "Created At",
      updatedAt: "Updated At",
    },
    actions: {
      deactivate: {
        label: "Deactivate",
        confirm: "Are you sure you want to deactivate application %{name}?",
      },
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete application %{name}?",
      },
      manageTokens: "Manage Tokens",
    },
  },
  globalConfig: {
    name: "GlobalConfig",
    home: {
      title: "GlobalConfigs",
      createLabel: "Create Global Config",
    },
    detail: {
      title: "Global Config",
    },
    fields: {
      name: "Name",
      value: "Value",
    },
    actions: {
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete global config %{name}?",
      },
    },
  },
  tenantConfig: {
    name: "TenantConfig",
    home: {
      title: "TenantConfigs",
      createLabel: "Create TenantConfig",
    },
    detail: {
      title: "TenantConfig",
    },
    fields: {
      name: "Name",
      value: "Value",
    },
    actions: {
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete tenant config %{name}?",
      },
    },
  },
  tenant: {
    name: "Tenant",
    home: {
      title: "Tenants",
      createLabel: "Create Tenant",
    },
    detail: {
      title: "Tenant",
    },
    fields: {
      tenantId: "Tenant Id",
      name: "Name",
      subdomain: "Subdomain",
      enableEmailLinkSignIn: "Enable Email Link Sign in",
      allowPasswordSignUp: "Allow Password Sign Up",
      allowSignUp: "Allow Sign Up",
    },
    actions: {
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete tenant %{name}?",
      },
    },
    features: {
      title: "Features",
    },
  },
  role: {
    admin: "Admin",
    superAdmin: "Super Admin",
    customer_admin: "Customer Admin",
    user: "User",
  },
  client: {
    name: "Name",
    home: {
      title: "Clients",
      createLabel: "Create Client",
    },
    detail: {
      title: "Client",
    },
    fields: {
      name: "Name",
    },
    actions: {
      delete: {
        label: "Delete",
        confirm: "Are you sure you want to delete client %{name}?",
      },
    },
  },
  user: {
    home: {
      title: "Users",
      createLabel: "Create",
    },
    detail: {
      title: "User",
      addUser: "Add User",
    },
    fields: {
      name: "Name",
      email: "Email",
      password: "Password",
      roles: "Roles",
      commercialLevel: "Commercial Level",
      tenantRoles: "Tenant Roles",
      globalRoles: "Global Roles",
    },
    status: {
      emailVerified: "Email Verified",
      enabled: "Enabled",
      updated: "Updated",
    },
    validation: {
      invalidEmail: "Not a valid email",
      rolesRequired:
        "Users can have multiple roles. At least one role must be selected.",
      nameRequired: "Field required & max length 50",
    },
    actions: {
      delete: {
        confirm: "Are you sure you want to delete user {name}?",
      },
      removeFromTenant: "Remove from Tenant",
      checkEmail: "Check",
      checking: "Checking...",
    },
    messages: {
      emailPlaceholder: "Enter email to check if user exists",
      userFound: "User Found: {name}",
      userFoundDescription:
        "This user exists and is a member of {count} tenant(s). Select roles below to add them to this tenant.",
      alreadyMember: "Already a Member",
      alreadyMemberDescription: "This user is already a member of this tenant.",
      editUser: "Edit user",
      userNotFound: "User Not Found",
      userNotFoundDescription:
        "This email is not registered. Fill in the details below to create a new user.",
    },
    roleDescriptions: {
      admin: "Full tenant access",
      customerAdmin: "Administrative access",
      user: "Standard user access",
      superAdmin: "Full system access",
    },
  },
  userProfile: {
    title: "User Profile",
    fields: {
      name: "Name",
      title: "Title",
      about: "About",
      interests: "Interests",
      skills: "Skills",
      socialNetworks: "Social Networks",
    },
  },
  actions: {
    confirm: "Confirm",
    cancel: "Cancel",
    verify: "Verify",
    verifying: "Verifying...",
    invite: "Invite",
  },
};
