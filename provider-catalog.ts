import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-models";

// ═══════════════════════════════════════════════
// HIVE CONFIGURATION
// ═══════════════════════════════════════════════

export const HIVE_CLOUD_URL = "https://hive.geiant.com/v1";
export const HIVE_LOCAL_URL = "http://localhost:8080/v1";

export function getHiveBaseUrl(localUrl?: string): string {
  return localUrl || process.env.HIVE_URL || HIVE_LOCAL_URL;
}

// ═══════════════════════════════════════════════
// MODEL CATALOG
// ═══════════════════════════════════════════════

// Models available on Hive swarms. These run on community hardware
// via distributed inference — no cloud API, no per-token cost.

export interface HiveModelDef {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
  layers: number;
  quantization: string;
  minDevices: number;
}

export const HIVE_MODEL_CATALOG: HiveModelDef[] = [
  {
    id: "phi-3-mini",
    name: "Phi-3 Mini (3.8B)",
    contextWindow: 4096,
    description: "Fast, lightweight. Runs on 2+ devices. Great for quick tasks.",
    layers: 32,
    quantization: "Q4_K_M",
    minDevices: 1,
  },
  {
    id: "llama-8b",
    name: "Llama 3.1 8B",
    contextWindow: 4096,
    description: "Strong general-purpose. Runs on 2+ devices. Good balance of speed and quality.",
    layers: 32,
    quantization: "Q4_K_M",
    minDevices: 2,
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B",
    contextWindow: 4096,
    description: "Efficient reasoning model. Runs on 2+ devices.",
    layers: 32,
    quantization: "Q4_K_M",
    minDevices: 2,
  },
  {
    id: "llama-70b",
    name: "Llama 3.1 70B",
    contextWindow: 4096,
    description: "GPT-4 class quality. Requires 20+ devices. Enterprise Hive-Standard or above.",
    layers: 80,
    quantization: "Q4_K_M",
    minDevices: 20,
  },
  {
    id: "qwen-72b",
    name: "Qwen 2.5 72B",
    contextWindow: 4096,
    description: "Frontier multilingual model. Requires 20+ devices.",
    layers: 80,
    quantization: "Q4_K_M",
    minDevices: 20,
  },
];

// ═══════════════════════════════════════════════
// BUILD PROVIDER
// ═══════════════════════════════════════════════

export function buildHiveModelDefinition(model: HiveModelDef) {
  return {
    id: `geiant-hive/${model.id}`,
    name: model.name,
    providerId: "geiant-hive",
    contextWindow: model.contextWindow,
    pricing: {
      // Hive Private: zero per-token cost (flat subscription)
      // Hive Marketplace: GNS per token (settled on Stellar)
      inputTokenCost: 0,
      outputTokenCost: 0,
    },
    metadata: {
      layers: model.layers,
      quantization: model.quantization,
      minDevices: model.minDevices,
      description: model.description,
      inference: "distributed-local",
      dataResidency: "on-premise",
    },
  };
}

export function buildHiveProvider(baseUrl?: string): ModelProviderConfig {
  return {
    baseUrl: getHiveBaseUrl(baseUrl),
    api: "openai-completions",
    models: HIVE_MODEL_CATALOG.map(buildHiveModelDefinition),
  };
}
