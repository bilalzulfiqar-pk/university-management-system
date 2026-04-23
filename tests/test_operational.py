from app.core import middleware as middleware_module
from app.services import auth as auth_module


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def create_department(client, headers) -> None:
    response = client.post(
        "/api/v1/admin/departments",
        headers=headers,
        json={"name": "Audit Department", "code": "ADT"},
    )
    assert response.status_code == 201


def test_admin_audit_logs_capture_admin_mutations(client, admin_user):
    admin_token = login(client, "admin@example.com", "AdminPass123!")
    headers = auth_headers(admin_token)

    create_department(client, headers)

    audit_logs = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_logs.status_code == 200
    body = audit_logs.json()
    assert body["total"] >= 1
    assert body["items"][0]["method"] == "POST"
    assert body["items"][0]["path"] == "/api/v1/admin/departments"
    assert body["items"][0]["actor_user_id"] is not None


def test_change_password_rate_limit_blocks_abuse(client, admin_user):
    original_attempts = auth_module.change_password_rate_limiter.max_attempts
    original_window = auth_module.change_password_rate_limiter.window_seconds
    auth_module.change_password_rate_limiter.max_attempts = 1
    auth_module.change_password_rate_limiter.window_seconds = 300
    auth_module.change_password_rate_limiter.reset()
    try:
        admin_token = login(client, "admin@example.com", "AdminPass123!")
        headers = auth_headers(admin_token)

        first = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={"current_password": "WrongPass123!", "new_password": "AdminNew123!"},
        )
        assert first.status_code == 400

        second = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
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
        admin_token = login(client, "admin@example.com", "AdminPass123!")
        headers = auth_headers(admin_token)

        first = client.post(
            "/api/v1/admin/departments",
            headers=headers,
            json={"name": "Rate Limit One", "code": "RL1"},
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/admin/departments",
            headers=headers,
            json={"name": "Rate Limit Two", "code": "RL2"},
        )
        assert second.status_code == 429
    finally:
        middleware_module.write_rate_limiter.max_attempts = original_attempts
        middleware_module.write_rate_limiter.window_seconds = original_window
        middleware_module.write_rate_limiter.reset()
