from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import register_middleware


configure_logging()


def create_app() -> FastAPI:
    settings.validate_runtime_security()
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        docs_url="/docs" if settings.show_docs else None,
        redoc_url="/redoc" if settings.show_docs else None,
        openapi_url="/openapi.json" if settings.show_docs else None,
    )
    register_middleware(app)
    register_exception_handlers(app)
    app.include_router(api_router)

    @app.get("/health", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
