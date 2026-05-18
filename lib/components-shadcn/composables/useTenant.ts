// src/composables/useTenant.ts
import {
  DefaultService,
  type Tenant,
  type NewTenant,
} from "../../openapi/core";
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { helpers, minLength, maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";

export function useTenant() {
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialog();
  const { handleError } = useErrors();

  const tenant = reactive<Tenant>({
    id: "",
    tenant_id: "",
    name: "",
    subdomain: "",
    enable_email_link_sign_in: true,
    allow_password_sign_up: true,
    allow_sign_up: false,
  });

  const { t } = useI18n();
  const loading = ref(false);
  const rules = {
    name: {
      required,
      $autoDirty: true,
      minLength: minLength(4),
      maxLength: maxLength(20),
    },
    subdomain: {
      required,
      $autoDirty: true,
      maxLength: maxLength(50),
      validSubdomain: helpers.regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
    },
  };

  // clean name by applying
  // Should start with a letter and only consist of letters, digits and hyphens with 4-20 characters
  const clearName = () => {
    tenant.name = tenant.name
      .replaceAll(/[^a-zA-Z0-9-]/g, "")
      .replaceAll(/-+/g, "-")
      .replaceAll(/^-|-$/g, "");
  };
  // clean subdomain by applying
  // all lower case, only accept letters, digits and hyphens
  const clearSubdomain = () => {
    tenant.subdomain = tenant.subdomain
      .toLowerCase()
      .replaceAll(/[^a-z0-9-]/g, "")
      .replaceAll(/-+/g, "-")
      .replaceAll(/^-|-$/g, "");
  };

  const v$ = useVuelidate(rules, tenant as Tenant);

  const fetchTenant = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getTenantById(
          route.params.id as string
        );
        Object.assign(tenant, response);
      } catch (e) {
        handleError(e);
      }
    }
  };

  const saveTenant = async () => {
    const isFormCorrect = await v$.value.$validate();

    if (!isFormCorrect) {
      toast({
        title: t("info.invalidForm"),
      });
      return;
    }

    loading.value = true;
    try {
      if (!tenant.id) {
        const newTenant = await DefaultService.addTenant({
          ...tenant,
        } as NewTenant);
        tenant.id = newTenant.id;
      } else {
        await DefaultService.updateTenant(tenant.id, { ...tenant });
      }
      toast({ title: t("actions.saved") });
      void router.push({
        name: "super-admin-tenants",
        query: route.query,
      });
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteTenant = async () => {
    const confirmed = await dialog({
      title: t("core.tenant.actions.delete.confirm", {
        name: tenant.name,
      }),
      message: t("actions.delete"),
    });

    if (!confirmed) return;

    DefaultService.deleteTenant(tenant.id)
      .then(() => {
        toast({ title: t("actions.deleted") });
        void router.push({
          name: "super-admin-tenants",
          query: route.query,
        });
      })
      .catch(handleError);
  };

  const backToTenantList = () => {
    void router.push({
      name: "super-admin-tenants",
      query: route.query,
    });
  };

  return {
    v$,
    tenant,
    loading,
    fetchTenant,
    saveTenant,
    deleteTenant,
    clearName,
    clearSubdomain,
    backToTenantList,
  };
}
