from collections import defaultdict, deque
from collections.abc import Hashable
from datetime import datetime, timedelta, timezone
from threading import Lock

from app.core.exceptions import TooManyRequestsError


class FixedWindowRateLimiter:
    def __init__(self, *, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._events: dict[Hashable, deque[datetime]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: Hashable) -> None:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=self.window_seconds)

        with self._lock:
            attempts = self._events[key]
            while attempts and attempts[0] < cutoff:
                attempts.popleft()
            if len(attempts) >= self.max_attempts:
                raise TooManyRequestsError(
                    code="RATE_LIMIT_EXCEEDED",
                    message="Too many login attempts. Please try again later.",
                )
            attempts.append(now)

    def clear(self, key: Hashable) -> None:
        with self._lock:
            self._events.pop(key, None)

