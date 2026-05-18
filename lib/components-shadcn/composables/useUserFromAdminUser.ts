// src/composables/useUser.ts - Kratos Multi-Tenant Implementation
import {
  DefaultService,
  type User,
  type NewUser,
  type UserProfileSchema,
} from "../../openapi/core";
import { ref, reactive, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { email, minLength, maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";

// Kratos tenant roles (stored in database)
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
  const tenantId = route.params.tenantid as string;

  // Smart form state
  const emailInput = ref("");
  const checking = ref(false);
  const userChecked = ref(false);
  const userExists = ref<{
    id: string;
    name: string;
    email: string;
    tenantCount: number;
    isMemberOfTenant: boolean;
  } | null>(null);

  // Track selected roles (multiple roles per tenant)
  const selectedRoles = ref<string[]>(["USER"]);

  const user = reactive({
    id: "",
    name: "",
    email: "",
    roles: [] as Array<string>, // Tenant roles from membership table
    email_verified: false,
    disabled: false,
    profile: {} as UserProfileSchema,
  });

  const { t } = useI18n();
  const loading = ref(false);

  const isNew = computed(() => !user.id && !userExists.value);

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
      const response = await DefaultService.checkUserExistsFromSuperAdmin(
        tenantId,
        emailInput.value
      );

      userChecked.value = true;

      if (response.exists && response.user) {
        userExists.value = response.user as any;
        user.email = response.user.email || "";
        user.name = response.user.name || "";
        user.id = response.user.id || "";
      } else {
        // User doesn't exist - keep userExists.value as null
        userExists.value = null;
        user.email = emailInput.value;
      }
    } catch (error) {
      handleError(error);
    } finally {
      checking.value = false;
    }
  };

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

  const rules = computed(() => (isNew.value ? newUserRules : userRules));
  const v$ = useVuelidate(rules, user);

  const fetchUser = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getUserByIdFromSuperAdmin(
          route.params.id as string,
          tenantId
        );
        user.name = response.profile?.name || "";
        Object.assign(user, response);

        // Initialize selected roles from user's tenant membership
        selectedRoles.value = [...(user.roles || [])];

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

    // Ensure at least USER role is selected
    if (selectedRoles.value.length === 0) {
      selectedRoles.value.push(TENANT_ROLES.USER);
    }

    // Update user roles with selected roles
    user.roles = [...selectedRoles.value];

    loading.value = true;
    try {
      if (userExists.value && !userExists.value.isMemberOfTenant) {
        // Add existing user to tenant
        const addedUser = await DefaultService.addUserMembershipFromSuperAdmin(
          tenantId,
          userExists.value.id,
          {
            roles: user.roles as any,
          }
        );
        user.id = addedUser.id;

        // Update state to reflect user is now a member
        if (userExists.value) {
          userExists.value.isMemberOfTenant = true;
        }

        toast({
          title: t("actions.saved"),
          description: "User added to tenant successfully",
          variant: "default",
        });
      } else if (!user.id) {
        // Create new user with tenant membership
        const newUser = await DefaultService.addUserFromSuperAdmin(tenantId, {
          ...user,
          roles: user.roles,
        } as NewUser);
        user.id = newUser.id;

        toast({
          title: t("actions.saved"),
          description: "User created successfully",
          variant: "default",
        });
      } else {
        // Update existing user's tenant membership roles
        await DefaultService.updateUserFromSuperAdmin(user.id, tenantId, {
          ...user,
          roles: user.roles,
        } as User);

        toast({
          title: t("actions.saved"),
          description: "User updated successfully",
          variant: "default",
        });
      }

      // Navigate to edit page if not already there
      if (
        route.name !== "super-admin-edit-user" ||
        route.params.id !== user.id
      ) {
        void router.push({
          name: "super-admin-edit-user",
          params: { tenantid: route.params.tenantid, id: user.id },
          query: route.query,
        });
      }
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

    DefaultService.deleteUserFromSuperAdmin(user.id, tenantId)
      .then(() => {
        toast({ title: t("actions.deleted"), variant: "default" });
        void router.push({
          name: "super-admin-users",
          params: { tenantid: route.params.tenantid },
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const removeUserFromTenant = async () => {
    const confirmed = await dialog({
      message: `Remove ${user.name} from this tenant? They will lose access but their account will remain active in other tenants.`,
      cancel: t("actions.cancel"),
      ok: "Remove from Tenant",
    });

    if (!confirmed) return;

    DefaultService.removeUserFromTenantFromSuperAdmin(tenantId, user.id)
      .then(() => {
        toast({
          title: "User removed from tenant",
          variant: "default",
        });
        void router.push({
          name: "super-admin-users",
          params: { tenantid: route.params.tenantid },
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const requestPasswordResetBySuperAdmin = async () => {
    loading.value = true;
    try {
      if (user.id) {
        await DefaultService.resetPasswordRequestBySuperAdmin(
          user.id,
          tenantId,
          { email: user.email }
        );
      }
      toast({
        title: t("actions.requestPasswordResetSent"),
        variant: "default",
      });
      void router.push({
        name: "super-admin-edit-user",
        params: { tenantid: route.params.tenantid, id: user.id },
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
      name: "super-admin-users",
      params: { tenantid: route.params.tenantid },
      query: route.query,
    });
  };

  // Helper for button text
  const getSaveButtonText = () => {
    if (loading.value) return t("actions.saving") || "Saving...";
    if (userExists.value && !userExists.value.isMemberOfTenant) {
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
    rules,
    requestPasswordResetBySuperAdmin,
    backToUserList,
    getSaveButtonText,
    resetForm,
    TENANT_ROLES,
  };
}
