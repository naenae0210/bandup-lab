from banduplab.llm.anthropic_client import AnthropicClient
from banduplab.llm.base import LLMClient, LLMError
from banduplab.llm.openai_client import OpenAIClient

_PROVIDERS: dict[str, type[LLMClient]] = {
    "anthropic": AnthropicClient,
    "openai": OpenAIClient,
}

PROVIDERS = tuple(_PROVIDERS)


def create_llm_client(provider: str, api_key: str) -> LLMClient:
    try:
        cls = _PROVIDERS[provider]
    except KeyError as exc:
        raise LLMError(f"알 수 없는 공급자: {provider}") from exc
    return cls(api_key)
