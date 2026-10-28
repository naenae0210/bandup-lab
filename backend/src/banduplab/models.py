import datetime as dt

from sqlalchemy import Date, DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AppSettings(Base):
    """앱 설정 싱글톤 행(id=1). 사용자 1명이 자기 컴퓨터에서 쓰는 개인용 앱이라 테이블 전체가 한 행이다."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    ai_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ai_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    api_key_encrypted: Mapped[str | None] = mapped_column(String, nullable=True)
    api_key_masked: Mapped[str | None] = mapped_column(String(64), nullable=True)
    connection_status: Mapped[str] = mapped_column(String(16), default="untested")
    connection_checked_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    stt_model_size: Mapped[str] = mapped_column(String(16), default="small")
    exam_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    daily_study_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usage_month: Mapped[str | None] = mapped_column(String(7), nullable=True)
    usage_request_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    usage_output_tokens: Mapped[int] = mapped_column(Integer, default=0)
