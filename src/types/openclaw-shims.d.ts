/**
 * Temporary type shims for the OpenClaw plugin SDK.
 *
 * The OpenClaw plugin SDK is a peer dependency from the March scaffold
 * that isn't yet installed in this environment. These shims let us
 * compile + verify the GNS-AIP integration (identity.ts, sign.ts,
 * register.ts) without the actual openclaw package present.
 *
 * Replace with proper peer install once OpenClaw publishes its SDK:
 *   npm install --save-peer openclaw
 *
 * Then delete this file.
 */

declare module "openclaw/plugin-sdk/provider-entry.js" {
  export function defineSingleProviderPluginEntry<T = unknown>(
    config: T
  ): unknown;
}

declare module "openclaw/plugin-sdk/provider-models.js" {
  export interface ModelProviderConfig {
    baseUrl: string;
    api: string;
    models: unknown[];
  }
}

declare module "openclaw/plugin-sdk/provider-onboard.js" {
  export interface OpenClawConfig {
    [key: string]: unknown;
  }
  export interface PresetAppliers {
    applyProviderConfig: (cfg: OpenClawConfig) => OpenClawConfig;
    applyConfig: (cfg: OpenClawConfig) => OpenClawConfig;
  }
  export function createModelCatalogPresetAppliers(
    config: unknown
  ): PresetAppliers;
}
