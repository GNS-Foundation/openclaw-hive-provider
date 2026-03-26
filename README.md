# 🐝 GEIANT Hive Provider for OpenClaw

**Run OpenClaw on your own hardware. Zero cloud. Zero API costs. Your data never leaves your building.**

GEIANT Hive turns idle desktops, laptops, and phones into a distributed AI inference cluster. This provider plugin replaces cloud LLM APIs (Anthropic, OpenAI) with local Hive inference — same quality, zero data leakage.

## Why?

| | Cloud APIs (Anthropic/OpenAI) | GEIANT Hive |
|---|---|---|
| **Data** | Sent to US/EU cloud servers | Never leaves your network |
| **Cost** | $0.002–0.06 per token | Zero (your hardware) |
| **500 users** | $10–30K/month | €990/month flat |
| **Compliance** | None | Cryptographic jurisdiction proof |
| **Offline** | No | Yes — fully local |

## Quick Setup

### Option 1: Local Hive Swarm (recommended)

Your OpenClaw agent runs inference on devices you control.

```bash
# 1. Start the Hive gateway on your network
cd ~/geiant-hive/packages/hive-gateway
node hive-gateway.js --model llama-8b --port 8080

# 2. Install the Hive provider in OpenClaw
cp -r openclaw-hive-provider ~/openclaw/extensions/geiant-hive

# 3. Configure OpenClaw to use Hive
openclaw onboard --provider geiant-hive --hive-url http://localhost:8080
```

### Option 2: Hive Cloud Gateway

Use the managed Hive endpoint (devices still run locally at subscriber organizations).

```bash
# 1. Get your API key at hive.geiant.com/keys
# 2. Install and configure
openclaw onboard --provider geiant-hive --hive-api-key hive_pk_live_xxxxx
```

### Option 3: Just set the environment variable

```bash
export HIVE_API_KEY=hive_pk_live_xxxxx
# or for local:
export HIVE_URL=http://localhost:8080
```

## Available Models

| Model | Parameters | RAM needed | Min devices | Best for |
|---|---|---|---|---|
| `geiant-hive/phi-3-mini` | 3.8B | 2.2 GB | 1 | Quick tasks, low-end hardware |
| `geiant-hive/llama-8b` | 8B | 4.6 GB | 2 | General purpose (default) |
| `geiant-hive/mistral-7b` | 7B | 4 GB | 2 | Efficient reasoning |
| `geiant-hive/llama-70b` | 70B | 35 GB | 20 | GPT-4 class quality |
| `geiant-hive/qwen-72b` | 72B | 36 GB | 20 | Frontier multilingual |

## How It Works

```
Your message (Telegram/WhatsApp/GCRUMBS)
  │
  ▼
OpenClaw Gateway
  │
  ▼
GEIANT Hive Provider (this plugin)
  │
  ▼
Hive API Gateway (hive.geiant.com/v1 or localhost:8080/v1)
  │
  ├─ Discovers devices from swarm registry (Supabase)
  ├─ Computes optimal layer assignments
  ├─ Launches llama-server with --rpc
  │
  ▼
Distributed inference across your devices
  │
  ├── MacBook Pro M4 (layers 0–19, Metal GPU)
  ├── MacBook Air M1 (layers 20–31, CPU/Metal)
  ├── Office Desktop #1 (layers ...)
  └── ... up to 100+ devices
  │
  ▼
Response streams back to your chat
```

No token ever leaves your network. Every inference is cryptographically logged as a compute breadcrumb on the GNS Protocol.

## Architecture Advantages

### 🔐 Privacy by Architecture
Cloud APIs promise privacy through policy. Hive guarantees it through architecture — inference runs on devices **you** physically control. There is no server to subpoena because there is no server.

### 🏛️ EU AI Act Ready
Every inference session produces a compliance report: which devices participated, in which H3 jurisdiction cell, with what delegation certificates. August 2, 2026 deadline — Hive is ready.

### 💰 GNS Token Economy
Devices earn GNS tokens for compute contributions. Settlement: 40% platform, 35% community (device operators), 15% hydration (model distribution), 5% sovereign (coordinators). Settled on Stellar blockchain in one atomic transaction.

### 🆔 GNS Identity
Your OpenClaw agent can be bound to a GNS identity (Ed25519 keypair). This gives it:
- A `@handle` (like @myclaw-agent)
- Proof-of-Trajectory (every action is a breadcrumb)
- Delegation certificates (CTO delegates to department agents)
- Stellar wallet (agent can make/receive payments)

## Performance

Real benchmarks from March 25, 2026:

| Config | Prompt (tok/s) | Generation (tok/s) |
|---|---|---|
| M4 Pro single (Phi-3) | 382 | 34.1 |
| M4 + M1 WiFi (Phi-3) | 55.6 | 13.1 |
| M4 Pro single (Llama-8B) | 222 | 20.3 |
| 30 desktops sim (Llama-8B) | — | 272.7 |
| 50 GPUs sim (Llama-70B) | — | 238.8 |

30 office desktops running Llama-8B achieve **6.8× the throughput of a single NVIDIA A100**.

## GCRUMBS Channel

For maximum privacy, use GCRUMBS as your OpenClaw messaging channel instead of Telegram/WhatsApp:
- End-to-end encrypted with Ed25519
- Every message is a breadcrumb (Proof-of-Trajectory)
- Agent responses are signed and jurisdiction-bound
- Zero third-party servers see your commands

Download GCRUMBS: [App Store](#) | [Google Play](#)

## Links

- **Dashboard**: [hive.geiant.com](https://hive.geiant.com)
- **API Docs**: [hive.geiant.com/docs](https://hive.geiant.com/docs)
- **GNS Protocol**: [gcrumbs.com](https://gcrumbs.com)
- **GEIANT**: [geiant.com](https://geiant.com)
- **Stellar Settlement**: [TX on StellarExpert](https://stellar.expert/explorer/public/tx/34b02ac18a923bcf050e4177b8c5accc87abbb0674ba6cc3a6b4b6807dff56dd)
- **Patent**: USPTO #63/948,788

## License

MIT — same as OpenClaw.

---

**ULISSY s.r.l.** · Via Gaetano Sacchi 16, 00153 Roma · GNS Protocol · Proof-of-Trajectory™

*"OpenClaw gave AI agents hands. GEIANT gives them an identity, a jurisdiction, and a wallet."*
