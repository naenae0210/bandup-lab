from openai import APIConnectionError, APIStatusError, AsyncOpenAI, AuthenticationError

from banduplab.llm.base import LLMClient, LLMError


class OpenAIClient(LLMClient):
    def __init__(self, api_key: str) -> None:
        self._client = AsyncOpenAI(api_key=api_key)

    async def test_connection(self) -> None:
        await self.list_models()

    async def list_models(self) -> list[str]:
        try:
            page = await self._client.models.list()
        except AuthenticationError as exc:
            raise LLMError("API 키가 올바르지 않습니다") from exc
        except APIConnectionError as exc:
            raise LLMError("공급자에 연결할 수 없습니다") from exc
        except APIStatusError as exc:
            raise LLMError(f"공급자 오류: {exc.message}") from exc
        return sorted(model.id for model in page.data)
