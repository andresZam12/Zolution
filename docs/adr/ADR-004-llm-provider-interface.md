# ADR-004: LLM Provider Strategy — Adapter Pattern for Provider Abstraction

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2024-01-01 |
| **Deciders** | Andrés Zamudio |

---

## Context

Zolution's core product relies on a Large Language Model (LLM) to power the conversational agent for each business. The LLM market is rapidly evolving: pricing changes frequently, new models appear regularly, and performance characteristics differ between providers.

Three main candidates were identified at project start:

| Provider | Model | Input / Output (per 1M tokens) | Key advantage |
|---|---|---|---|
| Anthropic | Claude Haiku 4.5 | $1 / $5 | Best guardrail adherence; prompt caching |
| Google | Gemini 2.5 Flash | $0.30 / $2.50 | 1M context window; strong function calling |
| OpenAI | GPT-4o mini | $0.25 / $2.00 | Mature ecosystem; large context |
| DeepSeek | V3.2 | $0.14 / $0.28 | Cheapest; weaker SLA/ecosystem |

A final provider selection will be made after running a structured diagnostic (see `docs/adr/ADR-004` references and project documentation Section 5.2): 24 test conversations across 4 categories (normal flow, ambiguity, off-topic, adversarial), scored on precision, guardrail adherence, naturalness, and cost.

## Decision

**Implement an adapter (interface) pattern for all LLM provider integrations. No direct SDK calls outside of `backend/app/llm_providers/`.**

The interface contract:

```python
# backend/app/llm_providers/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator

@dataclass
class LLMResponse:
    content: str
    input_tokens: int
    output_tokens: int
    provider: str
    model: str

class LLMProvider(ABC):
    """Abstract base for all LLM provider adapters."""

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        *,
        temperature: float = 0.3,
        max_tokens: int = 500,
    ) -> LLMResponse:
        """Generate a response given a system prompt and message history."""
        ...

    @abstractmethod
    async def stream(
        self,
        system_prompt: str,
        messages: list[dict],
        *,
        temperature: float = 0.3,
        max_tokens: int = 500,
    ) -> AsyncIterator[str]:
        """Stream tokens as they are generated."""
        ...
```

Concrete adapters will be implemented at:
- `backend/app/llm_providers/anthropic_provider.py`
- `backend/app/llm_providers/google_provider.py`
- `backend/app/llm_providers/openai_provider.py`

A factory function in `backend/app/llm_providers/factory.py` returns the configured provider:

```python
def get_llm_provider(provider_name: str) -> LLMProvider:
    providers = {
        "anthropic": AnthropicProvider,
        "google": GoogleProvider,
        "openai": OpenAIProvider,
    }
    if provider_name not in providers:
        raise ValueError(f"Unknown LLM provider: {provider_name}")
    return providers[provider_name]()
```

The `agent_configs` table stores `llm_provider` per tenant, enabling per-tenant model routing in the future.

## Consequences

- **Positive:** The diagnostic (benchmarking all 3 providers) can be run without changing agent logic — only the provider passed to `generate()` changes.
- **Positive:** Switching providers in production is a configuration change, not a code change.
- **Positive:** Per-tenant provider routing becomes trivial (e.g., give enterprise tenants access to GPT-4 while standard tenants use Haiku).
- **Positive:** The 24-conversation test suite becomes the regression suite — run it on any provider change to verify no guardrail regressions.
- **Negative:** Slightly more initial boilerplate than calling the SDK directly.
- **Negative:** The common interface must be designed to accommodate the lowest common denominator across providers (e.g., prompt caching is Anthropic-specific and will be implemented as an optional extension, not part of the base interface).

## Provider Selection Criterion (from diagnostic)

> Discard any provider that fails 2 or more cases in the "adversarial" category. Among those that pass, choose the cheapest.

This prevents selecting a model based on subjective impression alone.

## References

- [Anthropic Python SDK](https://github.com/anthropic-ai/anthropic-sdk-python)
- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
