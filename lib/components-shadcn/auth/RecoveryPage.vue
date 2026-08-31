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

      <div v-if="error" class="rounded-md bg-error/10 p-4">
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

        <p v-if="conflictError" class="text-sm text-error">
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

      <!-- Invitation links have no password step, so there is no form submit to
           hang redemption on. A button buys the same guarantee for one click:
           a mail scanner renders this and leaves, and the token survives. -->
      <div
        v-if="showContinueGate && !loading && !conflict && !error && !success"
        class="rounded-md border bg-card p-4 space-y-4"
      >
        <p class="text-sm text-muted-foreground">
          {{
            tf(
              "continueBody",
              "Your link is ready. Confirm to open your account."
            )
          }}
        </p>
        <Button class="w-full" @click="handleContinue">
          {{ tf("continueButton", "Continue") }}
        </Button>
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
        v-if="showPasswordForm && !success && !conflict && !linkDead"
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

const loading = ref(false);
const statusMessage = ref("");
const error = ref("");
const success = ref(false);
const showPasswordForm = ref(false);
/**
 * Invitation links (`return_to`) never reach a password form, so there is no
 * submit to hang redemption on. They get an explicit button instead — the same
 * guarantee that a human, not a renderer, is what spends the token.
 */
const showContinueGate = ref(false);
const submitting = ref(false);

/** Captured at mount and held until a deliberate user action spends them. */
const pendingFlowId = ref("");
/** The token still owed to Kratos; cleared the moment it is spent. */
const pendingToken = ref("");
const pendingReturnTo = ref<string | undefined>(undefined);
/** Whether the link carried a token at all — for diagnostics, never cleared. */
const hadToken = ref(false);
/**
 * A session exists, by redemption or because the user adopted the one already
 * in the browser. Guards every retry: the token is gone by then, and
 * re-submitting it is the one thing guaranteed to fail.
 */
const sessionReady = ref(false);
/** The recovery token was rejected — only a fresh email can unblock the user. */
const linkDead = ref(false);
/** Reconstructed cause, shown to the user and forwarded to `reportFailure`. */
const report = ref<RecoveryFailureReport | null>(null);
/**
 * A session was already live when the token was submitted, and nothing here can
 * tell whether it belongs to the same person. Holds what is needed to resume
 * either way once the user has said which account the link is for.
 */
const conflict = ref<{ email: string } | null>(null);
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
 * Spend the recovery token and prove that a session came back.
 *
 * Only ever called from a user action. Redeeming on mount meant that anything
 * which merely RENDERED the page — a corporate mail sandbox detonating the
 * link, a restored mobile tab — burned the one-time token, and the person who
 * clicked afterwards was told their link had already been used. It had: by a
 * machine, on their behalf.
 *
 * Returns false when the page has already told the user what went wrong.
 * Throws for anything the caller should translate.
 */
const redeemToken = async (): Promise<boolean> => {
  // Nothing left to spend: already redeemed, adopted the live session, or the
  // link never carried a token in the first place.
  if (sessionReady.value) return true;
  if (!pendingToken.value) {
    sessionReady.value = true;
    return true;
  }

  statusMessage.value = t("auth.recovery.activatingLink");
  try {
    await kratosService.submitRecoveryFlow(pendingFlowId.value, {
      method: "link",
      token: pendingToken.value,
    });
  } catch (err) {
    const kratosError = extractKratosError(err);
    if (kratosError?.id !== KratosErrorIds.SESSION_ALREADY_AVAILABLE) throw err;

    // Kratos refuses a recovery submission whenever a session cookie is
    // present, and it does so BEFORE reading the token — so this error proves
    // a session exists, never that it is the one this link belongs to. The
    // flow does not name the identity it was minted for either, so there is
    // nothing here to compare. Treating it as "same person" silently sets the
    // signed-in account's password from a stranger's link and leaves the real
    // token unspent. Hand the choice to the only party that can make it.
    const current = await kratosService
      .getSession({ force: true })
      .catch(() => null);
    console.warn(
      "⚠️  A session was already live; asking the user whose it is."
    );
    conflict.value = { email: current?.identity?.traits?.email ?? "" };
    statusMessage.value = "";
    return false;
  }

  // The POST resolving proves NOTHING about the token. Kratos answers a
  // browser recovery flow with a 303 whether it accepted the token or rejected
  // it (expired / already used → it mints a fresh flow and redirects to the
  // recovery UI carrying the error), and submitRecoveryFlow uses
  // `redirect: "manual"`, which makes every redirect an opaque status-0
  // response with unreadable headers. Success and failure are therefore
  // indistinguishable at the call site.
  //
  // The session cookie is the only honest signal: it exists if and only if the
  // token was redeemed. Without this check a dead link sails on to
  // initSettingsFlow() and surfaces as "request does not have a valid
  // authentication session" — a 401 that reads like a bug in the app rather
  // than "ask for a new email", which is what the user actually needs.
  const session = await kratosService
    .getSession({ force: true })
    .catch(() => null);
  if (!session?.active) {
    console.warn("❌ Recovery token was not redeemed — no session.");
    await failAsDeadLink("activate", pendingFlowId.value, true);
    return false;
  }

  pendingToken.value = "";
  sessionReady.value = true;
  return true;
};

/**
 * Open the settings flow that will carry the new password — once.
 *
 * Reused verbatim on a retry. When Kratos rejects a password for being too
 * weak the flow is still live but the token that opened it is long spent, so
 * deriving a fresh one is precisely what cannot work.
 */
const openSettingsFlow = async (): Promise<boolean> => {
  if (settingsFlowId.value && csrfToken.value) return true;

  const flow = await kratosService.initSettingsFlow().catch(async (err) => {
    const kratosError = extractKratosError(err);
    if (kratosError?.id !== KratosErrorIds.SESSION_AAL2_REQUIRED) throw err;

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
    return false;
  }
  return true;
};

/**
 * Turn a failure of the link lifecycle — redeeming, or opening settings — into
 * what the user sees. Shared by both entry points so the invitation gate and
 * the password form report a dead link identically.
 */
const reportRecoveryError = async (
  stage: RecoveryFailureStage,
  err: unknown
) => {
  console.error("❌ Recovery process failed:", err);
  const kratosError = extractKratosError(err);
  console.error("Error details:", {
    status: kratosError?.code,
    data: kratosError,
  });

  // AAL2 must be tested FIRST and excluded. `session_aal2_required` is also a
  // 403, but it means the opposite: the link redeemed, the session is live, and
  // the user simply declined the MFA prompt. Sending them to "request a new
  // link" would be a dead end — a fresh link lands them right back here.
  if (kratosError?.id === KratosErrorIds.SESSION_AAL2_REQUIRED) {
    error.value = t("auth.recovery.sessionExpired");
    // Diagnostics without telemetry: cancelling MFA is a choice, not an
    // incident, but the details still help if the user reports confusion.
    await attachDiagnostics(
      stage,
      pendingFlowId.value,
      hadToken.value,
      err,
      false
    );
  } else if (kratosError?.code === 401 || kratosError?.code === 403) {
    // No usable session, which on this page only ever has one cause: the
    // recovery link did not redeem. Say that, and offer the one action that
    // fixes it.
    await failAsDeadLink(stage, pendingFlowId.value, hadToken.value, err);
  } else {
    error.value =
      getUserFriendlyMessage(err) ||
      (err instanceof Error ? err.message : null) ||
      t("auth.recovery.processingError");
    await attachDiagnostics(stage, pendingFlowId.value, hadToken.value, err);
  }
};

/** Clear the last attempt's verdict so a retry is judged on its own merits. */
const beginAttempt = () => {
  error.value = "";
  linkDead.value = false;
  report.value = null;
};

/**
 * The invitation path: redeem, then hand the user on to where the link was
 * pointing. No password is set here — the account already has one.
 */
const handleContinue = async () => {
  if (loading.value) return;
  loading.value = true;
  beginAttempt();
  try {
    if (!(await redeemToken())) return;
    await getCurrentSession();
    void router.push(pendingReturnTo.value ?? props.homePath);
  } catch (err) {
    await reportRecoveryError("activate", err);
  } finally {
    loading.value = false;
  }
};

const handlePasswordSubmit = async () => {
  passwordError.value = "";

  // Validated BEFORE anything is spent. A mistyped confirmation must not cost
  // the user their one-time link.
  if (password.value !== confirmPassword.value) {
    passwordError.value = t("auth.recovery.passwordsDoNotMatch");
    return;
  }

  if (password.value.length < 8) {
    passwordError.value = t("auth.recovery.passwordTooShort");
    return;
  }

  submitting.value = true;
  beginAttempt();

  try {
    // Redeeming and opening the settings flow are link-lifecycle steps: when
    // they fail the link is dead, which is a different conversation from "that
    // password is too weak" and needs a different answer on screen.
    try {
      if (!(await redeemToken())) return;
      if (!(await openSettingsFlow())) return;
    } catch (err) {
      await reportRecoveryError(
        sessionReady.value ? "settings" : "activate",
        err
      );
      return;
    }

    statusMessage.value = t("auth.recovery.pleaseSetPassword");
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

    // The token is spent by now, so a rejected password must never send the
    // user back for a new link. The settings flow is still live: correct the
    // password and submit again.
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

/** Re-enter whichever action the session-conflict card interrupted. */
const resumeAfterConflict = async () => {
  if (showContinueGate.value) await handleContinue();
  else await handlePasswordSubmit();
};

/**
 * "This link is for another account." Drop the session so Kratos stops
 * refusing, then redeem the token for whoever it actually belongs to.
 *
 * If the token turns out to be spent, the retry fails as a dead link and the
 * user is offered a fresh one — the honest end to a link that was never proven
 * good in the first place.
 */
const signOutAndUseLink = async () => {
  if (!conflict.value || resolving.value) return;
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
    await resumeAfterConflict();
  } finally {
    resolving.value = false;
  }
};

/**
 * "That account is mine." Keep the live session and set ITS password. The
 * token stays unspent: nothing ever established that it was valid.
 */
const continueAsCurrentUser = async () => {
  if (!conflict.value || resolving.value) return;
  resolving.value = true;
  conflictError.value = "";
  try {
    pendingToken.value = "";
    sessionReady.value = true;
    conflict.value = null;
    await resumeAfterConflict();
  } finally {
    resolving.value = false;
  }
};

onMounted(() => {
  const flowId = route.query.flow as string;
  const token = (route.query.token as string) ?? "";
  const returnTo = route.query.return_to as string | undefined;

  console.log("🎬 RecoveryPage mounted:", {
    flowId,
    token: token ? token.substring(0, 10) + "..." : "",
    currentUrl: globalThis.location.href,
    origin: globalThis.location.origin,
  });

  if (!flowId) {
    error.value = t("auth.recovery.invalidLink");
    return;
  }

  pendingFlowId.value = flowId;
  pendingToken.value = token;
  hadToken.value = Boolean(token);
  pendingReturnTo.value = returnTo;

  // Before anything else, and without a network call: a token left in the
  // address bar sits in the history, leaks through the Referer of every asset
  // the page loads, and is re-submitted by a plain reload.
  if (token) stripTokenFromUrl();

  // Nothing is spent here. The page only offers the action that will spend it.
  if (returnTo && token) {
    statusMessage.value = tf(
      "continuePrompt",
      "Confirm below to finish opening your account."
    );
    showContinueGate.value = true;
  } else {
    statusMessage.value = t("auth.recovery.pleaseSetPassword");
    showPasswordForm.value = true;
  }
});
</script>
