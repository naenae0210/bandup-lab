import datetime as dt

from sqlalchemy.orm import Session

from banduplab.config import settings as app_config
from banduplab.llm.base import LLMError
from banduplab.llm.factory import PROVIDERS, create_llm_client
from banduplab.models import AppSettings
from banduplab.security import decrypt_api_key, encrypt_api_key, mask_api_key


def get_or_create_settings(db: Session) -> AppSettings:
    row = db.get(AppSettings, 1)
    if row is None:
        row = AppSettings(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    _reset_usage_if_new_month(db, row)
    return row


def _reset_usage_if_new_month(db: Session, row: AppSettings) -> None:
    current_month = dt.date.today().strftime("%Y-%m")
    if row.usage_month != current_month:
        row.usage_month = current_month
        row.usage_request_count = 0
        row.usage_input_tokens = 0
        row.usage_output_tokens = 0
        db.commit()


async def save_api_key(
    db: Session, provider: str, api_key: str
) -> tuple[AppSettings, bool, str, list[str]]:
    if provider not in PROVIDERS:
        raise ValueError(f"알 수 없는 공급자: {provider}")

    row = get_or_create_settings(db)
    client = create_llm_client(provider, api_key)

    try:
        models = await client.list_models()
    except LLMError as exc:
        row.connection_status = "failed"
        row.connection_checked_at = dt.datetime.now(dt.UTC)
        db.commit()
        return row, False, str(exc), []

    row.ai_provider = provider
    row.api_key_encrypted = encrypt_api_key(api_key, app_config.app_secret)
    row.api_key_masked = mask_api_key(api_key)
    if row.ai_model not in models:
        row.ai_model = models[0] if models else None
    row.connection_status = "connected"
    row.connection_checked_at = dt.datetime.now(dt.UTC)
    db.commit()
    db.refresh(row)
    return row, True, "연결 성공", models


def delete_api_key(db: Session) -> AppSettings:
    row = get_or_create_settings(db)
    row.ai_provider = None
    row.ai_model = None
    row.api_key_encrypted = None
    row.api_key_masked = None
    row.connection_status = "untested"
    row.connection_checked_at = None
    db.commit()
    db.refresh(row)
    return row


async def test_connection(db: Session) -> tuple[bool, str]:
    row = get_or_create_settings(db)
    if not row.api_key_encrypted or not row.ai_provider:
        return False, "저장된 API 키가 없습니다"

    raw_key = decrypt_api_key(row.api_key_encrypted, app_config.app_secret)
    client = create_llm_client(row.ai_provider, raw_key)
    try:
        await client.test_connection()
    except LLMError as exc:
        row.connection_status = "failed"
        row.connection_checked_at = dt.datetime.now(dt.UTC)
        db.commit()
        return False, str(exc)

    row.connection_status = "connected"
    row.connection_checked_at = dt.datetime.now(dt.UTC)
    db.commit()
    return True, "연결 성공"


async def list_models_for_saved_key(db: Session) -> list[str]:
    row = get_or_create_settings(db)
    if not row.api_key_encrypted or not row.ai_provider:
        raise LLMError("저장된 API 키가 없습니다")
    raw_key = decrypt_api_key(row.api_key_encrypted, app_config.app_secret)
    client = create_llm_client(row.ai_provider, raw_key)
    return await client.list_models()


def update_model(db: Session, model: str) -> AppSettings:
    row = get_or_create_settings(db)
    row.ai_model = model
    db.commit()
    db.refresh(row)
    return row


def update_study(
    db: Session, exam_date: dt.date | None, daily_study_hours: int | None
) -> AppSettings:
    row = get_or_create_settings(db)
    row.exam_date = exam_date
    row.daily_study_hours = daily_study_hours
    db.commit()
    db.refresh(row)
    return row


def update_stt_model_size(db: Session, size: str) -> AppSettings:
    row = get_or_create_settings(db)
    row.stt_model_size = size
    db.commit()
    db.refresh(row)
    return row
