export const themes = [
  {
    name: "violet",
    label: "Violet",
    primary: "262.1 83.3% 57.8%",
  },
  {
    name: "blue",
    label: "Blue",
    primary: "221.2 83.2% 53.3%",
  },
  {
    name: "green",
    label: "Green",
    primary: "142.1 76.2% 36.3%",
  },
  {
    name: "red",
    label: "Red",
    primary: "0 72.2% 50.6%",
  },
  {
    name: "orange",
    label: "Orange",
    primary: "24.6 95% 53.1%",
  },
];

export function getLuminance(hex: string): number {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = toLinear(parseInt(hex.substring(0, 2), 16) / 255);
  const g = toLinear(parseInt(hex.substring(2, 4), 16) / 255);
  const b = toLinear(parseInt(hex.substring(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastForeground(hex: string): string {
  return getLuminance(hex) > 0.179 ? "#0f0f0f" : "#ffffff";
}

export function hslToHex(hsl: string): string {
  const parts = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!parts) return "#000000";
  const h = parseFloat(parts[1]) / 360;
  const s = parseFloat(parts[2]) / 100;
  const l = parseFloat(parts[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string): string {
  if (!hex) return "";
  // Remove the hash if it exists
  hex = hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(
    1
  )}%`;
}

export function applyTheme(colors: Record<string, string>) {
  const mapping: Record<string, string> = {
    background: "--background",
    foreground: "--foreground",
    card: "--card",
    "card-foreground": "--card-foreground",
    popover: "--popover",
    "popover-foreground": "--popover-foreground",
    primary: "--primary",
    "primary-foreground": "--primary-foreground",
    secondary: "--secondary",
    "secondary-foreground": "--secondary-foreground",
    tertiary: "--tertiary",
    "tertiary-foreground": "--tertiary-foreground",
    muted: "--muted",
    "muted-foreground": "--muted-foreground",
    accent: "--accent",
    "accent-foreground": "--accent-foreground",
    destructive: "--destructive",
    "destructive-foreground": "--destructive-foreground",
    positive: "--success",
    "positive-foreground": "--success-foreground",
    negative: "--destructive",
    "negative-foreground": "--destructive-foreground",
    info: "--info",
    "info-foreground": "--info-foreground",
    warning: "--warning",
    "warning-foreground": "--warning-foreground",
    border: "--border",
    input: "--input",
    ring: "--ring",
    "chart-1": "--chart-1",
    "chart-2": "--chart-2",
    "chart-3": "--chart-3",
    "chart-4": "--chart-4",
    "chart-5": "--chart-5",
    sidebar: "--sidebar-background",
    "sidebar-foreground": "--sidebar-foreground",
    "sidebar-primary": "--sidebar-primary",
    "sidebar-primary-foreground": "--sidebar-primary-foreground",
    "sidebar-accent": "--sidebar-accent",
    "sidebar-accent-foreground": "--sidebar-accent-foreground",
    "sidebar-border": "--sidebar-border",
    "sidebar-ring": "--sidebar-ring",
    "header-background": "--header-background",
    text: "--foreground",
  };

  console.log("🎨 applyTheme called with colors:", colors);
  const isDark = document.documentElement.classList.contains("dark");
  console.log("🌓 Current dark mode:", isDark);

  // Remove existing tenant theme style tag
  const existingStyle = document.getElementById("tenant-theme");
  if (existingStyle) {
    existingStyle.remove();
    console.log("🗑️ Removed existing tenant theme");
  }

  // Create CSS rules for the current mode
  const cssRules: string[] = [];
  Object.entries(colors).forEach(([key, value]) => {
    const varName = mapping[key];
    if (varName && value) {
      const hslValue = value.includes("%") ? value : hexToHsl(value);
      if (hslValue) {
        cssRules.push(`${varName}: ${hslValue} !important;`);
      }
    }
  });

  // Auto-compute primary-foreground from primary color for guaranteed contrast
  if (colors.primary) {
    const hex = colors.primary.includes("%")
      ? hslToHex(colors.primary)
      : colors.primary;
    const autoFg = hexToHsl(getContrastForeground(hex));
    cssRules.push(`--primary-foreground: ${autoFg} !important;`);
  }

  // Inject a style tag with the correct selector
  if (cssRules.length > 0) {
    const styleTag = document.createElement("style");
    styleTag.id = "tenant-theme";
    const selector = isDark ? ".dark" : ":root";
    styleTag.textContent = `${selector} { ${cssRules.join(" ")} }`;
    document.head.appendChild(styleTag);
    console.log("📝 Injected style tag:", styleTag.textContent);
  }

  // Test if it works
  setTimeout(() => {
    const testDiv = document.createElement("div");
    testDiv.className = "bg-primary";
    document.body.appendChild(testDiv);
    const bgColor = getComputedStyle(testDiv).backgroundColor;
    const primaryVar = getComputedStyle(testDiv).getPropertyValue("--primary");
    document.body.removeChild(testDiv);
    console.log("🎨 Computed bg-primary color:", bgColor);
    console.log("🎨 Test div --primary var:", primaryVar);
    console.log("🎨 Expected color (green #10b981):", "rgb(16, 185, 129)");
  }, 100);
}
