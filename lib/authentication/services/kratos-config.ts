/**
 * Kratos Configuration - Injectable config for the shared library
 *
 * Consuming apps must call `configureKratos()` before using any Kratos service.
 * This avoids a hard dependency on app-specific paths like `@/config/kratos`.
 */

export interface KratosConfig {
  /** Kratos Public API endpoint (browser-accessible) */
  publicUrl: string;
}

let _config: KratosConfig | null = null;

/**
 * Configure the Kratos service with app-specific settings.
 * Must be called once at app startup before any Kratos API calls.
 */
export function configureKratos(config: KratosConfig): void {
  _config = config;
}

/**
 * Get the current Kratos configuration.
 * Throws if `configureKratos()` has not been called.
 */
export function getKratosConfig(): KratosConfig {
  if (!_config) {
    throw new Error(
      "Kratos not configured. Call configureKratos({ publicUrl }) at app startup."
    );
  }
  return _config;
}
