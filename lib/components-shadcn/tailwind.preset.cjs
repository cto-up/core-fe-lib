/* eslint-disable @typescript-eslint/no-require-imports, no-undef -- a CommonJS Tailwind preset */
/**
 * Shared Tailwind preset for core-fe-lib shadcn components.
 *
 * Consumer apps add this to tailwind.config.js:
 *
 *   presets: [require('core-fe-lib/components-shadcn/tailwind.preset.cjs')]
 *
 * They must ALSO add the lib's source files to their `content` glob:
 *
 *   content: [
 *     './index.html',
 *     './src/**\/*.{vue,js,ts,jsx,tsx}',
 *     './core-fe-lib/lib/components-shadcn/**\/*.{vue,js,ts}',
 *   ]
 *
 * Theme tokens are HSL CSS variables — defined in styles/shadcn.css.
 *
 * @type {import('tailwindcss').Config}
 */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          background: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "header-background": "hsl(var(--header-background))",
        // A product's sign-off colour (approve, accept): its own job, apart
        // from --error and --destructive. Falls back to the primary.
        signal: {
          DEFAULT: "hsl(var(--signal, var(--primary)))",
          foreground:
            "hsl(var(--signal-foreground, var(--primary-foreground)))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Faces, depth and grounds are identity tokens: a product sets
      // --font-*, --shadow-ambient, --dot-color or --card-rail in its
      // src/brand/identity.css. The fallbacks are the shared defaults.
      fontFamily: {
        sans: ["var(--font-sans, Inter)", ...defaultTheme.fontFamily.sans],
        display: [
          "var(--font-display, Calibri, Carlito, Inter)",
          ...defaultTheme.fontFamily.sans,
        ],
        mono: [
          "var(--font-mono, 'JetBrains Mono')",
          ...defaultTheme.fontFamily.mono,
        ],
      },
      backgroundImage: {
        dots: "radial-gradient(circle at 1px 1px, var(--dot-color, rgb(17 17 17 / 0.09)) 1px, transparent 0)",
        rail: "var(--card-rail, linear-gradient(90deg, hsl(var(--primary)), hsl(var(--signal, var(--primary)))))",
      },
      backgroundSize: {
        dots: "32px 32px",
      },
      boxShadow: {
        // Soft, diffuse ambient depth. The default Card uses this instead of a
        // hard 1px border (see Card.vue). Structural surfaces opt back into a
        // border explicitly.
        ambient:
          "var(--shadow-ambient, 0 8px 30px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.03))",
      },
    },
  },
  plugins: [],
};
