import { useUrl } from "../composables/useUrl";

/**
 * Dynamically sets the favicon based on the subdomain
 *
 * Naming convention:
 * - Default: /favicon.ico
 * - Subdomain-specific: /favicon-{subdomain}.ico
 *
 * Example:
 * - www.example.com -> /favicon.ico (default)
 * - app.example.com -> /favicon-app.ico (if exists, otherwise default)
 * - tenant1.example.com -> /favicon-tenant1.ico (if exists, otherwise default)
 */
export function setDynamicFavicon(subdomain?: string) {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach((link) => link.remove());

  // Determine favicon path
  let faviconPath = "/favicon.ico"; // default

  const { isAdminSubdomain } = useUrl();
  const useTenantFavicon = !isAdminSubdomain(subdomain);

  if (useTenantFavicon) {
    // Try subdomain-specific favicon first
    faviconPath = `/favicon-${subdomain}.ico`;
  }

  // Create new favicon link
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/x-icon";
  link.href = faviconPath;

  // Add error handler to fallback to default if subdomain-specific doesn't exist
  if (useTenantFavicon) {
    link.onerror = () => {
      console.log(
        `Favicon for subdomain "${subdomain}" not found, using default`
      );
      link.href = "/favicon.ico";
    };
  }

  document.head.appendChild(link);

  console.log(`🎨 Favicon set to: ${faviconPath}`);
}
