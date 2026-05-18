import { type VariantProps, cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        secondary: "border-transparent bg-muted/60 text-muted-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        success: "border-transparent bg-success text-success-foreground shadow",
        info: "border-transparent bg-info text-info-foreground shadow",
        warning: "border-transparent bg-warning text-warning-foreground shadow",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
