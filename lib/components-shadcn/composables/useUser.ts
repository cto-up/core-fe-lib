// src/composables/useUser.ts - Kratos Multi-Tenant Implementation (Admin) - Smart Form
import {
  DefaultService,
  type User,
  type NewUser,
  type UserProfileSchema,
} from "../../openapi/core";
import { ref, reactive, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { email, minLength, maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";

// Kratos roles
const GLOBAL_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN", // Global role in Kratos metadata
} as const;

const TENANT_ROLES = {
  CUSTOMER_ADMIN: "CUSTOMER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export function useUser() {
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialog();
  const { handleError } = useErrors();

  // Smart form state
  const emailInput = ref("");
  const checking = ref(false);
  const userChecked = ref(false);
  const userExists = ref<{
    id: string;
    name: string;
    email: string;
    tenantCount: number;
    isMemberOfCurrentTenant: boolean;
  } | null>(null);

  // Track selected roles (multiple roles per tenant)
  const selectedRoles = ref<string[]>(["USER"]);
  const isSuperAdmin = ref(false); // Global SUPER_ADMIN role

  const user = reactive({
    id: "",
    name: "",
    email: "",
    roles: [] as Array<string>, // Tenant roles from membership table
    globalRoles: [] as Array<string>, // Global roles from Kratos metadata
    email_verified: false,
    disabled: false,
    profile: {} as UserProfileSchema,
  });

  const isNew = computed(() => !user.id && !userExists.value);

  const { t } = useI18n();
  const loading = ref(false);

  // Computed properties for role checkboxes
  const isCustomerAdmin = computed({
    get: () => selectedRoles.value.includes(TENANT_ROLES.CUSTOMER_ADMIN),
    set: (value: boolean) => {
      if (value) {
        if (!selectedRoles.value.includes(TENANT_ROLES.CUSTOMER_ADMIN)) {
          selectedRoles.value.push(TENANT_ROLES.CUSTOMER_ADMIN);
        }
      } else {
        selectedRoles.value = selectedRoles.value.filter(
          (r) => r !== TENANT_ROLES.CUSTOMER_ADMIN
        );
      }
    },
  });

  const isAdmin = computed({
    get: () => selectedRoles.value.includes(TENANT_ROLES.ADMIN),
    set: (value: boolean) => {
      if (value) {
        if (!selectedRoles.value.includes(TENANT_ROLES.ADMIN)) {
          selectedRoles.value.push(TENANT_ROLES.ADMIN);
        }
      } else {
        selectedRoles.value = selectedRoles.value.filter(
          (r) => r !== TENANT_ROLES.ADMIN
        );
      }
    },
  });

  const isUser = computed({
    get: () => selectedRoles.value.includes(TENANT_ROLES.USER),
    set: (value: boolean) => {
      if (value) {
        if (!selectedRoles.value.includes(TENANT_ROLES.USER)) {
          selectedRoles.value.push(TENANT_ROLES.USER);
        }
      } else {
        selectedRoles.value = selectedRoles.value.filter(
          (r) => r !== TENANT_ROLES.USER
        );
      }
    },
  });

  const userRules = {
    name: {
      required,
      $autoDirty: true,
      minLength: minLength(1),
      maxLength: maxLength(50),
    },
    email: {
      required,
      $autoDirty: true,
      email,
    },
  };

  const newUserRules = {
    name: {
      required,
      $autoDirty: true,
      minLength: minLength(1),
      maxLength: maxLength(50),
    },
    email: {
      required,
      $autoDirty: true,
      email,
    },
  };

  const rules = computed(() => {
    return !user.id ? newUserRules : userRules;
  });

  const v$ = useVuelidate(rules, user, { $lazy: true });

  watch(
    () => user.id,
    () => {
      v$.value.$reset();
    }
  );

  // Check if user exists by email
  const checkUserExists = async () => {
    if (!emailInput.value) {
      toast({
        title: t("info.invalidForm"),
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    checking.value = true;
    userChecked.value = false;
    userExists.value = null;

    try {
      const response = await DefaultService.checkUserExists(emailInput.value);

      userChecked.value = true;

      if (response.exists && response.user) {
        userExists.value = response.user as any;
        user.email = response.user.email || "";
        user.name = response.user.name || "";
        user.id = response.user.id || "";
      } else {
        // User doesn't exist - set email from input for new user creation
        user.email = emailInput.value;
      }
    } catch (error) {
      handleError(error);
    } finally {
      checking.value = false;
    }
  };

  const fetchUser = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getUserById(
          route.params.id as string
        );
        user.name = response.profile?.name || "";
        Object.assign(user, response);

        // Initialize selected roles from user's tenant membership
        selectedRoles.value = [...(user.roles || [])];

        // Check for SUPER_ADMIN in global roles
        isSuperAdmin.value = (user.globalRoles || []).includes(
          GLOBAL_ROLES.SUPER_ADMIN
        );

        // Set email input for display
        emailInput.value = user.email;
        userChecked.value = true;
      } catch (e) {
        handleError(e);
      }
    }
  };

  const saveUser = async () => {
    const isFormCorrect = await v$.value.$validate();

    if (!isFormCorrect) {
      toast({
        title: t("info.invalidForm"),
        variant: "destructive",
      });
      return;
    }

    // Ensure at least USER role is selected for tenant
    if (selectedRoles.value.length === 0) {
      selectedRoles.value.push(TENANT_ROLES.USER);
    }

    // Update user roles with selected roles
    user.roles = [...selectedRoles.value];

    // Update global roles
    if (isSuperAdmin.value) {
      if (!user.globalRoles.includes(GLOBAL_ROLES.SUPER_ADMIN)) {
        user.globalRoles.push(GLOBAL_ROLES.SUPER_ADMIN);
      }
    } else {
      user.globalRoles = user.globalRoles.filter(
        (role) => role !== GLOBAL_ROLES.SUPER_ADMIN
      );
    }

    loading.value = true;
    try {
      if (userExists.value && !userExists.value.isMemberOfCurrentTenant) {
        // Add existing user to tenant
        const addedUser = await DefaultService.addUserMembership(
          userExists.value.id,
          {
            roles: user.roles as any,
          }
        );
        user.id = addedUser.id;

        // Update state to reflect user is now a member
        if (userExists.value) {
          userExists.value.isMemberOfCurrentTenant = true;
        }

        toast({
          title: t("actions.saved"),
          description: "User added to tenant successfully",
          variant: "default",
        });
      } else if (!user.id) {
        // Create new user
        const newUser = await DefaultService.addUser({
          ...user,
          roles: user.roles as any,
          globalRoles: user.globalRoles as any,
        } as NewUser);
        user.id = newUser.id;

        toast({
          title: t("actions.saved"),
          description: "User created successfully",
          variant: "default",
        });
      } else {
        // Update existing user
        await DefaultService.updateUser(user.id, {
          ...user,
          roles: user.roles as any,
          globalRoles: user.globalRoles as any,
        } as User);

        toast({
          title: t("actions.saved"),
          description: "User updated successfully",
          variant: "default",
        });
      }

      router.push({ name: "users", query: route.query });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save user. Please try again.",
        variant: "destructive",
      });
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async () => {
    const confirmed = await dialog({
      message: t("core.user.actions.delete.confirm", { name: user.name }),
      cancel: t("actions.cancel"),
      ok: t("actions.delete"),
    });

    if (!confirmed) return;

    DefaultService.deleteUser(user.id)
      .then(() => {
        toast({ title: t("actions.deleted"), variant: "default" });
        void router.push({
          name: "users",
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const removeUserFromTenant = () => {
    dialog({
      message: t("core.user.actions.removeFromTenant.confirm", {
        name: user.name,
      }),
      cancel: t("actions.cancel"),
      ok: t("actions.remove"),
    }).onOk(() => {
      DefaultService.removeUserFromTenant(user.id)
        .then(() => {
          toast({
            title: t("actions.removed"),
            description: "User removed from tenant",
            variant: "default",
          });
          void router.push({
            name: "users",
            query: route.query,
          });
        })
        .catch((e) => {
          handleError(e);
        });
    });
  };

  const requestPasswordResetByAdmin = async () => {
    loading.value = true;
    try {
      if (user.id) {
        await DefaultService.resetPasswordRequestByAdmin(user.id, {
          email: user.email,
        });
      }
      toast({
        title: t("actions.requestPasswordResetSent"),
        variant: "default",
      });
      void router.push({
        name: "edit-user",
        params: { id: user.id },
        query: route.query,
      });
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const backToUserList = () => {
    void router.push({
      name: "users",
      query: route.query,
    });
  };

  // Helper for button text
  const getSaveButtonText = () => {
    if (loading.value) return t("actions.saving") || "Saving...";
    if (userExists.value && !userExists.value.isMemberOfCurrentTenant) {
      return "Add to Tenant";
    }
    return isNew.value
      ? t("actions.create") || "Create User"
      : t("actions.update") || "Update User";
  };

  // Reset form when starting new
  const resetForm = () => {
    emailInput.value = "";
    userChecked.value = false;
    userExists.value = null;
    user.id = "";
    user.name = "";
    user.email = "";
    user.roles = [];
    selectedRoles.value = ["USER"];
  };

  return {
    v$,
    user,
    isNew,
    isCustomerAdmin,
    isAdmin,
    isUser,
    isSuperAdmin,
    selectedRoles,
    loading,
    emailInput,
    checking,
    userChecked,
    userExists,
    checkUserExists,
    fetchUser,
    saveUser,
    deleteUser,
    removeUserFromTenant,
    requestPasswordResetByAdmin,
    backToUserList,
    getSaveButtonText,
    resetForm,
    TENANT_ROLES,
    GLOBAL_ROLES,
  };
}
