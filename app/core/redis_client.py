from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import settings


logger = logging.getLogger("ums.security")

try:
    from redis import Redis
    from redis.exceptions import RedisError
except Exception:  # pragma: no cover - handled by fallback logic
    Redis = None  # type: ignore[assignment]

    class RedisError(Exception):
        pass


@lru_cache
def get_redis_client() -> Redis | None:
    if not settings.redis_url or Redis is None:
        return None
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception as exc:  # pragma: no cover - availability varies per environment
        if settings.is_production:
            raise RuntimeError("Redis is required but could not be reached.") from exc
        logger.warning("Redis unavailable, falling back to in-memory security stores.")
        return None
