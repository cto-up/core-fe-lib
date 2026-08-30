<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background/50 p-4"
  >
    <AppBackground />
    <Card class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80">
      <CardHeader>
        <CardTitle>{{ t("mfa.aal2.webauthnTitle") }}</CardTitle>
        <CardDescription>
          {{ t("mfa.aal2.webauthnDescription") }}
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <div v-if="state.loading" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-primary animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t("mfa.aal2.webauthnProcessing") }}
          </p>
        </div>

        <div v-else-if="state.error" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p class="text-sm text-error mb-4">
            {{ state.error }}
          </p>
          <Button variant="outline" @click="cancel">
            {{ t("actions.cancel") }}
          </Button>
        </div>

        <div v-else class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            {{ state.notice || t("mfa.aal2.webauthnReady") }}
          </p>
          <div class="flex flex-col items-center gap-2">
            <Button @click="runCeremony()">
              {{ t("mfa.aal2.webauthnStart") }}
            </Button>
            <Button variant="ghost" size="sm" @click="cancel">
              {{ t("actions.cancel") }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  kratosService,
  getUserFriendlyMessage,
  type KratosFlowNode,
  type WebAuthnLoginFlowData,
} from "../../authentication";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(
  defineProps<{
    homePath?: string;
  }>(),
  { homePath: "/" }
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

interface PreparedCeremony {
  flowId: string;
  csrfToken: string;
  userEmail: string;
  requestOptions: PublicKeyCredentialRequestOptions;
}

const state = reactive({
  loading: true,
  error: "",
  notice: "",
});

let prepared: PreparedCeremony | null = null;

// Popup mode: opened by the AAL2 dialog via useAal2().submitWebAuthnVerification.
// Report the result to the opener via postMessage and close, instead of
// navigating return_to (which would full-page-reload the opener and lose state).
const isPopup =
  route.query.mode === "popup" &&
  !!globalThis.opener &&
  !globalThis.opener.closed;

function reportToOpener(success: boolean) {
  const returnTo = route.query.return_to as string | undefined;
  const targetOrigin = returnTo ? new URL(returnTo).origin : "*";
  globalThis.opener?.postMessage(
    { type: "aal2-webauthn", success },
    targetOrigin
  );
  globalThis.close();
}

onMounted(async () => {
  try {
    prepared = await prepareCeremony();
  } catch (error: unknown) {
    console.error("WebAuthn verification failed:", error);
    state.error = describeError(error);
    state.loading = false;
    return;
  }
  // WebKit rejects credentials.get() outside a user gesture, which this page
  // does not have on load. Try once for engines that allow it, and fall back
  // to the explicit button below.
  await runCeremony(true);
});

/**
 * Fetches the flow and decodes the challenge. Kept separate from the ceremony
 * so runCeremony() can call the authenticator without an intervening await,
 * which would consume the transient user activation WebKit requires.
 */
async function prepareCeremony(): Promise<PreparedCeremony> {
  state.loading = true;
  state.error = "";

  // Get current session
  const session = await kratosService.getSession();
  if (!session?.identity?.traits?.email) {
    throw new Error("No active session found");
  }

  const userEmail = session.identity.traits.email;

  // Initialize AAL2 upgrade flow
  const flow = await kratosService.initAal2UpgradeFlow();

  // Extract CSRF token and WebAuthn challenge
  let csrfToken = "";
  let webauthnChallenge: string | undefined;

  flow.ui?.nodes?.forEach((node: KratosFlowNode) => {
    if (node.attributes?.name === "csrf_token") {
      csrfToken = String(node.attributes.value || "");
    } else if (node.attributes?.name === "webauthn_login_trigger") {
      webauthnChallenge = String(node.attributes.value);
    }
  });

  if (!webauthnChallenge) {
    throw new Error("No WebAuthn challenge available");
  }

  // Parse and prepare WebAuthn challenge
  const publicKeyOptions = JSON.parse(webauthnChallenge);
  const requestOptions: PublicKeyCredentialRequestOptions = {
    ...publicKeyOptions.publicKey,
    challenge: base64urlToArrayBuffer(publicKeyOptions.publicKey.challenge),
    allowCredentials: publicKeyOptions.publicKey.allowCredentials?.map(
      (cred: PublicKeyCredentialDescriptor & { id: string }) => ({
        ...cred,
        id: base64urlToArrayBuffer(cred.id as unknown as string),
      })
    ),
  };

  return { flowId: flow.id, csrfToken, userEmail, requestOptions };
}

async function runCeremony(auto = false) {
  if (!prepared) return;

  state.loading = true;
  state.error = "";
  state.notice = "";

  try {
    // Must remain the first await in this function: on WebKit the transient
    // user activation from the click is gone once anything else is awaited.
    const credential = (await navigator.credentials.get({
      publicKey: prepared.requestOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new DOMException(
        "WebAuthn authentication was cancelled",
        "NotAllowedError"
      );
    }

    // Format credential for Kratos
    const assertionResponse =
      credential.response as AuthenticatorAssertionResponse;

    const credentialData = {
      id: credential.id,
      rawId: arrayBufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: arrayBufferToBase64url(
          assertionResponse.authenticatorData
        ),
        clientDataJSON: arrayBufferToBase64url(
          assertionResponse.clientDataJSON
        ),
        signature: arrayBufferToBase64url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? arrayBufferToBase64url(assertionResponse.userHandle)
          : null,
      },
    };

    // Submit to Kratos
    const webauthnData: WebAuthnLoginFlowData = {
      method: "webauthn",
      csrf_token: prepared.csrfToken,
      identifier: prepared.userEmail,
      webauthn_login: JSON.stringify(credentialData),
    };

    await kratosService.submitLoginFlow(prepared.flowId, webauthnData);

    // Success - report to opener (popup) or redirect back to return_to URL
    if (isPopup) {
      reportToOpener(true);
      return;
    }
    const returnTo = route.query.return_to as string;
    if (returnTo) {
      globalThis.location.href = returnTo;
    } else {
      router.push(props.homePath);
    }
  } catch (error: unknown) {
    // NotAllowedError covers both "no user activation" (WebKit, on the
    // automatic attempt) and a prompt the user dismissed. Both recover the
    // same way: fall back to letting the user start the ceremony themselves.
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      state.notice = auto ? "" : t("mfa.aal2.webauthnCancelled");
      return;
    }
    console.error("WebAuthn verification failed:", error);
    state.error = describeError(error);
  } finally {
    state.loading = false;
  }
}

function describeError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Security key verification was cancelled or timed out";
    }
    if (error.name === "NotSupportedError") {
      return "WebAuthn is not supported by your browser";
    }
  }
  return (
    getUserFriendlyMessage(error) ||
    (error instanceof Error ? error.message : "WebAuthn verification failed")
  );
}

function cancel() {
  if (isPopup) {
    reportToOpener(false);
    return;
  }
  const returnTo = route.query.return_to as string;
  if (returnTo) {
    globalThis.location.href = returnTo;
  } else {
    router.push(props.homePath);
  }
}

// Helper functions for WebAuthn base64url encoding
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCodePoint(bytes[i]);
  }
  const base64 = globalThis.btoa(binary);
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = base64 + padding;
  const binaryString = globalThis.atob(base64Padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
</script>
