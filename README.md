# Zolution

> AI-powered appointment scheduling agents for local businesses — no technical knowledge required.

Zolution is a SaaS platform that enables local businesses (dental clinics, barbershops, beauty salons, etc.) to deploy personalized AI agents on WhatsApp that handle appointment scheduling automatically. Business owners configure their agent through a guided conversational onboarding flow; no coding required.

---

## ✨ Key Differentiator

An AI-guided onboarding process asks the business owner targeted questions about their operation. The answers automatically feed a **prompt engineering engine** that generates a production-ready, guardrail-enforced **Master System Prompt** unique to each business.

---

## 🏗️ Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3.12 + FastAPI (async) | I/O-bound workload (LLM/WhatsApp/Calendar calls) |
| **Database** | PostgreSQL 16 | Shared schema, Row-Level Security (RLS) for multi-tenancy |
| **Auth** | Auth0 with Organizations | Multi-tenant B2B auth; one organization per business |
| **Messaging** | WhatsApp Cloud API (Meta) | No middleware cost per message |
| **Calendar** | Google Calendar API (OAuth2) | Per-business OAuth token |
| **LLM** | Adapter pattern (Anthropic / Google / OpenAI) | Provider-agnostic; swap without system-wide changes |
| **Frontend** | Angular 18+ | SPA with lazy-loaded feature modules |
| **Containers** | Docker + Docker Compose | Local dev parity; production-ready from day one |
| **CI** | GitHub Actions | Lint + type-check on every push/PR |

---

## 📁 Monorepo Structure

```
zolution/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, shared dependencies
│   │   ├── tenants/        # Multi-tenant business logic & models
│   │   ├── agents/         # Prompt building engine (LLM-agnostic)
│   │   ├── llm_providers/  # LLMProvider adapter: anthropic, google, openai
│   │   ├── integrations/   # whatsapp.py, google_calendar.py
│   │   ├── admin/          # Superadmin routes & logic (bypass RLS)
│   │   ├── auth/           # Auth0 token verification & user context
│   │   └── api/v1/         # FastAPI routers
│   ├── alembic/            # PostgreSQL migrations
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # Root app module & routing
│   │   ├── modules/
│   │   │   ├── onboarding/     # Conversational agent configuration wizard
│   │   │   ├── dashboard/      # Business owner panel (3 sections max)
│   │   │   ├── admin/          # Superadmin panel
│   │   │   └── chat-preview/   # Live agent simulator
│   │   ├── shared/         # Reusable components, services, models
│   │   ├── core/           # Guards, interceptors, singleton services
│   │   └── environments/   # environment.ts / environment.prod.ts
│   └── Dockerfile
├── .github/workflows/      # CI pipelines
├── docs/
│   ├── adr/                # Architecture Decision Records
│   └── diagrams/           # Architecture & flow diagrams
├── docker-compose.yml
└── .env.example
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Docker Desktop 4.x+
- Git

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/andresZam12/Zolution.git
cd zolution

# 2. Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Fill in the required values in each .env file (see comments inside)

# 4. Start all services
docker compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| FastAPI backend | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Angular frontend | http://localhost:4200 |
| PostgreSQL | localhost:5432 |

---

## 🧱 Architecture Decisions

All significant architecture choices are documented as **Architecture Decision Records** in [`docs/adr/`](./docs/adr/). Each ADR captures the context, decision, and trade-offs so that future contributors understand *why*, not just *what*.

| ADR | Decision |
|---|---|
| [ADR-001](./docs/adr/ADR-001-backend-framework.md) | Python + FastAPI as the backend framework |
| [ADR-002](./docs/adr/ADR-002-database-multitenancy.md) | PostgreSQL shared schema + RLS for multi-tenancy |
| [ADR-003](./docs/adr/ADR-003-authentication.md) | Auth0 with Organizations for MVP authentication |
| [ADR-004](./docs/adr/ADR-004-llm-provider-interface.md) | Adapter pattern for LLM provider abstraction |

---

## 🌿 Branching & Commit Convention

### Branch Naming

```
feat/<short-description>      # new feature
fix/<short-description>       # bug fix
chore/<short-description>     # maintenance, deps, tooling
docs/<short-description>      # documentation only
refactor/<short-description>  # code restructure without behavior change
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short imperative description>

[optional body explaining WHY, not what]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

---

## 📋 Development Phases

1. **Foundation** *(current)* — Monorepo scaffold, tooling, Docker, CI
2. **LLM Diagnostics** — Benchmark Anthropic / Google / OpenAI against 24 test conversations
3. **MVP (single tenant)** — Manual onboarding, working WhatsApp + Calendar agent for one pilot business
4. **Multi-tenant + Dynamic Onboarding** — AI-driven prompt generation, full RLS enforcement
5. **Production Hardening** — Kubernetes-ready, observability, billing integration

---

## 📄 License

Proprietary — All rights reserved. © 2024 Zolution.
