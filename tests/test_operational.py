from app.core import middleware as middleware_module
from app.core.config import settings
from app.services import auth as auth_module


def stateful_headers(client) -> dict[str, str]:
    headers = {"Origin": "http://testserver"}
    csrf_token = client.cookies.get(settings.csrf_cookie_name)
    if csrf_token:
        headers["X-CSRF-Token"] = csrf_token
    return headers


def login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response


def create_department(client) -> None:
    response = client.post(
        "/api/v1/admin/departments",
        headers=stateful_headers(client),
        json={"name": "Audit Department", "code": "ADT"},
    )
    assert response.status_code == 201


def test_admin_audit_logs_capture_admin_mutations(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")

    create_department(client)

    audit_logs = client.get("/api/v1/admin/audit-logs")
    assert audit_logs.status_code == 200
    body = audit_logs.json()
    assert body["total"] >= 1
    assert body["items"][0]["method"] == "POST"
    assert body["items"][0]["path"] == "/api/v1/admin/departments"
    assert body["items"][0]["actor_user_id"] is not None
    assert body["items"][0]["action"] == "CREATE_DEPARTMENT"
    assert body["items"][0]["entity_type"] == "department"
    assert body["items"][0]["entity_label"] == "Audit Department (ADT)"
    assert body["items"][0]["description"] == "Admin created department Audit Department (ADT)."

    filtered = client.get(
        "/api/v1/admin/audit-logs?action=CREATE_DEPARTMENT&entity_type=department",
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] >= 1


def test_change_password_rate_limit_blocks_abuse(client, admin_user):
    original_attempts = auth_module.change_password_rate_limiter.max_attempts
    original_window = auth_module.change_password_rate_limiter.window_seconds
    auth_module.change_password_rate_limiter.max_attempts = 1
    auth_module.change_password_rate_limiter.window_seconds = 300
    auth_module.change_password_rate_limiter.reset()
    try:
        login(client, "admin@example.com", "AdminPass123!")

        first = client.post(
            "/api/v1/auth/change-password",
            headers=stateful_headers(client),
            json={"current_password": "WrongPass123!", "new_password": "AdminNew123!"},
        )
        assert first.status_code == 400

        second = client.post(
            "/api/v1/auth/change-password",
            headers=stateful_headers(client),
            json={"current_password": "WrongPass123!", "new_password": "AdminNew123!"},
        )
        assert second.status_code == 429
    finally:
        auth_module.change_password_rate_limiter.max_attempts = original_attempts
        auth_module.change_password_rate_limiter.window_seconds = original_window
        auth_module.change_password_rate_limiter.reset()


def test_general_write_rate_limit_blocks_repeated_mutations(client, admin_user):
    original_attempts = middleware_module.write_rate_limiter.max_attempts
    original_window = middleware_module.write_rate_limiter.window_seconds
    middleware_module.write_rate_limiter.max_attempts = 1
    middleware_module.write_rate_limiter.window_seconds = 300
    middleware_module.write_rate_limiter.reset()
    try:
        login(client, "admin@example.com", "AdminPass123!")

        first = client.post(
            "/api/v1/admin/departments",
            headers=stateful_headers(client),
            json={"name": "Rate Limit One", "code": "RL1"},
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/admin/departments",
            headers=stateful_headers(client),
            json={"name": "Rate Limit Two", "code": "RL2"},
        )
        assert second.status_code == 429
    finally:
        middleware_module.write_rate_limiter.max_attempts = original_attempts
        middleware_module.write_rate_limiter.window_seconds = original_window
        middleware_module.write_rate_limiter.reset()


def test_missing_csrf_header_is_rejected_for_authenticated_write(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")

    response = client.post(
        "/api/v1/admin/departments",
        headers={"Origin": "http://testserver"},
        json={"name": "No CSRF Department", "code": "NCD"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "CSRF_FAILED"


def test_invalid_origin_is_rejected_for_authenticated_write(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")

    response = client.post(
        "/api/v1/admin/departments",
        headers={"Origin": "http://evil.test", "X-CSRF-Token": client.cookies.get(settings.csrf_cookie_name)},
        json={"name": "Bad Origin Department", "code": "BOD"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "INVALID_ORIGIN"
