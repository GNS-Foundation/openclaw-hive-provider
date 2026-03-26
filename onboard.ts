import {
  buildHiveModelDefinition,
  getHiveBaseUrl,
  HIVE_MODEL_CATALOG,
} from "./provider-catalog.js";
import {
  createModelCatalogPresetAppliers,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard";

// Default model: Llama 8B is the sweet spot for most Hive swarms
export const HIVE_DEFAULT_MODEL_REF = "geiant-hive/llama-8b";

const hivePresetAppliers = createModelCatalogPresetAppliers({
  primaryModelRef: HIVE_DEFAULT_MODEL_REF,
  resolveParams: (cfg: OpenClawConfig) => ({
    providerId: "geiant-hive",
    api: "openai-completions",
    baseUrl: getHiveBaseUrl((cfg as any).hiveUrl),
    catalogModels: HIVE_MODEL_CATALOG.map(buildHiveModelDefinition),
    aliases: [
      { modelRef: "geiant-hive/llama-8b", alias: "Hive Llama 8B" },
      { modelRef: "geiant-hive/phi-3-mini", alias: "Hive Phi-3" },
      { modelRef: "geiant-hive/llama-70b", alias: "Hive Llama 70B" },
    ],
  }),
});

export function applyHiveProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  return hivePresetAppliers.applyProviderConfig(cfg);
}

export function applyHiveConfig(cfg: OpenClawConfig): OpenClawConfig {
  return hivePresetAppliers.applyConfig(cfg);
}
