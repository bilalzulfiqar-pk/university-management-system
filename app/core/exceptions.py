class AppException(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: dict | list | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class BadRequestError(AppException):
    def __init__(self, code: str, message: str, details: dict | list | None = None) -> None:
        super().__init__(code=code, message=message, status_code=400, details=details)


class UnauthorizedError(AppException):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code=code, message=message, status_code=401)


class ForbiddenError(AppException):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code=code, message=message, status_code=403)


class NotFoundError(AppException):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code=code, message=message, status_code=404)


class ConflictError(AppException):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code=code, message=message, status_code=409)


class TooManyRequestsError(AppException):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code=code, message=message, status_code=429)

