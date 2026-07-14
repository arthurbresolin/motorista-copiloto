from fastapi import FastAPI

from app.api.checklist import router as checklist_router

app = FastAPI(title="Motorista Copiloto API")
app.include_router(checklist_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
