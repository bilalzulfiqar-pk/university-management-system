from __future__ import annotations

import time
from collections import defaultdict
from collections.abc import Hashable
from threading import Lock

from app.core.exceptions import TooManyRequestsError
from app.core.redis_client import RedisError, get_redis_client


class FixedWindowRateLimiter:
    def __init__(
        self,
        *,
        max_attempts: int,
        window_seconds: int,
        error_code: str = "RATE_LIMIT_EXCEEDED",
        error_message: str = "Too many requests. Please try again later.",
        namespace: str = "default",
    ) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.error_code = error_code
        self.error_message = error_message
        self.namespace = namespace
        self._fallback: dict[str, tuple[int, int]] = defaultdict(lambda: (0, 0))
        self._lock = Lock()
        self._prefix = f"ums:ratelimit:{namespace}"

    def _bucket(self) -> int:
        return int(time.time()) // self.window_seconds

    def _redis_key(self, key: Hashable) -> str:
        return f"{self._prefix}:{key}:{self._bucket()}"

    def check(self, key: Hashable) -> None:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                redis_key = self._redis_key(key)
                count = redis_client.incr(redis_key)
                if count == 1:
                    redis_client.expire(redis_key, self.window_seconds + 1)
                if count > self.max_attempts:
                    raise TooManyRequestsError(code=self.error_code, message=self.error_message)
                return
            except RedisError:
                pass

        bucket = self._bucket()
        local_key = str(key)
        with self._lock:
            current_bucket, current_count = self._fallback[local_key]
            if current_bucket != bucket:
                current_bucket, current_count = bucket, 0
            current_count += 1
            self._fallback[local_key] = (current_bucket, current_count)
            if current_count > self.max_attempts:
                raise TooManyRequestsError(code=self.error_code, message=self.error_message)

    def clear(self, key: Hashable) -> None:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                redis_client.delete(self._redis_key(key))
                return
            except RedisError:
                pass

        with self._lock:
            self._fallback.pop(str(key), None)

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
