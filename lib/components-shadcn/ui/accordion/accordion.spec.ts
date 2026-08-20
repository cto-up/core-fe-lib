import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from ".";

/**
 * The wrapper must forward AccordionRoot's emits, not just its props.
 *
 * Declaring `modelValue` alone puts radix into controlled mode; if
 * `update:modelValue` never reaches the parent, the open set stays frozen at
 * its initial value and no panel ever opens — a silent no-op at every call
 * site that binds v-model.
 */
const Controlled = defineComponent({
  components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
  setup() {
    return { open: ref<string[]>([]) };
  },
  template: `
    <Accordion v-model="open" type="multiple">
      <AccordionItem value="one">
        <AccordionTrigger>One</AccordionTrigger>
        <AccordionContent>FIRST</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Two</AccordionTrigger>
        <AccordionContent>SECOND</AccordionContent>
      </AccordionItem>
    </Accordion>
  `,
});

function openSet(wrapper: ReturnType<typeof mount>): string[] {
  return (wrapper.vm as unknown as { open: string[] }).open;
}

describe("Accordion", () => {
  it("writes back to v-model when a trigger is clicked", async () => {
    const wrapper = mount(Controlled);
    await wrapper.findAll("button")[0].trigger("click");
    expect(openSet(wrapper)).toEqual(["one"]);
    expect(wrapper.text()).toContain("FIRST");
  });

  it("accumulates and removes keys in multiple mode", async () => {
    const wrapper = mount(Controlled);
    const [first, second] = wrapper.findAll("button");
    await first.trigger("click");
    await second.trigger("click");
    expect(openSet(wrapper)).toEqual(["one", "two"]);
    await first.trigger("click");
    expect(openSet(wrapper)).toEqual(["two"]);
  });

  it("still opens when left uncontrolled", async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          Accordion,
          AccordionItem,
          AccordionTrigger,
          AccordionContent,
        },
        template: `
          <Accordion type="multiple">
            <AccordionItem value="one">
              <AccordionTrigger>One</AccordionTrigger>
              <AccordionContent>FIRST</AccordionContent>
            </AccordionItem>
          </Accordion>
        `,
      })
    );
    expect(wrapper.text()).not.toContain("FIRST");
    await wrapper.find("button").trigger("click");
    expect(wrapper.text()).toContain("FIRST");
  });
});
