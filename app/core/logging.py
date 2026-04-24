import json
import logging

from app.core.config import settings


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(message)s",
    )


def log_security_event(event: str, **fields) -> None:
    logger = logging.getLogger("ums.security")
    payload = {"event": event, **fields}
    logger.info(json.dumps(payload))
