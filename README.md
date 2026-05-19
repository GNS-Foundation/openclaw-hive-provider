# 🐝 GEIANT Hive Provider for OpenClaw

**Cryptographically-signed local AI inference. Zero cloud. Zero data leakage. EU AI Act ready.**

This plugin gives OpenClaw two things at once:

1. **Distributed local inference** — replaces cloud LLM APIs (Anthropic, OpenAI) with the GEIANT Hive swarm. Inference runs on devices you control; data never leaves your network.

2. **Cryptographic agent identity** — every OpenClaw decision, tool call, and inference becomes a signed breadcrumb in the GNS Protocol audit chain. Verifiable. Jurisdictional. EU AI Act Article 12 compliant by architecture.

Status: **Sprint 2 alpha** — initial scaffolding shipped, identity layer and signing in progress. See [Roadmap](#roadmap).

## Why?

|  | Cloud APIs (Anthropic / OpenAI) | GEIANT Hive |
|---|---|---|
| **Data residency** | Sent to US/EU cloud servers | Never leaves your network |
| **Cost** | $0.002 – $0.06 per token | Zero per-token (your hardware) |
| **Audit trail** | Trust the provider | Cryptographically verifiable |
| **Agent identity** | None | Ed25519 keypair, signed actions |
| **Jurisdiction proof** | None | H3 cell bound, EU AI Act ready |
| **500 users** | $10–30K/month | €990/month flat |
| **Offline** | No | Yes |

## Architecture

The plugin owns a GNS identity. Every request flows through it:

```
OpenClaw process starts
  ↓
@gns-foundation/openclaw-hive-provider loads
  ↓
Plugin reads or generates Ed25519 keypair
  (at $GEIANT_AGENT_IDENTITY_PATH, default
   ~/.config/geiant-hive/identity.json)
  ↓
Plugin registers identity with the swarm
  ↓
[OpenClaw normal operation]
  ↓
When OpenClaw calls the LLM provider:
  Plugin signs request with the agent's Ed25519 key
  POSTs to https://hive.geiant.com/v1/chat/completions
  with X-GNS-PublicKey, X-GNS-Timestamp, X-GNS-Signature
  ↓
Backend verifies signature → routes to swarm → returns response
  Audit trail: every chat completion is cryptographically tied
  to the agent's GNS identity, queryable forever.
```

This is what makes GEIANT a credible LangChain / CrewAI / AutoGen alternative for regulated and sovereign workloads: not by winning on ecosystem (we won't), but by covering the same functional ground with structurally better properties — verifiable audit, jurisdictional routing, cryptographic accountability.

## Roadmap

This repo is the Sprint 2 work item from the [GEIANT Hive Roadmap §12.3](https://docs.geiant.com/hive/roadmap#123-near-term-q3-2026--agent-orchestration). Progress:

- ✅ **Phase 0** — repo scaffolding (this commit)
- ⏳ **Phase 1** — backend identity layer (in `gns-backend` repo)
  - Migration 008: `agents` table
  - `POST /v1/agents/register` endpoint
  - `signed_request.ts` middleware extension to recognize agent identities
- ⏳ **Phase 2** — plugin implementation (this repo)
  - Identity bootstrap (`src/identity.ts`) — load or generate Ed25519 keypair
  - Signing module (`src/sign.ts`) — using tweetnacl, matches the worker's pattern
  - Registration flow (`src/register.ts`) — first-run, POSTs to `/v1/agents/register`
  - Request interceptor — every outbound `/v1/chat/completions` gets signed
- ⏳ **Phase 3** — demo artifact + publish
  - npm publish `0.1.0-alpha.1`
  - README screenshots
  - Live OpenClaw session with visible audit trail at hive.geiant.com/audit

## Quick Setup (will work after Phase 2 ships)

```bash
# Install
npm install @gns-foundation/openclaw-hive-provider

# Configure OpenClaw to use Hive
openclaw onboard --provider geiant-hive --hive-url https://hive.geiant.com/v1

# First run: plugin generates a GNS keypair and registers as an agent.
# Subsequent runs: signs every inference call with the agent's identity.
```

## Available Models (in production today)

| Model ref | Provider | Parameters | Best for |
|---|---|---|---|
| `geiant-hive/lfm2.5-1.2b-instruct` | Liquid AI | 1.2B | Default — fast, capable, edge-optimized |
| `geiant-hive/lfm2.5-1.2b-thinking` | Liquid AI | 1.2B | Multi-step reasoning, slower per token |
| `geiant-hive/phi-3-mini` | Microsoft | 3.8B | Strong general-purpose |
| `geiant-hive/tinyllama` | TinyLlama Project | 1.1B | Smoke tests, low-resource fallback |

More models planned for v0.7+ (Llama 3.1 8B, Mistral 7B, larger Liquid AI models).

## Why "Liquid AI" prominently?

We run [Liquid AI's LFM2.5 family](https://www.liquid.ai/) as the default Hive model. LFM2.5 is a frontier-quality small model with state-space architecture, well-suited for edge deployment on a decentralized swarm. Crediting upstream is good citizenship and good signal.

## Configuration

| Setting | Env var | Default |
|---|---|---|
| Identity file path | `GEIANT_AGENT_IDENTITY_PATH` | `~/.config/geiant-hive/identity.json` |
| Hive gateway URL | `HIVE_URL` | `https://hive.geiant.com/v1` |
| Jurisdiction (H3 cell) | (auto-detected) | from IP / timezone |
| Min worker trust tier | (per-call header) | `seedling` (accept all) |

## License

Apache-2.0. Same permissive license as the rest of the `@gns-foundation` ecosystem and OpenClaw itself.

---

**ULISSY s.r.l.** · Via Gaetano Sacchi 16, 00153 Roma · GNS Protocol · Proof-of-Trajectory™

*"OpenClaw gave AI agents hands. GEIANT gives them an identity, a jurisdiction, and a wallet."*
