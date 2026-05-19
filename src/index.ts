/**
 * @gns-foundation/openclaw-hive-provider
 *
 * GEIANT Hive provider for OpenClaw — cryptographically-signed distributed
 * local AI inference with EU AI Act compliant agent identity.
 *
 * Architecture overview: see README.md or
 *   https://docs.geiant.com/hive/roadmap#123-near-term-q3-2026--agent-orchestration
 *
 * Phase 0 (this scaffolding):
 *   - Plugin entry point registers the geiant-hive provider with OpenClaw
 *   - Model catalog matches what's actually deployed on the swarm today
 *   - No signing yet — Phase 2 will add identity + signing modules
 */

import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry.js";
import { applyHiveConfig, HIVE_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildHiveProvider } from "./provider-catalog.js";

const PROVIDER_ID = "geiant-hive";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "GEIANT Hive Provider",
  description:
    "Cryptographically-signed distributed AI inference. Zero cloud. Zero data leakage. " +
    "Powered by the GNS Protocol — docs.geiant.com/hive",
  provider: {
    label: "GEIANT Hive",
    docsPath: "/providers/geiant-hive",
    auth: [
      {
        methodId: "gns-identity",
        label: "GNS agent identity (auto-generated on first run)",
        hint:
          "The plugin owns an Ed25519 keypair that signs every inference call. " +
          "Path: $GEIANT_AGENT_IDENTITY_PATH or default ~/.config/geiant-hive/identity.json.",
        optionKey: "hiveIdentityPath",
        flagName: "--hive-identity-path",
        envVar: "GEIANT_AGENT_IDENTITY_PATH",
        promptMessage:
          "Path to GNS agent identity file (leave empty for default ~/.config/geiant-hive/identity.json)",
        defaultModel: HIVE_DEFAULT_MODEL_REF,
        applyConfig: (cfg: any) => applyHiveConfig(cfg),
        wizard: {
          groupLabel: "GEIANT Hive (GNS-signed)",
        },
      },
    ],
    catalog: {
      buildProvider: buildHiveProvider,
    },
  },
});

// Phase 2 will add (in this order):
//   - src/identity.ts   — load or generate Ed25519 keypair
//   - src/sign.ts       — sign chat completion requests with the agent's key
//   - src/register.ts   — register the agent with the swarm via /v1/agents/register
//   - request interceptor in onboard.ts that wraps the OpenClaw outbound
//     pipeline and adds X-GNS-* headers to every chat completion call
