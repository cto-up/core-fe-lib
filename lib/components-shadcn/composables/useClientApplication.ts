// src/composables/useClientApplication.ts
import {
  DefaultService,
  type ClientApplication,
  type NewClientApplication,
} from "../../openapi/core";
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { maxLength, required } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";

export function useClientApplication() {
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const { dialog } = useDialog();
  const { handleError } = useErrors();

  const clientApplication = reactive<ClientApplication>({
    id: "",
    name: "",
    description: "",
    active: true,
  });

  const { t } = useI18n();
  const loading = ref(false);
  const rules = {
    name: { required, $autoDirty: true, maxLength: maxLength(50) },
    description: { required, $autoDirty: true, maxLength: maxLength(50) },
    active: { required, $autoDirty: true, maxLength: maxLength(50) },
  };

  const v$ = useVuelidate(rules, clientApplication as ClientApplication);

  const fetchClientApplication = async () => {
    if (route.params.id) {
      try {
        const response = await DefaultService.getClientApplicationById(
          route.params.id as string
        );
        Object.assign(clientApplication, response);
      } catch (e) {
        handleError(e);
      }
    }
  };

  const saveClientApplication = async () => {
    const isFormCorrect = await v$.value.$validate();

    if (!isFormCorrect) {
      toast({
        title: t("info.invalidForm"),
        variant: "destructive",
      });
      return;
    }

    loading.value = true;
    try {
      if (!clientApplication.id) {
        const newClientApplication =
          await DefaultService.createClientApplication({
            ...clientApplication,
          } as NewClientApplication);
        clientApplication.id = newClientApplication.id;
      } else {
        await DefaultService.updateClientApplication(clientApplication.id, {
          ...clientApplication,
        });
      }
      toast({ title: t("actions.saved"), variant: "default" });
      void router.push({
        name: "client-applications",
        query: route.query,
      });
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteClientApplication = async () => {
    const confirmed = await dialog({
      message: t("core.clientApplication.actions.delete.confirm", {
        name: clientApplication.name,
      }),
      cancel: t("actions.cancel"),
      ok: t("actions.delete"),
    });

    if (!confirmed) return;

    DefaultService.deleteClientApplication(clientApplication.id)
      .then(() => {
        toast({ title: t("actions.deleted"), variant: "default" });
        void router.push({
          name: "client-applications",
          query: route.query,
        });
      })
      .catch((e) => {
        handleError(e);
      });
  };

  const backToClientApplicationList = () => {
    void router.push({
      name: "client-applications",
      query: route.query,
    });
  };

  return {
    v$,
    clientApplication,
    loading,
    fetchClientApplication,
    saveClientApplication,
    deleteClientApplication,
    backToClientApplicationList,
  };
}
