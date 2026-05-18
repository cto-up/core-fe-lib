// src/composables/useTenantConfig.ts
import {
  DefaultService,
  type Config,
  type NewConfig,
} from "../../openapi/core";
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";
import type { GetDefaultFn } from "./useGlobalConfig";

export function useTenantConfig(getDefault?: GetDefaultFn) {
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialog();
  const { handleError } = useErrors();

  const tenantConfig = reactive<Config>({
    id: "",
    name: "",
    value: "",
  });

  const { t } = useI18n();
  const loading = ref(false);
  const rules = {
    name: { required, $autoDirty: true, maxLength: maxLength(50) },
  };

  const v$ = useVuelidate(rules, tenantConfig as Config);

  const fetchTenantConfig = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getTenantConfigById(
          route.params.id as string
        );
        Object.assign(tenantConfig, response);
      } catch (e) {
        handleError(e);
      }
    } else if (route.query.name) {
      tenantConfig.name = route.query.name as string;
      const def = getDefault?.(tenantConfig.name);
      if (def !== undefined) {
        tenantConfig.value = def;
      }
    }
  };

  const saveTenantConfig = async () => {
    const isFormCorrect = await v$.value.$validate();

    if (!isFormCorrect) {
      toast({
        title: t("info.invalidForm"),
      });
      return;
    }

    loading.value = true;
    try {
      if (!tenantConfig.id) {
        const newTenantConfig = await DefaultService.addTenantConfig({
          ...tenantConfig,
        } as NewConfig);
        tenantConfig.id = newTenantConfig.id;
      } else {
        await DefaultService.updateTenantConfig(tenantConfig.id, {
          ...tenantConfig,
        });
      }
      toast({ title: t("actions.saved") });
      void router.push({
        name: "tenant-configs",
        query: route.query,
      });
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteTenantConfig = async () => {
    const confirmed = await dialog({
      title: t("core.tenantConfig.actions.delete.confirm", {
        name: tenantConfig.name,
      }),
      message: t("actions.delete"),
    });

    if (!confirmed) return;

    DefaultService.deleteTenantConfig(tenantConfig.id)
      .then(() => {
        toast({ title: t("actions.deleted") });
        void router.push({
          name: "tenant-configs",
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };
  const backToTenantConfigList = () => {
    void router.push({
      name: "tenant-configs",
      query: route.query,
    });
  };

  return {
    v$,
    tenantConfig,
    loading,
    fetchTenantConfig,
    saveTenantConfig,
    deleteTenantConfig,
    backToTenantConfigList,
  };
}
