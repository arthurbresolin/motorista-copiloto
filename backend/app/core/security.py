from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

JWT_ALGORITHM = "HS256"
# Sem refresh token no projeto — "fica logado até deslogar manualmente" é
# resolvido com um token de validade bem longa guardado com segurança no
# aparelho (expo-secure-store / localStorage), em vez de infra de refresh.
ACCESS_TOKEN_EXPIRE_DAYS = 365
# Sessão curta usada quando o aluno desmarca "lembrar de mim" no login —
# ainda funciona por um bom tempo de uso (não desloga no meio da aula),
# mas não fica valendo por um ano num aparelho compartilhado/público.
SHORT_SESSION_EXPIRE_DAYS = 1


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(subject_id: int, role: str, expire_days: int = ACCESS_TOKEN_EXPIRE_DAYS) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=expire_days)
    payload = {"sub": str(subject_id), "role": role, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str, expected_role: str) -> int | None:
    # A claim "role" existe pra que um token de aluno e um de instrutor com o
    # mesmo id numérico nunca sejam intercambiáveis entre si — sem isso os
    # dois tipos de token, gerados com o mesmo segredo/algoritmo, seriam
    # bytes-a-byte indistinguíveis.
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("role") != expected_role:
        return None
    subject = payload.get("sub")
    if subject is None:
        return None
    try:
        return int(subject)
    except ValueError:
        return None
