/**
 * First-run registration flow for the OpenClaw Hive plugin.
 *
 * On first run, the plugin:
 *   1. Generates the principal + agent keypairs (via identity.ts)
 *   2. Registers the principal as a GNS record (PUT /records/<principal_pk>)
 *   3. Provisions the agent (POST /agents/provision, signed by the principal)
 *   4. Persists state so subsequent runs short-circuit
 *
 * This file owns the orchestration; identity.ts owns key material and sign.ts
 * owns the cryptographic primitives.
 */

import {
  loadOrGenerateIdentity,
  saveIdentity,
  type StoredIdentity,
} from "./identity.js";
import { signCanonical, signProvisionPayload } from "./sign.js";

const DEFAULT_BACKEND = "https://gns-browser-production.up.railway.app";
/** Italy resolution 6 — default jurisdiction cell for the alpha. */
const DEFAULT_HOME_CELL = "861e8050fffffff";

export interface RegisterConfig {
  /** Backend base URL (no trailing slash). Default: production Railway. */
  backendUrl?: string;
  /** Override the on-disk identity path. */
  identityPath?: string;
  /** Optional principal handle for the GNS record. */
  handle?: string;
  /** Jurisdiction string, e.g. 'EU/IT/Rome'. */
  jurisdiction?: string;
  /** H3 cells the agent operates in. Default: ['861e8050fffffff'] (Italy r6). */
  homeCells?: string[];
  /** Agent classification. Default: 'autonomous'. */
  agentType?: "autonomous" | "semi_autonomous" | "tool";
}

export interface RegisterResult {
  identity: StoredIdentity;
  /** true if both principal + agent were already on file. */
  alreadyRegistered: boolean;
  /** true if we made a network call for the principal registration. */
  principalRegisteredThisRun: boolean;
  /** true if we made a network call for the agent provisioning. */
  agentProvisionedThisRun: boolean;
}

/**
 * Run the registration flow. Idempotent — safe to call on every plugin start.
 */
export async function registerIfNeeded(
  config: RegisterConfig = {}
): Promise<RegisterResult> {
  const backendUrl = (
    config.backendUrl ||
    process.env.HIVE_URL ||
    DEFAULT_BACKEND
  ).replace(/\/+$/, "");

  const identity = loadOrGenerateIdentity(config.identityPath);

  let principalRegisteredThisRun = false;
  let agentProvisionedThisRun = false;

  // ── Step 1: Register the principal as a GNS record ──
  if (!identity.principalRegistered) {
    const now = new Date().toISOString();
    const recordJson = {
      version: 1,
      identity: identity.principal.publicKey.toLowerCase(),
      handle: config.handle || null,
      encryption_key: null,
      modules: [],
      endpoints: [],
      epoch_roots: [],
      trust_score: 0,
      breadcrumb_count: 0,
      created_at: now,
      updated_at: now,
    };
    const signature = signCanonical(recordJson, identity.principal.secretKey);

    const url = `${backendUrl}/records/${identity.principal.publicKey.toLowerCase()}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_json: recordJson, signature }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `Principal registration failed at ${url} (HTTP ${res.status}): ${errBody}`
      );
    }

    identity.principalRegistered = true;
    saveIdentity(identity, config.identityPath);
    principalRegisteredThisRun = true;
    console.log(
      `[geiant-hive] Principal registered: ${identity.principal.publicKey.substring(
        0,
        16
      )}...`
    );
  }

  // ── Step 2: Provision the agent ──
  if (!identity.agentProvisioned) {
    const agentType = config.agentType || "autonomous";
    const homeCells = config.homeCells || [DEFAULT_HOME_CELL];

    const signature = signProvisionPayload(
      {
        agentPk: identity.agent.publicKey,
        agentType,
        principalPk: identity.principal.publicKey,
        homeCells,
      },
      identity.principal.secretKey
    );

    const provisionBody: Record<string, unknown> = {
      pk_root: identity.agent.publicKey.toLowerCase(),
      agent_type: agentType,
      principal_pk: identity.principal.publicKey.toLowerCase(),
      home_cells: homeCells,
      manifest: {
        client: "@gns-foundation/openclaw-hive-provider",
        version: "0.1.0-alpha.1",
        registered_at: new Date().toISOString(),
      },
      signature,
    };
    if (config.jurisdiction) {
      provisionBody.jurisdiction = config.jurisdiction;
    }

    const url = `${backendUrl}/agents/provision`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(provisionBody),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `Agent provisioning failed at ${url} (HTTP ${res.status}): ${errBody}`
      );
    }

    identity.agentProvisioned = true;
    saveIdentity(identity, config.identityPath);
    agentProvisionedThisRun = true;
    console.log(
      `[geiant-hive] Agent provisioned: ${identity.agent.publicKey.substring(
        0,
        16
      )}...`
    );
  }

  return {
    identity,
    alreadyRegistered:
      !principalRegisteredThisRun && !agentProvisionedThisRun,
    principalRegisteredThisRun,
    agentProvisionedThisRun,
  };
}
