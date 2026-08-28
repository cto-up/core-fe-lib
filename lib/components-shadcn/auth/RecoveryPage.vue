<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background/50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <AppBackground />
    <div class="relative z-10 max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-foreground">
          {{ t("auth.recovery.title") }}
        </h2>
        <p class="mt-2 text-center text-sm text-muted-foreground">
          {{ statusMessage }}
        </p>
      </div>

      <div v-if="error" class="rounded-md bg-destructive/10 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-foreground">
              {{ error }}
            </h3>
            <p
              v-if="!report || report.reason !== 'cookies_blocked'"
              class="mt-2 text-sm text-muted-foreground"
            >
              {{ t("auth.recovery.requestNewLink") }}
            </p>
            <Button
              v-if="linkDead"
              class="mt-4"
              @click="router.push(props.recoveryRequestPath)"
            >
              {{ tf("requestNewLinkButton", "Request a new link") }}
            </Button>

            <!-- Shown to the USER on purpose. When this fails again, the
                 person in front of the screen is the only reporter we have;
                 a screenshot of these fields is what makes it diagnosable
                 without asking them to open devtools. Discreet by default so
                 it never competes with the actual instruction above. -->
            <div v-if="report" class="mt-4">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                :aria-expanded="detailsOpen"
                @click="detailsOpen = !detailsOpen"
              >
                <ChevronDown v-if="detailsOpen" class="h-3 w-3" />
                <ChevronRight v-else class="h-3 w-3" />
                {{ tf("diagnosticsTitle", "Technical details") }}
              </button>

              <div v-if="detailsOpen">
                <dl
                  class="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground"
                >
                  <div
                    v-for="row in diagnosticRows"
                    :key="row.label"
                    class="flex gap-2"
                  >
                    <dt class="shrink-0 opacity-70">{{ row.label }}</dt>
                    <dd class="break-all">{{ row.value }}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  size="sm"
                  class="mt-3"
                  @click="copyDiagnostics"
                >
                  <Check v-if="copied" class="mr-1.5 h-3 w-3" />
                  <Copy v-else class="mr-1.5 h-3 w-3" />
                  {{
                    copied
                      ? tf("diagnosticsCopied", "Copied")
                      : tf("diagnosticsCopy", "Copy details")
                  }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="success" class="rounded-md bg-success/10 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-foreground">
              {{ t("auth.recovery.passwordSetSuccess") }}
            </h3>
          </div>
        </div>
      </div>

      <!-- Kratos refused the token because a session cookie was present. It
           rejects on that alone, BEFORE it looks at the token, so this says
           nothing about whose session it is — and a recovery flow never names
           the identity it was minted for. Assuming "same person" would set the
           signed-in account's password from someone else's link and leave the
           real token unspent, so the one party who knows which inbox this link
           arrived in decides. -->
      <div v-if="conflict" class="rounded-md border bg-card p-4 space-y-4">
        <h3 class="text-sm font-medium text-foreground">
          {{ tf("conflictTitle", "You're already signed in") }}
        </h3>

        <div
          v-if="conflict.email"
          class="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
        >
          <UserRound class="h-5 w-5 shrink-0 text-muted-foreground" />
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground/70">
              {{ tf("conflictSignedInAs", "Signed in as") }}
            </p>
            <p class="truncate text-sm font-medium">{{ conflict.email }}</p>
          </div>
        </div>

        <p class="text-sm text-muted-foreground">
          {{
            tf(
              "conflictBody",
              "If this link was sent to a different address, sign out first — otherwise you would be changing the password of the account above."
            )
          }}
        </p>

        <p v-if="conflictError" class="text-sm text-destructive">
          {{ conflictError }}
        </p>

        <div class="flex flex-col gap-2 sm:flex-row">
          <Button
            class="w-full"
            :disabled="resolving"
            @click="signOutAndUseLink"
          >
            {{ tf("conflictUseLink", "Sign out and open the link") }}
          </Button>
          <Button
            variant="outline"
            class="w-full"
            :disabled="resolving"
            @click="continueAsCurrentUser"
          >
            {{ tf("conflictContinue", "Continue with this account") }}
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !showPasswordForm" class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        />
        <p class="mt-2 text-muted-foreground">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Password Form -->
      <form
        v-if="showPasswordForm && !success"
        class="mt-8 space-y-6"
        @submit.prevent="handlePasswordSubmit"
      >
        <div class="rounded-md shadow-sm space-y-4">
          <PasswordInput
            id="password"
            v-model="password"
            :label="t('auth.recovery.newPasswordLabel')"
            :placeholder="t('auth.recovery.newPasswordPlaceholder')"
            :error="passwordError"
            required
            @input="passwordError = ''"
          />
          <PasswordInput
            id="confirm-password"
            v-model="confirmPassword"
            :label="t('auth.recovery.confirmPasswordLabel')"
            :placeholder="t('auth.recovery.confirmPasswordPlaceholder')"
            :error="mismatchError"
            required
          />
        </div>
        <div
          v-if="passwordError"
          class="text-sm text-destructive dark:text-destructive"
        >
          {{ passwordError }}
        </div>

        <div>
          <Button
            type="submit"
            :disabled="
              submitting || !password || !confirmPassword || !passwordsMatch
            "
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{
              submitting
                ? t("auth.recovery.settingPassword")
                : t("auth.recovery.setPasswordButton")
            }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  UserRound,
} from "lucide-vue-next";
import {
  extractKratosError,
  extractValidationErrors,
  getUserFriendlyMessage,
  KratosErrorIds,
  useKratosAuth,
  useAal2Store,
} from "../../authentication/vue";
import {
  kratosService,
  KratosFlowType,
} from "../../authentication/core/kratos-service";
import {
  buildDiagnosticRows,
  classifyRecoveryFailure,
  collectBrowserFacts,
  REASON_MESSAGE_FALLBACK,
  REASON_MESSAGE_KEY,
  type RecoveryFailureFacts,
  type RecoveryFailureReport,
  type RecoveryFailureStage,
} from "./recovery-diagnostics";
import { Button } from "../ui/button";
import PasswordInput from "../primitives/PasswordInput.vue";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(
  defineProps<{
    homePath?: string;
    /** Where the "request a new link" button goes when the link is spent. */
    recoveryRequestPath?: string;
    /**
     * Optional sink for a failure report (hub wires this to Sentry).
     * Injected rather than imported: core-fe-lib is consumed by apps that do
     * not ship Sentry, and a hard dependency here would break their build.
     */
    reportFailure?: (report: RecoveryFailureReport) => void;
  }>(),
  {
    homePath: "/",
    recoveryRequestPath: "/user/me/password-reset-request",
    reportFailure: undefined,
  }
);

const route = useRoute();
const router = useRouter();
// Consumer apps may ship their own `auth.*` dictionary rather than
// core-fe-lib's, in which case keys added here would render as raw key paths.
// Every new string therefore carries a literal fallback.
const { t, te } = useI18n();
const tf = (key: string, fallback: string): string => {
  const full = `auth.recovery.${key}`;
  return te(full) ? t(full) : fallback;
};
const { getCurrentSession, clearSession } = useKratosAuth();
const aal2Store = useAal2Store();

const loading = ref(true);
const statusMessage = ref(t("auth.recovery.activatingLink"));
const error = ref("");
const success = ref(false);
const showPasswordForm = ref(false);
const submitting = ref(false);
/** The recovery token was rejected — only a fresh email can unblock the user. */
const linkDead = ref(false);
/** Reconstructed cause, shown to the user and forwarded to `reportFailure`. */
const report = ref<RecoveryFailureReport | null>(null);
/**
 * A session was already live when the token was submitted, and nothing here can
 * tell whether it belongs to the same person. Holds what is needed to resume
 * either way once the user has said which account the link is for.
 */
const conflict = ref<{
  flowId: string;
  token: string;
  returnTo?: string;
  email: string;
} | null>(null);
const resolving = ref(false);
/** Shown inside the conflict card, so the two choices stay on screen. */
const conflictError = ref("");

const password = ref("");
const confirmPassword = ref("");

const mismatchError = computed(() => {
  return confirmPassword.value &&
    password.value &&
    password.value != confirmPassword.value
    ? t("auth.recovery.mismatchedPasswords")
    : "";
});

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true;
  return password.value === confirmPassword.value;
});

const passwordError = ref("");

const settingsFlowId = ref("");
const csrfToken = ref("");

/**
 * Drop the one-time token from the address bar before it is spent. A reload, a
 * back-navigation or a mobile tab restore would otherwise re-submit a token
 * Kratos has already consumed, and the second attempt fails — turning a link
 * that worked into a dead one.
 */
const stripTokenFromUrl = () => {
  try {
    const url = new URL(globalThis.location.href);
    if (!url.searchParams.has("token")) return;
    url.searchParams.delete("token");
    globalThis.history.replaceState(
      globalThis.history.state,
      "",
      url.toString()
    );
  } catch {
    // Non-fatal: the token just stays visible in the URL.
  }
};

/**
 * Reconstruct what happened, from everything still observable after the fact.
 *
 * The flow is read back for its timestamps because that is the ONLY thing that
 * separates "expired" from "already used" — two causes that need different
 * advice from us, and which a single message conflated. It also yields
 * expires_at − issued_at, i.e. the lifespan the server is REALLY running, which
 * is the only way to notice from outside that a config change never got applied.
 * Best-effort: if the flow is gone, the report says unknown rather than guess.
 */
const buildReport = async (
  stage: RecoveryFailureStage,
  flowId: string,
  hadToken: boolean,
  err?: unknown
): Promise<RecoveryFailureReport> => {
  const browser = collectBrowserFacts();
  const kratosError = err === undefined ? undefined : extractKratosError(err);

  let flowExpiresAt: string | undefined;
  let flowIssuedAt: string | undefined;
  try {
    const flow = await kratosService.getFlow(KratosFlowType.Recovery, flowId);
    flowExpiresAt = flow?.expires_at;
    flowIssuedAt = flow?.issued_at;
  } catch {
    // Flow already pruned, or the id was never valid. Expiry stays unprovable
    // and classifyRecoveryFailure() reports "unknown" rather than inventing it.
  }

  const issuedMs = flowIssuedAt ? Date.parse(flowIssuedAt) : Number.NaN;
  const expiresMs = flowExpiresAt ? Date.parse(flowExpiresAt) : Number.NaN;
  const bothKnown = Number.isFinite(issuedMs) && Number.isFinite(expiresMs);

  const facts: RecoveryFailureFacts = {
    ...browser,
    flowId,
    hadToken,
    flowExpiresAt,
    flowIssuedAt,
    flowLifespanMinutes: bothKnown
      ? Math.round((expiresMs - issuedMs) / 60000)
      : undefined,
    linkAgeMs: Number.isFinite(issuedMs) ? browser.now - issuedMs : undefined,
    kratosErrorId: kratosError?.id,
    kratosErrorCode: kratosError?.code,
  };

  return { ...facts, stage, reason: classifyRecoveryFailure(facts) };
};

const notifyFailure = (built: RecoveryFailureReport) => {
  try {
    props.reportFailure?.(built);
  } catch (reportErr) {
    // Telemetry must never become the reason the page breaks.
    console.warn("Failed to report recovery failure:", reportErr);
  }
};

/**
 * Attach diagnostics to a failure the page is already reporting its own way
 * (a generic error, or a cancelled MFA prompt). `notify` is false for the MFA
 * case: the user chose to cancel, so it is not an incident and should not
 * pollute the Sentry signal.
 */
const attachDiagnostics = async (
  stage: RecoveryFailureStage,
  flowId: string,
  hadToken: boolean,
  err: unknown,
  notify = true
) => {
  const built = await buildReport(stage, flowId, hadToken, err);
  report.value = built;
  if (notify) notifyFailure(built);
};

const failAsDeadLink = async (
  stage: RecoveryFailureStage,
  flowId: string,
  hadToken: boolean,
  err?: unknown
) => {
  const built = await buildReport(stage, flowId, hadToken, err);

  report.value = built;
  // A replacement link cannot fix a browser that refuses to store the session
  // cookie, so don't offer one — it would loop the user forever.
  linkDead.value = built.reason !== "cookies_blocked";
  statusMessage.value = "";
  error.value = tf(
    REASON_MESSAGE_KEY[built.reason],
    REASON_MESSAGE_FALLBACK[built.reason]
  );
  loading.value = false;
  notifyFailure(built);
};

const detailsOpen = ref(false);
const diagnosticRows = computed(() =>
  report.value ? buildDiagnosticRows(report.value) : []
);

const copied = ref(false);
const copyDiagnostics = async () => {
  const text = diagnosticRows.value
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");
  try {
    await globalThis.navigator?.clipboard?.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // Clipboard denied (insecure context / permission). The details are still
    // on screen to read or screenshot, which is the point.
  }
};

/**
 * One end-to-end recovery attempt: redeem `token` if there is one, then open a
 * settings flow so the user can set a password.
 *
 * Re-entrant on purpose — the session-conflict card calls it again once the
 * user has said which account the link belongs to.
 *
 * `adoptedSession` marks the branch where the user kept the session already in
 * the browser rather than redeeming the token. It only gates `return_to`: with
 * no token spent, that redirect is warranted by the user's choice instead of by
 * the cookie check below.
 */
const runRecovery = async (
  flowId: string,
  token: string,
  returnTo?: string,
  adoptedSession = false
): Promise<void> => {
  loading.value = true;
  error.value = "";
  linkDead.value = false;
  report.value = null;

  try {
    // If a token is present, we need to submit it to activate the recovery
    // flow. On success Kratos redeems the token and sets a session cookie, at
    // which point we can init settings. See below for why the POST alone tells
    // us nothing about whether that happened.
    if (token) {
      statusMessage.value = t("auth.recovery.activatingLink");
      try {
        await kratosService.submitRecoveryFlow(flowId, {
          method: "link",
          token,
        });
      } catch (err) {
        const kratosError = extractKratosError(err);
        if (kratosError?.id !== KratosErrorIds.SESSION_ALREADY_AVAILABLE) {
          throw err;
        }

        // Kratos refuses a recovery submission whenever a session cookie is
        // present, and it does so BEFORE reading the token — so this error
        // proves a session exists, never that it is the one this link belongs
        // to. The flow does not name the identity it was minted for either, so
        // there is nothing here to compare. Treating it as "same person"
        // silently sets the signed-in account's password from a stranger's
        // link and leaves the real token unspent. Hand the choice to the only
        // party that can make it.
        const current = await kratosService
          .getSession({ force: true })
          .catch(() => null);
        console.warn(
          "⚠️  A session was already live; asking the user whose it is."
        );
        conflict.value = {
          flowId,
          token,
          returnTo,
          email: current?.identity?.traits?.email ?? "",
        };
        statusMessage.value = "";
        loading.value = false;
        return;
      }

      // The POST resolving proves NOTHING about the token. Kratos answers a
      // browser recovery flow with a 303 whether it accepted the token or
      // rejected it (expired / already used → it mints a fresh flow and
      // redirects to the recovery UI carrying the error), and submitRecoveryFlow
      // uses `redirect: "manual"`, which makes every redirect an opaque
      // status-0 response with unreadable headers. Success and failure are
      // therefore indistinguishable at the call site.
      //
      // The session cookie is the only honest signal: it exists if and only if
      // the token was redeemed. Without this check a dead link sails on to
      // initSettingsFlow() and surfaces as "request does not have a valid
      // authentication session" — a 401 that reads like a bug in the app rather
      // than "ask for a new email", which is what the user actually needs.
      const session = await kratosService
        .getSession({ force: true })
        .catch(() => null);
      if (!session?.active) {
        console.warn("❌ Recovery token was not redeemed — no session.");
        await failAsDeadLink("activate", flowId, true);
        return;
      }
    }

    // When a return_to destination is present (invitation flow), skip the
    // password-setting step and redirect directly. The user is now authenticated.
    if (returnTo && (token || adoptedSession)) {
      await getCurrentSession();
      void router.push(returnTo);
      return;
    }

    const flow = await kratosService.initSettingsFlow().catch(async (err) => {
      const kratosError = extractKratosError(err);
      if (kratosError?.id !== KratosErrorIds.SESSION_AAL2_REQUIRED) throw err;

      // Settings requires AAL2 — prompt the user to verify MFA, then retry
      console.log(
        "🔐 AAL2 required for settings flow, prompting verification..."
      );
      const verified = await aal2Store.triggerVerification();
      if (!verified) throw err; // user cancelled

      return kratosService.initSettingsFlow();
    });

    settingsFlowId.value = flow.id;
    console.log("✅ Settings flow created:", settingsFlowId.value);
    const csrfNode = flow.ui?.nodes?.find(
      (node) => node.attributes?.name === "csrf_token"
    );
    if (csrfNode) {
      csrfToken.value = csrfNode.attributes.value as string;
    }

    if (!csrfToken.value) {
      error.value = t("auth.recovery.csrfTokenError");
      loading.value = false;
      return;
    }

    statusMessage.value = t("auth.recovery.pleaseSetPassword");
    showPasswordForm.value = true;
    loading.value = false;
  } catch (err) {
    console.error("❌ Recovery process failed:", err);
    const kratosError = extractKratosError(err);
    console.error("Error details:", {
      status: kratosError?.code,
      data: kratosError,
    });

    // 401/403 out of the settings flow means there is no usable session, which
    // on this page only ever has one cause: the recovery link did not redeem.
    // Say that, and offer the one action that fixes it.
    //
    // AAL2 must be tested FIRST and excluded. `session_aal2_required` is also a
    // 403, but it means the opposite: the link redeemed, the session is live,
    // and the user simply declined the MFA prompt. Sending them to "request a
    // new link" would be a dead end — a fresh link lands them right back here.
    if (kratosError?.id === KratosErrorIds.SESSION_AAL2_REQUIRED) {
      error.value = t("auth.recovery.sessionExpired");
      // Diagnostics without telemetry: cancelling MFA is a choice, not an
      // incident, but the details still help if the user reports confusion.
      await attachDiagnostics("settings", flowId, Boolean(token), err, false);
    } else if (kratosError?.code === 401 || kratosError?.code === 403) {
      await failAsDeadLink("settings", flowId, Boolean(token), err);
      return;
    } else {
      error.value =
        getUserFriendlyMessage(err) ||
        (err instanceof Error ? err.message : null) ||
        t("auth.recovery.processingError");
      await attachDiagnostics("settings", flowId, Boolean(token), err);
    }
    loading.value = false;
  }
};

onMounted(async () => {
  const flowId = route.query.flow as string;
  const token = route.query.token as string;
  const returnTo = route.query.return_to as string | undefined;

  console.log("🎬 RecoveryPage mounted:", {
    flowId,
    token: token?.substring(0, 10) + "...",
    currentUrl: globalThis.location.href,
    origin: globalThis.location.origin,
  });

  if (!flowId) {
    error.value = t("auth.recovery.invalidLink");
    loading.value = false;
    return;
  }

  // Once, here rather than inside runRecovery: the conflict card may run the
  // recovery a second time, and the token it replays is the one captured above.
  if (token) stripTokenFromUrl();

  await runRecovery(flowId, token, returnTo);
});

/**
 * "This link is for another account." Drop the session so Kratos stops
 * refusing, then redeem the token for whoever it actually belongs to.
 *
 * If the token turns out to be spent, the retry fails as a dead link and the
 * user is offered a fresh one — the honest end to a link that was never proven
 * good in the first place.
 */
const signOutAndUseLink = async () => {
  const pending = conflict.value;
  if (!pending || resolving.value) return;
  resolving.value = true;
  conflictError.value = "";
  try {
    await clearSession();

    // clearSession swallows a failed logout by design. Re-running the recovery
    // on a session that is still live would draw this very card again, forever,
    // so check before retrying and say what actually went wrong instead.
    const stillLive = await kratosService
      .getSession({ force: true })
      .catch(() => null);
    if (stillLive?.active) {
      conflictError.value = tf(
        "conflictSignOutFailed",
        "We could not sign you out. Sign out from the menu, then open the link again."
      );
      return;
    }

    conflict.value = null;
    await runRecovery(pending.flowId, pending.token, pending.returnTo);
  } finally {
    resolving.value = false;
  }
};

/**
 * "That account is mine." Keep the live session and set ITS password — what
 * this page used to do unconditionally, now only when the user says so. The
 * token stays unspent: nothing ever established that it was valid.
 */
const continueAsCurrentUser = async () => {
  const pending = conflict.value;
  if (!pending || resolving.value) return;
  resolving.value = true;
  conflictError.value = "";
  try {
    conflict.value = null;
    await runRecovery(pending.flowId, "", pending.returnTo, true);
  } finally {
    resolving.value = false;
  }
};

const handlePasswordSubmit = async () => {
  passwordError.value = "";

  if (password.value !== confirmPassword.value) {
    passwordError.value = t("auth.recovery.passwordsDoNotMatch");
    return;
  }

  if (password.value.length < 8) {
    passwordError.value = t("auth.recovery.passwordTooShort");
    return;
  }

  submitting.value = true;

  try {
    const response = await kratosService.setPasswordAfterRecovery(
      settingsFlowId.value,
      password.value,
      csrfToken.value
    );

    console.log("✅ Password set successfully:", response);

    success.value = true;

    await getCurrentSession();
    console.log("✅ User session refreshed");

    setTimeout(() => {
      void (async () => {
        try {
          await router.push(props.homePath);
        } catch (e) {
          console.log(e);
        }
      })();
    }, 2000);
  } catch (err) {
    console.error("❌ Password set failed:", err);

    const validationErrors = extractValidationErrors(err);
    const passwordErrors = validationErrors.find((e) => e.field === "password");

    if (passwordErrors?.messages.length) {
      passwordError.value = passwordErrors.messages
        .map((m) => m.text)
        .join(". ");
      return;
    }

    passwordError.value =
      getUserFriendlyMessage(err) || t("auth.recovery.failedToSetPassword");
  } finally {
    submitting.value = false;
  }
};
</script>
