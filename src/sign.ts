/**
 * Three signing schemes used by the GNS-AIP integration.
 *
 * 1. signCanonical()    — for GNS records (PUT /records/:pk)
 *                         Uses canonicalJson from @gns-aip/sdk for sorted-keys
 *                         deterministic serialization. Backend uses identical
 *                         canonicalJson via the SDK.
 *
 * 2. signInsertionOrder() — for agent provisioning (POST /agents/provision)
 *                            Backend uses JSON.stringify over an object literal
 *                            with specific key order: pk_root, agent_type,
 *                            principal_pk, home_cells. Callers MUST construct
 *                            their payload with the same key insertion order.
 *
 * 3. signChatRequest()  — for chat completions (/v1/chat/completions)
 *                         Backend's signed_request middleware constructs:
 *                           `${domain}:${timestamp}:${sha256_hex(raw_body)}`
 *                         Returns the three X-GNS-* headers ready to send.
 */

import * as crypto from "node:crypto";
import nacl from "tweetnacl";
import { canonicalJson } from "@gns-aip/sdk";

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string (odd length)");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sign a payload using canonical JSON (sorted keys).
 * Used by PUT /records/:pk.
 */
export function signCanonical(payload: unknown, secretKeyHex: string): string {
  const message = canonicalJson(payload);
  const sig = nacl.sign.detached(
    new TextEncoder().encode(message),
    hexToBytes(secretKeyHex)
  );
  return bytesToHex(sig);
}

/**
 * Sign a payload using insertion-order JSON.stringify.
 * Used by POST /agents/provision.
 *
 * CRITICAL: the caller must construct the payload object with the SAME
 * key insertion order the backend expects. For provisioning, the backend
 * uses (from src/api/agents.ts):
 *
 *   JSON.stringify({
 *     pk_root: pk_root.toLowerCase(),
 *     agent_type,
 *     principal_pk: principal_pk.toLowerCase(),
 *     home_cells,
 *   })
 *
 * Use signProvisionPayload() instead of calling this directly when signing
 * agent provisioning — it constructs the canonical literal for you.
 */
export function signInsertionOrder(
  payload: object,
  secretKeyHex: string
): string {
  const message = JSON.stringify(payload);
  const sig = nacl.sign.detached(
    new TextEncoder().encode(message),
    hexToBytes(secretKeyHex)
  );
  return bytesToHex(sig);
}

/**
 * Construct + sign the agent provisioning payload with the correct key order.
 * Returns the signature only; the caller assembles the full request body.
 */
export function signProvisionPayload(
  input: {
    agentPk: string;
    agentType: "autonomous" | "semi_autonomous" | "tool";
    principalPk: string;
    homeCells: string[];
  },
  principalSecretKeyHex: string
): string {
  // Key order matters — must match backend's verification literal.
  const canonicalLiteral = {
    pk_root: input.agentPk.toLowerCase(),
    agent_type: input.agentType,
    principal_pk: input.principalPk.toLowerCase(),
    home_cells: input.homeCells,
  };
  return signInsertionOrder(canonicalLiteral, principalSecretKeyHex);
}

export interface SignedRequestHeaders {
  "X-GNS-PublicKey": string;
  "X-GNS-Timestamp": string;
  "X-GNS-Signature": string;
}

/**
 * Sign a chat completion request body and return the X-GNS-* headers.
 *
 * Backend canonical message (from src/lib/signed_request.ts):
 *
 *   `${domain}:${timestamp_ms}:${sha256_hex(raw_body_bytes)}`
 *
 * For /v1/chat/completions: domain = 'gns-chat-v1'.
 */
export function signChatRequest(
  body: object,
  agentSecretKeyHex: string,
  agentPublicKeyHex: string,
  domain: string = "gns-chat-v1"
): SignedRequestHeaders {
  const timestamp = Date.now();
  const bodyStr = JSON.stringify(body);
  const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex");
  const canonicalMessage = `${domain}:${timestamp}:${bodyHash}`;
  const sig = nacl.sign.detached(
    new TextEncoder().encode(canonicalMessage),
    hexToBytes(agentSecretKeyHex)
  );
  return {
    "X-GNS-PublicKey": agentPublicKeyHex.toLowerCase(),
    "X-GNS-Timestamp": String(timestamp),
    "X-GNS-Signature": bytesToHex(sig),
  };
}
