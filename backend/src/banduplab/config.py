from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_secret: str
    database_url: str


settings = Settings()  # type: ignore[call-arg]
