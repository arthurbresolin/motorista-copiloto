from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.cars import router as cars_router
from app.api.checklist import router as checklist_router
from app.api.monitor_sessions import router as monitor_sessions_router
from app.api.practice_sessions import router as practice_sessions_router
from app.api.quiz import router as quiz_router

app = FastAPI(title="Motorista Copiloto API")

# v1 roda só localmente para um único usuário (sem cookies/credenciais),
# então liberar qualquer origem é seguro e evita reconfigurar a cada porta
# que o Expo (web/túnel/dispositivo) decidir usar.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cars_router)
app.include_router(checklist_router)
app.include_router(monitor_sessions_router)
app.include_router(practice_sessions_router)
app.include_router(quiz_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
