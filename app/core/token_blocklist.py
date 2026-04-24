from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock

from app.core.redis_client import RedisError, get_redis_client


class AccessTokenBlocklist:
    def __init__(self) -> None:
        self._fallback: dict[str, datetime] = {}
        self._lock = Lock()
        self._prefix = "ums:denylist"

    def block(self, jti: str, expires_at: datetime) -> None:
        redis_client = get_redis_client()
        ttl = max(int((expires_at - datetime.now(timezone.utc)).total_seconds()), 1)
        if redis_client is not None:
            try:
                redis_client.setex(f"{self._prefix}:{jti}", ttl, "1")
                return
            except RedisError:
                pass

        with self._lock:
            self._fallback[jti] = expires_at

    def contains(self, jti: str) -> bool:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                return bool(redis_client.exists(f"{self._prefix}:{jti}"))
            except RedisError:
                pass

        now = datetime.now(timezone.utc)
        with self._lock:
            expired = [key for key, expiry in self._fallback.items() if expiry <= now]
            for key in expired:
                self._fallback.pop(key, None)
            expiry = self._fallback.get(jti)
            return expiry is not None and expiry > now

    def reset(self) -> None:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                keys = list(redis_client.scan_iter(f"{self._prefix}:*"))
                if keys:
                    redis_client.delete(*keys)
                return
            except RedisError:
                pass

        with self._lock:
            self._fallback.clear()


access_token_blocklist = AccessTokenBlocklist()
