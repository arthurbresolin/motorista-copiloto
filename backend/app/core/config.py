from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/media/ — arquivos enviados por usuário (avatar, fotos de exercício),
# fora do controle de versão (ver .gitignore). Caminho fixo e não configurável
# via env por enquanto, já que o backend roda sempre localmente.
MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "media"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

    database_url: str = "sqlite+aiosqlite:///./motorista_copiloto.db"
    anthropic_api_key: str | None = None
    # Usada só pela análise de foto (app/api/coach.py) — Gemini tem camada
    # gratuita, ao contrário da API da Anthropic, então essa é a chave usada
    # pra visão computacional enquanto o feedback de texto continua no Claude.
    google_api_key: str | None = None
    # v1 roda só localmente pra um único usuário (mesmo raciocínio do CORS em
    # main.py) — um valor fixo em dev é aceitável; em produção real precisaria
    # vir de um segredo de verdade via APP_JWT_SECRET_KEY.
    jwt_secret_key: str = "dev-secret-troque-em-producao-0123456789"
    # E-mail de redefinição de senha, via Resend (camada gratuita, sem precisar
    # de domínio próprio verificado).
    resend_api_key: str | None = None
    email_from: str = "Motorista Copiloto <onboarding@resend.dev>"
    # Equivalente de backend pro EXPO_PUBLIC_WEB_URL do frontend — usado pra
    # montar o link de redefinição de senha. Precisa ficar sincronizado
    # manualmente com a URL do túnel atual (mesma realidade operacional do
    # link de convite de instrutor).
    web_url: str | None = None
    # Valor configurado manualmente no painel do RevenueCat (Authorization
    # Header do webhook) — comparado byte a byte contra o header recebido.
    # None enquanto a conta RevenueCat não existe: webhook fica bloqueado por
    # padrão em vez de aceitar eventos não autenticados.
    revenuecat_webhook_secret: str | None = None


settings = Settings()
