import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.exceptions import AppException


logger = logging.getLogger("ums")


def build_error_response(
    *,
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: dict | list | None = None,
) -> JSONResponse:
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "request_id": getattr(request.state, "request_id", None),
        },
    }
    if details is not None:
        payload["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        if exc.status_code >= 500:
            logger.exception("Application exception raised.", exc_info=exc)
        else:
            logger.warning("Application exception raised: %s", exc.code)
        return build_error_response(
            request=request,
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        logger.warning("Validation error on %s %s", request.method, request.url.path)
        return build_error_response(
            request=request,
            status_code=422,
            code="VALIDATION_ERROR",
            message="Request validation failed.",
            details=jsonable_encoder(exc.errors()),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_exception_handler(request: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("Integrity error on %s %s", request.method, request.url.path)
        return build_error_response(
            request=request,
            status_code=409,
            code="CONFLICT",
            message="The request conflicts with existing data.",
            details={"db_error": str(exc.orig)} if settings.debug else None,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return build_error_response(
            request=request,
            status_code=500,
            code="INTERNAL_SERVER_ERROR",
            message="Something went wrong.",
            details={"error": str(exc)} if settings.debug else None,
        )
