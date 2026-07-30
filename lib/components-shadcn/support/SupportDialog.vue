<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent
      :class="['flex max-h-[90vh] max-w-xl flex-col', zClass]"
      :overlay-class="zClass"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <LifeBuoy class="h-5 w-5 text-primary" />
          {{ t("support.title") }}
        </DialogTitle>
        <DialogDescription>{{ t("support.subtitle") }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 space-y-4 overflow-y-auto py-1">
        <!-- Topic -->
        <div class="space-y-2">
          <Label>{{ t("support.topicLabel") }}</Label>
          <RadioGroup
            v-model="topicModel"
            class="flex flex-wrap gap-x-5 gap-y-2"
          >
            <div
              v-for="opt in topicOptions"
              :key="opt.value"
              class="flex items-center gap-2"
            >
              <RadioGroupItem
                :id="`support-topic-${opt.value}`"
                :value="opt.value"
              />
              <Label
                :for="`support-topic-${opt.value}`"
                class="cursor-pointer font-normal"
                >{{ opt.label }}</Label
              >
            </div>
          </RadioGroup>
          <p class="text-xs text-muted-foreground">
            {{ t("support.sendingTo") }}
            <span class="font-mono text-foreground">{{ recipient }}</span>
          </p>
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <Label for="support-note">{{ t("support.noteLabel") }}</Label>
          <Textarea
            id="support-note"
            v-model="note"
            :placeholder="notePlaceholder"
            maxlength="1000"
            rows="6"
            class="min-h-[120px]"
          />
          <div class="flex items-center justify-between text-xs">
            <span :class="showNoteError ? 'text-destructive' : 'invisible'">
              {{ t("support.noteRequired") }}
            </span>
            <span class="font-mono text-muted-foreground"
              >{{ note.length }}/1000</span
            >
          </div>
        </div>

        <!-- Diagnostics (technical only) -->
        <div v-if="topic === 'technical'" class="space-y-2">
          <div class="flex items-center gap-2">
            <Switch id="support-screenshot" v-model:checked="withScreenshot" />
            <Label for="support-screenshot" class="cursor-pointer font-normal">
              {{ t("support.includeScreenshot") }}
            </Label>
          </div>
          <div
            v-if="capturing"
            class="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            {{ t("support.capturing") }}
          </div>
          <div
            v-else-if="withScreenshot && screenshotDataUrl"
            class="flex max-h-44 justify-center overflow-hidden rounded-md border bg-muted/40"
          >
            <img
              :src="screenshotDataUrl"
              alt=""
              class="max-h-44 object-contain"
            />
          </div>
        </div>

        <!-- Compose target -->
        <div class="space-y-2">
          <Label>{{ t("support.openInLabel") }}</Label>
          <RadioGroup
            v-model="providerModel"
            class="flex flex-wrap gap-x-5 gap-y-2"
          >
            <div
              v-for="opt in providerOptions"
              :key="opt.value"
              class="flex items-center gap-2"
            >
              <RadioGroupItem
                :id="`support-provider-${opt.value}`"
                :value="opt.value"
              />
              <Label
                :for="`support-provider-${opt.value}`"
                class="cursor-pointer font-normal"
                >{{ opt.label }}</Label
              >
            </div>
          </RadioGroup>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-between">
        <Button variant="ghost" @click="copyDetails">
          <Copy class="mr-2 h-4 w-4" />
          {{ t("support.copyDetails") }}
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" @click="emit('update:open', false)">
            {{ t("support.cancel") }}
          </Button>
          <Button :disabled="submitting" @click="submit">
            <component
              :is="provider === 'mailto' ? Mail : ExternalLink"
              class="mr-2 h-4 w-4"
            />
            {{ submitLabel }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Copy, ExternalLink, LifeBuoy, Loader2, Mail } from "lucide-vue-next";
import { useUserStore } from "../../stores/user-store";
import { useTenantStore } from "../../stores/tenant-store";
import { useConsoleBuffer } from "../../composables/useConsoleBuffer";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast/use-toast";
import type { SupportConfig, SupportProvider, SupportTopic } from "./types";

const props = withDefaults(
  defineProps<{
    open: boolean;
    config: SupportConfig;
    /** Which desks to offer, in display order. */
    topics?: SupportTopic[];
    /** Pre-selected topic each time the dialog opens. */
    defaultTopic?: SupportTopic;
    /** App version stamped into the context block. */
    version?: string;
    /** z-index utility applied to both the backdrop and the panel. Needed when
     *  the host sits above the default dialog layer (the marketing landing is
     *  a z-1000 full-screen takeover). */
    zClass?: string;
  }>(),
  {
    topics: () => ["technical", "sales", "other"] as SupportTopic[],
    defaultTopic: undefined,
    version: "",
    zClass: undefined,
  }
);

const emit = defineEmits<{ "update:open": [value: boolean] }>();

// A `mailto:` URL is capped by the OS/browser (~2k is the safe floor); webmail
// compose URLs tolerate far more. Past the limit we drop the log tail first.
const MAILTO_SAFE_LIMIT = 1800;
const WEBMAIL_SAFE_LIMIT = 6000;
const LOG_TAIL_COUNT = 20;
const LOG_LINE_MAX = 200;
const PROVIDER_STORAGE_KEY = "support.provider";

const { t, locale } = useI18n();
const route = useRoute();
const { toast } = useToast();
const userStore = useUserStore();
const tenantStore = useTenantStore();
const { getEntries } = useConsoleBuffer();

const firstTopic = computed<SupportTopic>(
  () => props.defaultTopic ?? props.topics[0] ?? "other"
);

const topic = ref<SupportTopic>(firstTopic.value);
const note = ref("");
const lastAutoNote = ref("");
const withScreenshot = ref(false);
const capturing = ref(false);
const submitting = ref(false);
const showNoteError = ref(false);
const screenshotDataUrl = ref<string | null>(null);
const screenshotBlob = ref<Blob | null>(null);

function loadProvider(): SupportProvider {
  try {
    const v = globalThis.localStorage?.getItem(PROVIDER_STORAGE_KEY);
    if (v === "gmail" || v === "outlook" || v === "mailto") return v;
  } catch {
    /* ignore */
  }
  return "mailto";
}
const provider = ref<SupportProvider>(loadProvider());

// radix's RadioGroup speaks plain strings; keep the typed refs behind proxies.
const topicModel = computed<string>({
  get: () => topic.value,
  set: (v) => {
    topic.value = v as SupportTopic;
  },
});
const providerModel = computed<string>({
  get: () => provider.value,
  set: (v) => {
    provider.value = v as SupportProvider;
  },
});

const topicOptions = computed(() =>
  props.topics.map((value) => ({ value, label: t(`support.topics.${value}`) }))
);

const providerOptions = computed(() =>
  (["mailto", "gmail", "outlook"] as SupportProvider[]).map((value) => ({
    value,
    label: t(`support.providers.${value}`),
  }))
);

const recipient = computed(() =>
  topic.value === "technical"
    ? props.config.supportEmail || props.config.contactEmail
    : props.config.contactEmail
);

const appName = computed(() => props.config.appName ?? "App");
const subjectPrefix = computed(() => {
  switch (topic.value) {
    case "technical":
      return `[${appName.value} support]`;
    case "sales":
      return `[${appName.value} sales]`;
    case "enterprise":
      return `[${appName.value} enterprise]`;
    default:
      return `[${appName.value}]`;
  }
});

const submitLabel = computed(() => {
  switch (provider.value) {
    case "gmail":
      return t("support.submitGmail");
    case "outlook":
      return t("support.submitOutlook");
    default:
      return t("support.submitMailto");
  }
});

const notePlaceholder = computed(() =>
  t(`support.notePlaceholders.${topic.value}`)
);

// A note that is still the untouched template doesn't count as filled.
const isNoteFilled = computed(() => {
  const trimmed = note.value.trim();
  return !!trimmed && trimmed !== lastAutoNote.value.trim();
});

function templateForTopic(value: SupportTopic): string {
  return value === "technical" ? t("support.templates.technical") : "";
}

watch(topic, (newTopic) => {
  withScreenshot.value = newTopic === "technical";
  if (newTopic === "technical" && !screenshotDataUrl.value) void capture();

  // Only replace a note the user hasn't edited.
  if (note.value === lastAutoNote.value) {
    const next = templateForTopic(newTopic);
    note.value = next;
    lastAutoNote.value = next;
  }
});

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    screenshotDataUrl.value = null;
    screenshotBlob.value = null;
    showNoteError.value = false;
    topic.value = firstTopic.value;
    withScreenshot.value = topic.value === "technical";
    const initial = templateForTopic(topic.value);
    note.value = initial;
    lastAutoNote.value = initial;
    if (withScreenshot.value) void capture();
  }
);

watch(note, () => {
  if (showNoteError.value && isNoteFilled.value) showNoteError.value = false;
});

async function capture() {
  capturing.value = true;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(document.body, {
      logging: false,
      useCORS: true,
      backgroundColor: null,
      // Don't photograph the dialog that is asking for the photograph.
      ignoreElements: (el) => el.getAttribute?.("role") === "dialog",
    });
    screenshotDataUrl.value = canvas.toDataURL("image/png");
    await new Promise<void>((resolve) => {
      canvas.toBlob((b) => {
        screenshotBlob.value = b;
        resolve();
      }, "image/png");
    });
  } catch (err) {
    console.warn("support: screenshot capture failed", err);
    screenshotDataUrl.value = null;
    screenshotBlob.value = null;
    toast({
      variant: "destructive",
      title: t("support.screenshotFailed"),
    });
  } finally {
    capturing.value = false;
  }
}

function buildContext(): string {
  const u = userStore.user;
  const tenant = tenantStore.tenant;
  const sw = globalThis.screen?.width ?? 0;
  const sh = globalThis.screen?.height ?? 0;
  const dpr = globalThis.devicePixelRatio ?? 1;
  return [
    `URL: ${globalThis.location.href}`,
    `Route: ${String(route.name ?? "")}`,
    u ? `User: ${u.name} <${u.email}> (${u.id})` : "User: (anonymous)",
    `Roles: ${u?.roles?.join(", ") ?? "-"}`,
    tenant ? `Tenant: ${tenant.subdomain ?? tenant.id ?? "-"}` : "Tenant: -",
    `App version: ${props.version || "dev"}`,
    `Time: ${new Date().toISOString()}`,
    `Screen: ${sw}x${sh} @${dpr}x`,
    `Viewport: ${globalThis.innerWidth}x${globalThis.innerHeight}`,
    `Language: ${String(locale.value)} / ${navigator.language}`,
    `User agent: ${navigator.userAgent}`,
  ].join("\n");
}

function buildLogs(): string {
  const entries = getEntries(LOG_TAIL_COUNT);
  if (!entries.length) return "";
  return entries
    .map((e) => {
      const msg =
        e.message.length > LOG_LINE_MAX
          ? e.message.slice(0, LOG_LINE_MAX) + "…"
          : e.message;
      return `[${e.ts}] ${e.level.toUpperCase()}: ${msg}`;
    })
    .join("\n");
}

function buildBody(includeLogs: boolean): string {
  const sections: string[] = [];

  // First thing the user sees in the draft, so the image doesn't get forgotten.
  if (withScreenshot.value && screenshotDataUrl.value) {
    sections.push(t("support.pasteReminder"), "");
  }

  sections.push(note.value.trim());

  // Diagnostics belong to a bug report. A sales or enterprise enquiry is a
  // message between people — don't staple a user-agent dump to it.
  if (topic.value === "technical") {
    sections.push("", "— Context —", buildContext());
    if (includeLogs) {
      const logs = buildLogs();
      if (logs) sections.push("", "— Recent browser logs —", logs);
    }
  }
  return sections.join("\n");
}

function buildSubject(): string {
  return `${subjectPrefix.value} ${
    note.value.trim().slice(0, 60) || t("support.defaultSubject")
  }`;
}

function providerHref(
  p: SupportProvider,
  subject: string,
  body: string
): string {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  const to = recipient.value;
  switch (p) {
    case "gmail":
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${s}&body=${b}`;
    case "outlook":
      return `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${s}&body=${b}`;
    default:
      return `mailto:${to}?subject=${s}&body=${b}`;
  }
}

function buildEmailUrl(): string {
  const subject = buildSubject();
  const limit =
    provider.value === "mailto" ? MAILTO_SAFE_LIMIT : WEBMAIL_SAFE_LIMIT;
  let body = buildBody(true);
  let href = providerHref(provider.value, subject, body);
  if (href.length > limit) {
    body = buildBody(false);
    href = providerHref(provider.value, subject, body);
  }
  return href;
}

async function copyScreenshotToClipboard(): Promise<boolean> {
  if (!withScreenshot.value || !screenshotBlob.value) return false;
  try {
    const ClipboardItemCtor = (
      globalThis as unknown as { ClipboardItem?: typeof ClipboardItem }
    ).ClipboardItem;
    if (!ClipboardItemCtor || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([
      new ClipboardItemCtor({ "image/png": screenshotBlob.value }),
    ]);
    return true;
  } catch (err) {
    console.warn("support: clipboard write failed", err);
    return false;
  }
}

function downloadScreenshot() {
  if (!screenshotBlob.value) return;
  const url = URL.createObjectURL(screenshotBlob.value);
  const a = document.createElement("a");
  a.href = url;
  a.download = `support-${new Date().toISOString().slice(0, 19)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openHref(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.rel = "noopener";
  // Webmail compose must open in a new tab so the SPA isn't replaced.
  if (provider.value !== "mailto") a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function submit() {
  if (!isNoteFilled.value) {
    showNoteError.value = true;
    return;
  }
  submitting.value = true;
  try {
    const href = buildEmailUrl();
    try {
      globalThis.localStorage?.setItem(PROVIDER_STORAGE_KEY, provider.value);
    } catch {
      /* ignore */
    }

    const copiedScreenshot = await copyScreenshotToClipboard();
    if (withScreenshot.value && screenshotBlob.value && !copiedScreenshot) {
      downloadScreenshot();
      toast({ title: t("support.clipboardFailed") });
    }

    openHref(href);
    toast({
      title: copiedScreenshot
        ? t("support.success")
        : t("support.successNoScreenshot"),
    });
    emit("update:open", false);
  } catch (err) {
    console.error("support: submit failed", err);
    toast({
      variant: "destructive",
      title: t("support.mailtoFailed", { email: recipient.value }),
    });
  } finally {
    submitting.value = false;
  }
}

async function copyDetails() {
  const text = `To: ${recipient.value}\nSubject: ${buildSubject()}\n\n${buildBody(
    true
  )}`;
  try {
    // Text and image must go in ONE ClipboardItem — a second write() would
    // replace the first, silently losing whichever was copied earlier.
    const ClipboardItemCtor = (
      globalThis as unknown as { ClipboardItem?: typeof ClipboardItem }
    ).ClipboardItem;
    const blob = withScreenshot.value ? screenshotBlob.value : null;
    if (blob && ClipboardItemCtor && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItemCtor({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "image/png": blob,
          }),
        ]);
        toast({ title: t("support.copied") });
        return;
      } catch (err) {
        // Some browsers refuse multi-type items — keep the text, save the image.
        console.warn("support: combined clipboard write failed", err);
        downloadScreenshot();
      }
    }
    await navigator.clipboard.writeText(text);
    toast({ title: t("support.copied") });
  } catch (err) {
    console.error("support: copy details failed", err);
    toast({
      variant: "destructive",
      title: t("support.mailtoFailed", { email: recipient.value }),
    });
  }
}
</script>
