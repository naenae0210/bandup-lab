from anthropic import APIConnectionError, APIStatusError, AsyncAnthropic

from banduplab.llm.base import LLMClient, LLMError


class AnthropicClient(LLMClient):
    def __init__(self, api_key: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)

    async def test_connection(self) -> None:
        await self.list_models()

    async def list_models(self) -> list[str]:
        try:
            page = await self._client.models.list(limit=50)
        except APIStatusError as exc:
            if exc.status_code == 401:
                raise LLMError("API 키가 올바르지 않습니다") from exc
            raise LLMError(f"공급자 오류: {exc.message}") from exc
        except APIConnectionError as exc:
            raise LLMError("공급자에 연결할 수 없습니다") from exc
        return [model.id for model in page.data]
