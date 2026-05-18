import { useToast } from "../ui/toast/use-toast";

/**
 * Replacement for Quasar's $q.notify() using shadcn-vue toast.
 */
export function useNotify() {
  const { toast } = useToast();

  const notify = (options: {
    message?: string;
    type?: "positive" | "negative" | "warning" | "info";
    position?: string;
    timeout?: number;
    caption?: string;
  }) => {
    const { message, type = "info", caption } = options;

    const variantMap = {
      positive: "default" as const,
      negative: "destructive" as const,
      warning: "default" as const,
      info: "default" as const,
    };

    toast({
      title: message || "",
      description: caption,
      variant: variantMap[type],
    });
  };

  return { notify };
}
