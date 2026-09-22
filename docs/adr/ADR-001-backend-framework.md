# ADR-001: Backend Framework — Python + FastAPI

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2024-01-01 |
| **Deciders** | Andrés Zamudio |

---

## Context

Zolution requires a backend that can handle high I/O concurrency efficiently. The dominant workload is I/O-bound: calls to LLM provider APIs (each taking 1–5 seconds), WhatsApp Cloud API, and Google Calendar API — all simultaneously for potentially hundreds of tenants.

The team has existing familiarity with Python. The backend needs to expose a REST API consumed by an Angular frontend and webhook endpoints for WhatsApp events.

## Decision

**Use Python 3.12 with FastAPI (async).**

FastAPI was chosen over alternatives (Flask, Django, Node/Express) for the following reasons:

1. **Native async/await** — `asyncio`-based from the ground up, so all I/O-bound calls (LLM, WhatsApp, Calendar) can be awaited concurrently without blocking threads.
2. **Automatic OpenAPI/Swagger docs** — reduces friction for API consumers and accelerates development.
3. **Pydantic v2 for data validation** — type-safe request/response models with runtime validation out of the box; aligns with the goal of legible, defensible code.
4. **Pythonic ecosystem for AI/ML tooling** — Anthropic, Google, and OpenAI SDKs are all Python-first; no adapter layer needed between the language and the LLM providers.
5. **Performance** — comparable to Node.js for I/O-bound workloads under async concurrency.

## Considered Alternatives

| Option | Reason not chosen |
|---|---|
| Flask | No native async support; would require workarounds (Quart) |
| Django | Heavier ORM and conventions that don't fit the API-only, async-first design |
| Node.js + Express | Team is Python-first; LLM SDKs are Python-first; no net benefit |
| Go (Gin/Fiber) | Faster runtime but significantly higher development friction for this team and LLM integrations |

## Consequences

- **Positive:** Fast development cycle, auto-generated API docs, type-safe models, full async concurrency.
- **Positive:** All LLM provider SDKs work natively without wrappers.
- **Negative:** Python's GIL is not relevant here (I/O-bound, not CPU-bound), but CPU-heavy tasks (if any emerge) would need to be offloaded to separate workers.
- **Negative:** Python is generally slower than compiled languages for CPU-intensive work — acceptable trade-off given the workload profile.

## References

- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [Python asyncio](https://docs.python.org/3/library/asyncio.html)
