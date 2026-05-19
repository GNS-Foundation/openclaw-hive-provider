/**
 * Model catalog — the actual models running on the GEIANT Hive swarm
 * in production. Verified against swarm_nodes.models in the Supabase
 * Hive project (kaqwkxfaclyqjlfhxrmt) as of Sprint 2 kickoff.
 *
 * If a new model is added to production, update this file. The plugin
 * trusts this list; OpenClaw won't surface models that aren't here.
 */

import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-models.js";

// ═══════════════════════════════════════════════
// HIVE CONFIGURATION
// ═══════════════════════════════════════════════

export const HIVE_CLOUD_URL = "https://hive.geiant.com/v1";
export const HIVE_RAILWAY_URL = "https://gns-browser-production.up.railway.app/v1";
export const HIVE_LOCAL_URL = "http://localhost:3000/v1";

/**
 * Returns the Hive gateway URL.
 *
 * Priority:
 *   1. Explicit URL passed in (CLI flag, programmatic)
 *   2. HIVE_URL env var
 *   3. Production Railway endpoint (matches the public roadmap)
 *
 * Note: hive.geiant.com is the canonical pretty URL; production CNAME
 * points to the Railway endpoint. Both work, both verify identical
 * audit headers (X-Hive-Worker, X-Hive-Epoch, X-Hive-Proof).
 */
export function getHiveBaseUrl(explicitUrl?: string): string {
  if (explicitUrl) return explicitUrl;
  if (process.env.HIVE_URL) return process.env.HIVE_URL;
  return HIVE_RAILWAY_URL;
}

// ═══════════════════════════════════════════════
// MODEL CATALOG
// ═══════════════════════════════════════════════

export interface HiveModelDef {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  parameters: string;
  description: string;
}

export const HIVE_MODEL_CATALOG: HiveModelDef[] = [
  {
    id: "lfm2.5-1.2b-instruct",
    name: "Liquid AI LFM2.5 1.2B Instruct",
    provider: "Liquid AI",
    contextWindow: 4096,
    parameters: "1.2B",
    description:
      "Default Hive model. State-space architecture from Liquid AI; " +
      "frontier quality at edge-optimized size.",
  },
  {
    id: "lfm2.5-1.2b-thinking",
    name: "Liquid AI LFM2.5 1.2B Thinking",
    provider: "Liquid AI",
    contextWindow: 4096,
    parameters: "1.2B",
    description:
      "Reasoning variant of LFM2.5. Slower per token but stronger " +
      "for multi-step problems.",
  },
  {
    id: "phi-3-mini",
    name: "Microsoft Phi-3 Mini",
    provider: "Microsoft",
    contextWindow: 4096,
    parameters: "3.8B",
    description: "Strong general-purpose. Good balance of speed and quality.",
  },
  {
    id: "tinyllama",
    name: "TinyLlama 1.1B",
    provider: "TinyLlama Project",
    contextWindow: 2048,
    parameters: "1.1B",
    description: "Smoke-test model. Available on all swarm workers as fallback.",
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
      // Hive: zero per-token cost (flat subscription or GNS Token settlement)
      inputTokenCost: 0,
      outputTokenCost: 0,
    },
    metadata: {
      parameters: model.parameters,
      modelProvider: model.provider,
      description: model.description,
      inference: "distributed-local",
      dataResidency: "on-premise",
      auditTrail: "cryptographic-ed25519",
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
