import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import axios from "axios";
import enUS from "../i18n/en-US";
import { useToast } from "../ui/toast/use-toast";
import BFileUploader from "./BFileUploader.vue";
import BImageUploader from "./BImageUploader.vue";
import BUploader from "./BUploader.vue";

vi.mock("axios", () => ({ default: vi.fn() }));

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": enUS },
});

const frame = (body: object) =>
  `event:message\ndata:${JSON.stringify(body)}\n\n`;

// The server answers 200 and streams the outcome, so a failure arrives as an
// SSE frame (or as nothing at all), never as a rejected request.
function serverStreams(text: string) {
  vi.mocked(axios).mockImplementation((async (config: {
    onDownloadProgress: (e: unknown) => void;
  }) => {
    config.onDownloadProgress({ event: { target: { responseText: text } } });
    return { data: text };
  }) as never);
}

const ERROR_FRAME = frame({
  eventType: "ERROR",
  message: "virus scan rejected the file",
  progress: 100,
});
const TRUNCATED = frame({
  eventType: "INFO",
  message: "storing",
  progress: 40,
});

const { toasts } = useToast();
const titles = () => toasts.value.map((t) => `${t.title}|${t.description}`);

beforeEach(() => {
  toasts.value.splice(0);
  vi.mocked(axios).mockReset();
});

function pdf() {
  return new File(["%PDF"], "notes.pdf", { type: "application/pdf" });
}

describe("BFileUploader settles on what the stream said", () => {
  async function upload(text: string) {
    serverStreams(text);
    const w = mount(BFileUploader, {
      props: { postEndPoint: "/up", accept: "*/*" },
      global: { plugins: [i18n] },
    });
    w.findComponent({ name: "UploaderBase" }).vm.$emit("file-dropped", [pdf()]);
    await flushPromises();
    return w;
  }

  it("stops uploading and shows the reason after an ERROR event", async () => {
    const w = await upload(ERROR_FRAME);
    expect(w.emitted("uploaded")).toBeUndefined();
    expect(w.text()).toContain("virus scan rejected the file");
    expect((w.vm as unknown as { uploading: boolean }).uploading).toBe(false);
  });

  it("reports a stream that ends before progress 100", async () => {
    const w = await upload(TRUNCATED);
    expect((w.vm as unknown as { uploading: boolean }).uploading).toBe(false);
    expect(w.text()).toContain("ended before the server confirmed it");
  });
});

describe("BUploader settles on what the stream said", () => {
  async function upload(text: string) {
    serverStreams(text);
    const w = mount(BUploader, {
      props: { postEndPoint: "/up" },
      global: { plugins: [i18n] },
    });
    await w
      .find(".b-uploader > div")
      .trigger("drop", { dataTransfer: { files: [pdf()] } });
    await flushPromises();
    return w;
  }

  it("does not toast success after an ERROR event", async () => {
    const w = await upload(ERROR_FRAME);
    expect(titles()).not.toContain("File uploaded successfully.|undefined");
    expect(titles().join()).toContain("virus scan rejected the file");
    expect(w.emitted("uploaded")).toBeUndefined();
  });

  it("does not toast success when the stream ends early", async () => {
    await upload(TRUNCATED);
    expect(titles().join()).not.toContain("File uploaded successfully.");
    expect(titles().join()).toContain("ended before the server confirmed it");
  });
});

describe("BImageUploader keeps the dialog open on a server error", () => {
  it("shows the reason, emits no uploaded, and toasts no success", async () => {
    serverStreams(ERROR_FRAME);
    const w = mount(BImageUploader, {
      props: { getEndPoint: "/get", postEndPoint: "/up", accept: "image/*" },
      global: {
        plugins: [i18n],
        stubs: { Cropper: true, Dialog: true },
      },
    });
    const vm = w.vm as unknown as {
      uploadDialog: boolean;
      cropper: unknown;
      uploadError: string;
      handleUpload: () => Promise<void>;
    };
    vm.uploadDialog = true;
    vm.cropper = {
      getResult: () => ({
        canvas: {
          toBlob: (cb: (b: Blob) => void) => cb(new Blob(["x"])),
          toDataURL: () => "data:image/jpeg;base64,",
        },
      }),
    };
    await vm.handleUpload();
    await flushPromises();

    expect(vm.uploadDialog).toBe(true);
    expect(vm.uploadError).toBe("virus scan rejected the file");
    expect(w.emitted("uploaded")).toBeUndefined();
    expect(titles().join()).not.toContain("Success");
  });
});
