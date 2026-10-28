from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from banduplab.db import get_db
from banduplab.llm.base import LLMError
from banduplab.schemas import (
    ModelsOut,
    SaveApiKeyIn,
    SaveApiKeyOut,
    SettingsOut,
    TestConnectionOut,
    UpdateModelIn,
    UpdateSttModelSizeIn,
    UpdateStudyIn,
)
from banduplab.services import settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)) -> SettingsOut:
    row = settings_service.get_or_create_settings(db)
    return SettingsOut.from_row(row)


@router.put("/ai/key", response_model=SaveApiKeyOut)
async def save_api_key(body: SaveApiKeyIn, db: Session = Depends(get_db)) -> SaveApiKeyOut:
    try:
        row, success, message, models = await settings_service.save_api_key(
            db, body.provider, body.api_key
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return SaveApiKeyOut(
        success=success, message=message, models=models, settings=SettingsOut.from_row(row)
    )


@router.delete("/ai/key", response_model=SettingsOut)
def delete_api_key(db: Session = Depends(get_db)) -> SettingsOut:
    row = settings_service.delete_api_key(db)
    return SettingsOut.from_row(row)


@router.post("/ai/test", response_model=TestConnectionOut)
async def test_connection(db: Session = Depends(get_db)) -> TestConnectionOut:
    success, message = await settings_service.test_connection(db)
    row = settings_service.get_or_create_settings(db)
    return TestConnectionOut(success=success, message=message, settings=SettingsOut.from_row(row))


@router.get("/ai/models", response_model=ModelsOut)
async def list_models(db: Session = Depends(get_db)) -> ModelsOut:
    try:
        models = await settings_service.list_models_for_saved_key(db)
    except LLMError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ModelsOut(models=models)


@router.patch("/ai/model", response_model=SettingsOut)
def update_model(body: UpdateModelIn, db: Session = Depends(get_db)) -> SettingsOut:
    row = settings_service.update_model(db, body.model)
    return SettingsOut.from_row(row)


@router.patch("/study", response_model=SettingsOut)
def update_study(body: UpdateStudyIn, db: Session = Depends(get_db)) -> SettingsOut:
    row = settings_service.update_study(db, body.exam_date, body.daily_study_hours)
    return SettingsOut.from_row(row)


@router.patch("/stt-model-size", response_model=SettingsOut)
def update_stt_model_size(body: UpdateSttModelSizeIn, db: Session = Depends(get_db)) -> SettingsOut:
    row = settings_service.update_stt_model_size(db, body.stt_model_size)
    return SettingsOut.from_row(row)
