from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.route.auth import endpoints as auth_endpoints
from app.api.route.v1 import activities as activities_endpoints
from app.api.route.v1 import live_status as live_status_endpoints
from app.api.route.v1 import rooms as rooms_endpoints
from app.api.route.v1 import users as users_endpoints
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_endpoints.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(activities_endpoints.router, prefix=f"{settings.API_V1_STR}/activities", tags=["activities"])
app.include_router(users_endpoints.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(rooms_endpoints.router, prefix=f"{settings.API_V1_STR}/rooms", tags=["rooms"])
app.include_router(live_status_endpoints.router, prefix=f"{settings.API_V1_STR}/live-status", tags=["live-status"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
