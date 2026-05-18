import { DefaultService, type NewAPIToken } from "../../openapi/core";
import { ref, reactive } from "vue";
import { useErrors } from "../composables/useErrors";
import useVuelidate from "@vuelidate/core";
import { required, maxLength } from "@vuelidate/validators";
import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";

export function useAPIToken(clientApplicationId: string) {
  const { toast } = useToast();
  const { handleError } = useErrors();
  const { t } = useI18n();

  const apiToken = reactive<NewAPIToken>({
    name: "",
    description: "",
    expiresAt: "",
    clientApplicationId: clientApplicationId,
    applicationName: "",
    tokenPrefix: "",
    scopes: [],
  });

  const loading = ref(false);
  const rules = {
    name: { required, maxLength: maxLength(50) },
    expiresAt: { required },
  };

  const v$ = useVuelidate(rules, apiToken as NewAPIToken);

  const saveAPIToken = async () => {
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
      const result = await DefaultService.createApiToken(
        clientApplicationId,
        apiToken
      );
      toast({ title: t("actions.saved"), variant: "default" });
      return result;
    } catch (e) {
      handleError(e);
    } finally {
      loading.value = false;
    }
  };

  const revokeAPIToken = async (tokenId: string, reason: string) => {
    try {
      await DefaultService.revokeApiToken(clientApplicationId, tokenId, {
        reason,
      });
      toast({ title: t("actions.revoked"), variant: "default" });
    } catch (e) {
      handleError(e);
    }
  };

  const deleteAPIToken = async (tokenId: string) => {
    try {
      await DefaultService.deleteApiToken(clientApplicationId, tokenId);
      toast({ title: t("actions.deleted"), variant: "default" });
    } catch (e) {
      handleError(e);
    }
  };

  return {
    apiToken,
    loading,
    v$,
    saveAPIToken,
    revokeAPIToken,
    deleteAPIToken,
  };
}
