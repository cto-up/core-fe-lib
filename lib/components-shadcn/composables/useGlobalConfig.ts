// src/composables/useGlobalConfig.ts
import {
  DefaultService,
  type Config,
  type NewConfig,
} from "../../openapi/core";
import { ref, reactive, toRefs } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";

/**
 * Strategy callback: given a config key, returns its default value if the
 * caller's schema declares one. The composable applies this default when the
 * user opens "create new" with `?name=<key>` in the URL.
 */
export type GetDefaultFn = (key: string) => string | undefined;

export function useGlobalConfig(getDefault?: GetDefaultFn) {
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialog();
  const { handleError } = useErrors();

  const globalConfig = reactive<Config>({
    id: "",
    name: "",
    value: "",
  });

  const { t } = useI18n();
  const loading = ref(false);
  const rules = {
    name: { required, $autoDirty: true, maxLength: maxLength(50) },
  };

  const v$ = useVuelidate(rules, toRefs(globalConfig));

  const fetchGlobalConfig = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getGlobalConfigById(
          route.params.id as string
        );
        Object.assign(globalConfig, response);
      } catch (e) {
        handleError(e);
      }
    } else if (route.query.name) {
      globalConfig.name = route.query.name as string;
      const def = getDefault?.(globalConfig.name);
      if (def !== undefined) {
        globalConfig.value = def;
      }
    }
  };

  const saveGlobalConfig = async () => {
    const isFormCorrect = await v$.value.$validate();

    if (!isFormCorrect) {
      toast({
        title: t("info.invalidForm"),
      });
      return;
    }

    loading.value = true;
    try {
      if (!globalConfig.id) {
        const newGlobalConfig = await DefaultService.addGlobalConfig({
          ...globalConfig,
        } as NewConfig);
        globalConfig.id = newGlobalConfig.id;
      } else {
        await DefaultService.updateGlobalConfig(globalConfig.id, {
          ...globalConfig,
        });
      }
      toast({ title: t("actions.saved") });
      void router.push({
        name: "global-configs",
        query: route.query,
      });
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteGlobalConfig = async () => {
    const confirmed = await dialog({
      title: t("core.globalConfig.actions.delete.confirm", {
        name: globalConfig.name,
      }),
      message: t("actions.delete"),
    });

    if (!confirmed) return;

    DefaultService.deleteGlobalConfig(globalConfig.id)
      .then(() => {
        toast({ title: t("actions.deleted") });
        void router.push({
          name: "global-configs",
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const backToGlobalConfigList = () => {
    void router.push({
      name: "global-configs",
      query: route.query,
    });
  };

  return {
    v$,
    globalConfig,
    loading,
    fetchGlobalConfig,
    saveGlobalConfig,
    deleteGlobalConfig,
    backToGlobalConfigList,
  };
}
