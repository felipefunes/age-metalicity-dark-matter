from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import correlations, galaxies

app = FastAPI(
    title="Dark Matter, Metallicity & Age API",
    description=(
        "Cruce de cinemática galáctica (SPARC) con metalicidad y edad estelar "
        "de catálogos externos, para explorar correlaciones con la fracción de "
        "materia oscura, controlando por masa."
    ),
    version="0.1.0",
)

allowed_origins = os.environ.get("API_CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(galaxies.router)
app.include_router(correlations.router)


@app.get("/health")
def health():
    return {"status": "ok"}
