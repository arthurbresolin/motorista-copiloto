from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    database_url: str = "sqlite+aiosqlite:///./motorista_copiloto.db"
    anthropic_api_key: str | None = None
    # v1 roda só localmente pra um único usuário (mesmo raciocínio do CORS em
    # main.py) — um valor fixo em dev é aceitável; em produção real precisaria
    # vir de um segredo de verdade via APP_JWT_SECRET_KEY.
    jwt_secret_key: str = "dev-secret-troque-em-producao-0123456789"


settings = Settings()
