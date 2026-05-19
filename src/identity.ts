/**
 * Identity management — load or generate the plugin's two keypairs.
 *
 * The plugin owns TWO Ed25519 keypairs:
 *
 *   - Principal: represents the "human/device" that owns the agent.
 *     Registered as a GNS record at PUT /records/<principal_pk>.
 *     Signs agent provisioning requests.
 *
 *   - Agent: the actual signing identity for inference calls.
 *     Provisioned via POST /agents/provision (signed by the principal).
 *     Signs every /v1/chat/completions request.
 *
 * Both keypairs are cached at $GEIANT_AGENT_IDENTITY_PATH (default
 * ~/.config/geiant-hive/identity.json), file mode 0600.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import nacl from "tweetnacl";

export interface Keypair {
  /** Ed25519 public key, hex (32 bytes = 64 chars) */
  publicKey: string;
  /** Ed25519 expanded secret key, hex (64 bytes = 128 chars) */
  secretKey: string;
}

export interface StoredIdentity {
  principal: Keypair;
  agent: Keypair;
  /** true once the principal record has been PUT to /records */
  principalRegistered?: boolean;
  /** true once the agent has been POSTed to /agents/provision */
  agentProvisioned?: boolean;
  createdAt: string;
}

const DEFAULT_PATH = path.join(
  os.homedir(),
  ".config",
  "geiant-hive",
  "identity.json"
);

export function getIdentityPath(override?: string): string {
  return override || process.env.GEIANT_AGENT_IDENTITY_PATH || DEFAULT_PATH;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateKeypair(): Keypair {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: bytesToHex(kp.publicKey),
    secretKey: bytesToHex(kp.secretKey),
  };
}

/**
 * Load the cached identity, or generate fresh keypairs on first run.
 * The on-disk file is written with mode 0600 (owner read/write only).
 */
export function loadOrGenerateIdentity(pathOverride?: string): StoredIdentity {
  const identityPath = getIdentityPath(pathOverride);

  if (fs.existsSync(identityPath)) {
    try {
      const raw = fs.readFileSync(identityPath, "utf-8");
      const stored = JSON.parse(raw) as StoredIdentity;
      if (stored.principal?.publicKey && stored.agent?.publicKey) {
        return stored;
      }
      // Malformed — back it up and regenerate
      const backupPath = `${identityPath}.bak.${Date.now()}`;
      fs.renameSync(identityPath, backupPath);
      console.warn(
        `[geiant-hive] Identity file malformed; backed up to ${backupPath}`
      );
    } catch (err) {
      console.warn(
        `[geiant-hive] Failed to parse identity file; regenerating: ${err}`
      );
    }
  }

  // Generate fresh
  const stored: StoredIdentity = {
    principal: generateKeypair(),
    agent: generateKeypair(),
    principalRegistered: false,
    agentProvisioned: false,
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(identityPath), { recursive: true });
  fs.writeFileSync(identityPath, JSON.stringify(stored, null, 2), {
    mode: 0o600,
  });

  return stored;
}

/** Persist the identity after a state change (e.g. principalRegistered=true). */
export function saveIdentity(
  stored: StoredIdentity,
  pathOverride?: string
): void {
  const identityPath = getIdentityPath(pathOverride);
  fs.writeFileSync(identityPath, JSON.stringify(stored, null, 2), {
    mode: 0o600,
  });
}
