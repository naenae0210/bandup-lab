from abc import ABC, abstractmethod


class LLMError(Exception):
    """공급자 SDK 예외를 사용자에게 보여줄 메시지로 바꾼 것."""


class LLMClient(ABC):
    @abstractmethod
    async def test_connection(self) -> None:
        """연결에 실패하면 LLMError를 던진다."""

    @abstractmethod
    async def list_models(self) -> list[str]:
        """공급자가 제공하는 모델 id 목록을 가져온다."""
