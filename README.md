# AutoGrant — AI-Governed Grant Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-8b5cf6)](https://genlayer.com)
[![Network](https://img.shields.io/badge/Network-Studionet-10b981)](https://studio.genlayer.com)

> An intelligent, AI-governed grant protocol where GenLayer validators autonomously evaluate open-source projects and adjudicate funding decisions through cryptographic consensus — no human committee needed.

---

## 🌟 What It Does

AutoGrant uses GenLayer's **Optimistic Democracy** consensus to replace slow, opaque grant committees with a transparent, on-chain AI jury.

1. **Submit** your GitHub repository + live project URL
2. **5 AI validators** independently fetch your GitHub & website, score the project, and compare notes
3. **Consensus is reached** on a score (0–100) and feedback string
4. **Grant is approved** on-chain if the score meets the threshold (≥ 70)

No bias. No politics. Fully auditable on-chain.

---

## 🏗️ Architecture

```
contracts/
  autogrant.py          # GenLayer Intelligent Contract (Python)
evm/
  AutoGrantEscrow.sol   # EVM escrow contract for fund settlement (Base Sepolia)
frontend/
  src/
    App.tsx             # React UI with MetaMask wallet connect
    App.css             # Responsive glassmorphism design
  deploy.js             # Programmatic deployment script
```

### How Consensus Works

The contract uses `gl.eq_principle.prompt_non_comparative` — the correct GenLayer pattern for AI-generated outputs:

- **Leader validator**: fetches URLs + runs LLM prompt → produces score + feedback
- **Validator validators**: receive the leader's output and judge if it meets criteria (without re-running the LLM)
- **Result**: deterministic consensus even though LLMs are non-deterministic

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- GEN tokens on **GenLayer Studionet** (get from [studio.genlayer.com](https://studio.genlayer.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-handle/autogrant.git
cd autogrant/frontend
npm install
```

### 2. Set up Environment

Create `.env` in the project root:

```env
PRI_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 3. Deploy the Contract (optional — already deployed)

```bash
cd frontend
node deploy.js
```

The contract is already deployed on Studionet at:
```
0x78a3C98826C3bb26F20eD13EF95035afD682181f
```

### 4. Run the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing the Flow

### Quick Test (in the UI)

Use the **⚡ Quick Test** preset buttons in the UI:

| Preset | Expected Score | Reason |
|---|---|---|
| 🚀 **GenLayer (High Impact)** | ~60–80 | Active Web3 infra project with real documentation |
| 👾 **Hello World (Low Impact)** | ~10–25 | Trivial example repo, no real-world utility |

This demonstrates that the AI correctly distinguishes high-impact public goods from low-utility repos.

### What You'll See in the Explorer

Visit [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com) to inspect any transaction.

> **Note:** If you submit the same URLs that were already used in a previous session, the explorer may show `Exception: Application already submitted` or `Exception: Application already evaluated`. **This is expected** — the application is stored on-chain and the UI will automatically display the previously computed result.

---

## 🔗 Contract Details

| Property | Value |
|---|---|
| Network | GenLayer Studionet |
| Contract Address | `0x78a3C98826C3bb26F20eD13EF95035afD682181f` |
| Explorer | [explorer-studio.genlayer.com](https://explorer-studio.genlayer.com) |
| Min Score for Approval | 70 / 100 |
| Validators | 5 |

### Contract Methods

| Method | Type | Description |
|---|---|---|
| `submit_application(github_url, project_url)` | write | Registers a new grant application on-chain |
| `evaluate_application(app_id)` | write | Triggers AI consensus evaluation |
| `get_application(app_id)` | view | Returns evaluation result, score, and feedback |

---

## 💡 Key GenLayer Concepts Used

- **`gl.nondet.web.get(url)`** — Non-deterministic web fetching inside consensus blocks
- **`gl.nondet.exec_prompt(prompt, response_format="json")`** — LLM calls with structured output
- **`gl.eq_principle.prompt_non_comparative(...)`** — The correct consensus strategy for AI-generated content (leader produces, validators judge)
- **`TreeMap[str, GrantApplication]`** — Persistent on-chain storage

---

## 🛣️ Roadmap

- [x] GenLayer Intelligent Contract with AI consensus
- [x] React frontend with MetaMask wallet connect
- [x] Network auto-switch to GenLayer Studionet
- [x] Responsive UI with block explorer links
- [ ] EVM Escrow deployment on Base Sepolia
- [ ] Cross-chain relayer (GenLayer → Base event bridge)
- [ ] Re-evaluation requests with appeal bond

---

## 💬 Community

- [GenLayer Discord](https://discord.gg/8Jm4v89VAu)
- [GenLayer Telegram](https://t.me/genlayer)
- [GenLayer Docs](https://docs.genlayer.com)

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.
