from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.database.connection import Base, engine
from app.models import mikrotik_config  # noqa - registra model
from app.api import auth, chat, mikrotik

Base.metadata.create_all(bind=engine)
settings = get_settings()

app = FastAPI(title=settings.app_name, version=settings.app_version, docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(mikrotik.router)

@app.get("/")
def root():
    return {"status": "online", "app": settings.app_name}
