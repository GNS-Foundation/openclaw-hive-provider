/**
 * Smoke test — exercises the full registration flow end-to-end.
 *
 * Run with:
 *   npm run build && node --experimental-vm-modules scripts/smoke-test.js
 * Or (after install):
 *   npm run smoke
 *
 * If everything works:
 *   ✅ Principal record created (or already present)
 *   ✅ Agent provisioned (or already present)
 *   ✅ Agent retrievable via GET /agents/:pk
 *   ✅ Chat completion signed with valid X-GNS-* headers
 *
 * NOTE: this writes a real principal + agent to production Supabase.
 * Use a throwaway identity path to avoid polluting your real one:
 *
 *   GEIANT_AGENT_IDENTITY_PATH=/tmp/test-identity.json npm run smoke
 */

import { registerIfNeeded } from "../src/register.js";
import { signChatRequest } from "../src/sign.js";

const BACKEND =
  process.env.HIVE_URL || "https://gns-browser-production.up.railway.app";

async function main() {
  console.log("━━━ GEIANT Hive plugin smoke test ━━━");
  console.log(`Backend: ${BACKEND}`);
  console.log(
    `Identity: ${
      process.env.GEIANT_AGENT_IDENTITY_PATH ||
      "~/.config/geiant-hive/identity.json"
    }\n`
  );

  // ── Step 1: Registration ──
  console.log("[1/3] Running registration flow...");
  const result = await registerIfNeeded({
    backendUrl: BACKEND,
    homeCells: ["861e8050fffffff"],
    jurisdiction: "EU/IT/Rome",
  });
  console.log(
    `  Principal:  ${result.identity.principal.publicKey.substring(0, 32)}...`
  );
  console.log(
    `  Agent:      ${result.identity.agent.publicKey.substring(0, 32)}...`
  );
  console.log(
    `  Principal registered this run: ${result.principalRegisteredThisRun}`
  );
  console.log(
    `  Agent provisioned this run:    ${result.agentProvisionedThisRun}`
  );
  console.log(`  Already registered:            ${result.alreadyRegistered}`);

  // ── Step 2: Verify agent exists in registry ──
  console.log("\n[2/3] Verifying agent via GET /agents/:pk ...");
  const verifyUrl = `${BACKEND}/agents/${result.identity.agent.publicKey.toLowerCase()}`;
  const verifyRes = await fetch(verifyUrl);
  console.log(`  HTTP ${verifyRes.status}`);
  const verifyData = await verifyRes.json();
  if (verifyRes.ok && verifyData?.success) {
    console.log(`  ✅ Agent record:`);
    console.log(
      "    " +
        JSON.stringify(verifyData.data, null, 2).split("\n").join("\n    ")
    );
  } else {
    console.error(`  ❌ Verification failed:`, verifyData);
    process.exit(1);
  }

  // ── Step 3: Sign a chat completion (dry run) ──
  console.log("\n[3/3] Signing a chat completion request (dry run)...");
  const body = {
    model: "lfm2.5-1.2b-instruct",
    messages: [{ role: "user", content: "hi" }],
  };
  const headers = signChatRequest(
    body,
    result.identity.agent.secretKey,
    result.identity.agent.publicKey
  );
  console.log(
    `  X-GNS-PublicKey:  ${headers["X-GNS-PublicKey"].substring(0, 32)}...`
  );
  console.log(`  X-GNS-Timestamp:  ${headers["X-GNS-Timestamp"]}`);
  console.log(
    `  X-GNS-Signature:  ${headers["X-GNS-Signature"].substring(0, 32)}...`
  );
  console.log(
    `\n  (To actually send: curl -X POST '${BACKEND}/v1/chat/completions' \\`
  );
  console.log(`     -H 'Content-Type: application/json' \\`);
  Object.entries(headers).forEach(([k, v]) =>
    console.log(`     -H '${k}: ${v}' \\`)
  );
  console.log(`     -d '${JSON.stringify(body)}')`);

  console.log("\n✅ Smoke test passed.");
}

main().catch((err) => {
  console.error("\n❌ Smoke test FAILED:", err);
  process.exit(1);
});
