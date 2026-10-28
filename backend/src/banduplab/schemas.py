import datetime as dt

from pydantic import BaseModel

from banduplab.models import AppSettings


class UsageOut(BaseModel):
    month: str | None
    request_count: int
    input_tokens: int
    output_tokens: int


class SettingsOut(BaseModel):
    ai_provider: str | None
    ai_model: str | None
    api_key_masked: str | None
    connection_status: str
    connection_checked_at: dt.datetime | None
    stt_model_size: str
    exam_date: dt.date | None
    daily_study_hours: int | None
    usage: UsageOut

    @classmethod
    def from_row(cls, row: AppSettings) -> "SettingsOut":
        return cls(
            ai_provider=row.ai_provider,
            ai_model=row.ai_model,
            api_key_masked=row.api_key_masked,
            connection_status=row.connection_status,
            connection_checked_at=row.connection_checked_at,
            stt_model_size=row.stt_model_size,
            exam_date=row.exam_date,
            daily_study_hours=row.daily_study_hours,
            usage=UsageOut(
                month=row.usage_month,
                request_count=row.usage_request_count,
                input_tokens=row.usage_input_tokens,
                output_tokens=row.usage_output_tokens,
            ),
        )


class SaveApiKeyIn(BaseModel):
    provider: str
    api_key: str


class SaveApiKeyOut(BaseModel):
    success: bool
    message: str
    models: list[str]
    settings: SettingsOut


class TestConnectionOut(BaseModel):
    success: bool
    message: str
    settings: SettingsOut


class UpdateModelIn(BaseModel):
    model: str


class UpdateStudyIn(BaseModel):
    exam_date: dt.date | None = None
    daily_study_hours: int | None = None


class UpdateSttModelSizeIn(BaseModel):
    stt_model_size: str


class ModelsOut(BaseModel):
    models: list[str]
