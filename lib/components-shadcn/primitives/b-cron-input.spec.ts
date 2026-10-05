import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import BCronInput from "./BCronInput.vue";
import common from "../i18n/en-US/common";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  fallbackLocale: "en-US",
  messages: { "en-US": { common } },
});

type Wrapper = Awaited<ReturnType<typeof mountCron>>;

async function mountCron(modelValue: string) {
  const wrapper = mount(BCronInput, {
    props: { modelValue },
    global: { plugins: [i18n] },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

const preview = (w: Wrapper) => w.find(".b-cron-input p.font-medium").text();

const lastEmit = (w: Wrapper) => {
  const emitted = w.emitted("update:modelValue");
  return emitted?.[emitted.length - 1]?.[0] as string | undefined;
};

// radix-vue activates a tab on mousedown/focus, not on a synthetic click.
async function selectTab(w: Wrapper, index: number) {
  const tab = w.findAll('button[role="tab"]')[index];
  await tab.trigger("mousedown");
  await tab.trigger("focus");
  await flushPromises();
}

/** The friendly tab's numeric interval box (every-N minutes/hours/days). */
const intervalInput = (w: Wrapper) => w.findAll("input[type=number]")[0];

describe("BCronInput friendly mode", () => {
  it.each([
    ["0 */15 * * * *", "Runs every 15 minutes"],
    ["0 30 * * * *", "Runs every hour at :30"],
    ["0 15 */4 * * *", "Runs every 4 hours at :15"],
    ["0 0 8 * * *", "Runs every day at 08:00 UTC"],
    ["0 0 8 */3 * *", "Runs every 3 days at 08:00 UTC"],
    ["0 30 9 * * 1,3", "Runs every Monday, Wednesday at 09:30 UTC"],
    ["0 0 12 15 * *", "Runs on the 15th of every month at 12:00 UTC"],
  ])("describes %s", async (expr, expected) => {
    expect(preview(await mountCron(expr))).toBe(expected);
  });

  it("rebuilds the day step when the interval changes", async () => {
    const w = await mountCron("0 0 8 */3 * *");
    await intervalInput(w).setValue(5);
    await flushPromises();
    expect(lastEmit(w)).toBe("0 0 8 */5 * *");
    expect(preview(w)).toBe("Runs every 5 days at 08:00 UTC");
  });

  it("rebuilds the hour step when the interval changes", async () => {
    const w = await mountCron("0 15 */4 * * *");
    await intervalInput(w).setValue(6);
    await flushPromises();
    expect(lastEmit(w)).toBe("0 15 */6 * * *");
    expect(preview(w)).toBe("Runs every 6 hours at :15");
  });

  it("collapses a one-unit day step to the plain daily form", async () => {
    const w = await mountCron("0 0 8 */3 * *");
    await intervalInput(w).setValue(1);
    await flushPromises();
    expect(lastEmit(w)).toBe("0 0 8 * * *");
  });

  it("re-derives the friendly view after an advanced-tab edit", async () => {
    const w = await mountCron("0 0 8 * * *");
    await selectTab(w, 2);

    const dayField = w.findAll("input").find((i) => i.element.value === "*")!;
    await dayField.setValue("*/2");
    await flushPromises();

    expect(lastEmit(w)).toBe("0 0 8 */2 * *");

    await selectTab(w, 0);
    expect(preview(w)).toBe("Runs every 2 days at 08:00 UTC");
  });

  describe("local time", () => {
    const tz = process.env.TZ;
    const local = (w: Wrapper) => w.find(".b-cron-local");
    afterEach(() => {
      process.env.TZ = tz;
    });

    it("shows where the UTC time lands on the viewer's clock", async () => {
      process.env.TZ = "Asia/Kolkata";
      const w = await mountCron("0 30 11 * * *");
      expect(local(w).text()).toMatch(
        /^17:00 your time \(Asia\/(Kolkata|Calcutta)\)$/
      );
    });

    it("flags a schedule that falls on another local day", async () => {
      process.env.TZ = "America/Los_Angeles";
      const w = await mountCron("0 0 2 * * 1");
      expect(local(w).text()).toMatch(
        /^1[89]:00 your time \(America\/Los_Angeles\), the day before$/
      );
    });

    it("stays silent when the viewer is on UTC", async () => {
      process.env.TZ = "UTC";
      expect(local(await mountCron("0 30 11 * * *")).exists()).toBe(false);
    });

    it("stays silent for interval schedules", async () => {
      process.env.TZ = "Asia/Kolkata";
      expect(local(await mountCron("0 */15 * * * *")).exists()).toBe(false);
    });
  });

  it("falls back to the Simple tab for an expression it can't describe", async () => {
    const w = await mountCron("0 0 8-17 * * 1-5");
    expect(w.find(".b-cron-input p.font-medium").exists()).toBe(false);
    expect(
      w.findAll("input").some((i) => i.element.value === "0 0 8-17 * * 1-5")
    ).toBe(true);
  });
});
