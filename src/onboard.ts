/**
 * Provider config wiring.
 *
 * Phase 0 (this scaffolding): basic provider catalog wiring.
 *
 * Phase 2 will add:
 *   - Identity bootstrap (Ed25519 keypair from src/identity.ts)
 *   - Request signing interceptor (src/sign.ts)
 *   - First-run agent registration with the swarm (src/register.ts)
 */

import {
  buildHiveModelDefinition,
  getHiveBaseUrl,
  HIVE_MODEL_CATALOG,
} from "./provider-catalog.js";
import {
  createModelCatalogPresetAppliers,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard.js";

// Default model: Liquid AI's LFM2.5 1.2B Instruct. Production verified.
export const HIVE_DEFAULT_MODEL_REF = "geiant-hive/lfm2.5-1.2b-instruct";

const hivePresetAppliers = createModelCatalogPresetAppliers({
  primaryModelRef: HIVE_DEFAULT_MODEL_REF,
  resolveParams: (cfg: OpenClawConfig) => ({
    providerId: "geiant-hive",
    api: "openai-completions",
    baseUrl: getHiveBaseUrl((cfg as any).hiveUrl),
    catalogModels: HIVE_MODEL_CATALOG.map(buildHiveModelDefinition),
    aliases: [
      { modelRef: "geiant-hive/lfm2.5-1.2b-instruct", alias: "Hive LFM2.5 (default)" },
      { modelRef: "geiant-hive/lfm2.5-1.2b-thinking", alias: "Hive LFM2.5 Thinking" },
      { modelRef: "geiant-hive/phi-3-mini", alias: "Hive Phi-3 Mini" },
      { modelRef: "geiant-hive/tinyllama", alias: "Hive TinyLlama" },
    ],
  }),
});

export function applyHiveProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  return hivePresetAppliers.applyProviderConfig(cfg);
}

export function applyHiveConfig(cfg: OpenClawConfig): OpenClawConfig {
  return hivePresetAppliers.applyConfig(cfg);
}
