from app.core.config import settings


def login(client, email: str, password: str):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


def stateful_headers(client) -> dict[str, str]:
    headers = {"Origin": "http://testserver"}
    csrf_token = client.cookies.get(settings.csrf_cookie_name)
    if csrf_token:
        headers["X-CSRF-Token"] = csrf_token
    return headers


def test_admin_login_and_me(client, admin_user):
    response = login(client, "admin@example.com", "AdminPass123!")
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["role"] == "ADMIN"
    assert "access_token" not in body
    assert settings.access_cookie_name in response.cookies
    assert settings.refresh_cookie_name in response.cookies
    assert settings.csrf_cookie_name in response.cookies

    me_response = client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@example.com"


def test_invalid_login_rejected(client, admin_user):
    response = login(client, "admin@example.com", "WrongPass123!")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_unauthenticated_request_is_blocked(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_login_ip_rate_limit_blocks_email_rotation(client, admin_user):
    import app.services.auth as auth_module

    original_attempts = auth_module.login_ip_rate_limiter.max_attempts
    original_window = auth_module.login_ip_rate_limiter.window_seconds
    auth_module.login_ip_rate_limiter.max_attempts = 2
    auth_module.login_ip_rate_limiter.window_seconds = 300
    auth_module.login_ip_rate_limiter.reset()
    try:
        first = login(client, "missing1@example.com", "WrongPass123!")
        assert first.status_code == 401

        second = login(client, "missing2@example.com", "WrongPass123!")
        assert second.status_code == 401

        third = login(client, "missing3@example.com", "WrongPass123!")
        assert third.status_code == 429
        assert third.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    finally:
        auth_module.login_ip_rate_limiter.max_attempts = original_attempts
        auth_module.login_ip_rate_limiter.window_seconds = original_window
        auth_module.login_ip_rate_limiter.reset()


def test_first_login_password_change_invalidates_old_cookie_and_keeps_new_session(client, admin_user):
    admin_login = login(client, "admin@example.com", "AdminPass123!")
    assert admin_login.status_code == 200

    create_response = client.post(
        "/api/v1/admin/students",
        headers=stateful_headers(client),
        json={
            "email": "student1@example.com",
            "temporary_password": "TempPass123!",
            "first_name": "Ali",
            "last_name": "Khan",
            "roll_number": "ST-001",
            "department_id": create_department(client),
            "current_semester": 3,
            "is_active": True,
        },
    )
    assert create_response.status_code == 201

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))

    first_login = login(client, "student1@example.com", "TempPass123!")
    assert first_login.status_code == 200
    old_access_cookie = client.cookies.get(settings.access_cookie_name)

    blocked_response = client.get("/api/v1/me/student")
    assert blocked_response.status_code == 403
    assert blocked_response.json()["error"]["code"] == "PASSWORD_CHANGE_REQUIRED"

    change_password = client.post(
        "/api/v1/auth/change-password",
        headers=stateful_headers(client),
        json={"current_password": "TempPass123!", "new_password": "StudentPass123!"},
    )
    assert change_password.status_code == 200

    current_profile = client.get("/api/v1/me/student")
    assert current_profile.status_code == 200
    assert current_profile.json()["email"] == "student1@example.com"

    client.cookies.set(settings.access_cookie_name, old_access_cookie)
    old_cookie_response = client.get("/api/v1/auth/me")
    assert old_cookie_response.status_code == 401


def test_logout_invalidates_current_access_cookie(client, admin_user):
    response = login(client, "admin@example.com", "AdminPass123!")
    old_access_cookie = response.cookies.get(settings.access_cookie_name)

    logout_response = client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    assert logout_response.status_code == 200

    me_response = client.get("/api/v1/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["error"]["code"] == "AUTH_REQUIRED"

    client.cookies.set(settings.access_cookie_name, old_access_cookie)
    old_cookie_response = client.get("/api/v1/auth/me")
    assert old_cookie_response.status_code == 401
    assert old_cookie_response.json()["error"]["code"] == "INVALID_TOKEN"


def test_refresh_rotates_session_cookie_and_reuse_revokes_session(client, admin_user):
    response = login(client, "admin@example.com", "AdminPass123!")
    old_refresh_cookie = response.cookies.get(settings.refresh_cookie_name)
    csrf_token = response.cookies.get(settings.csrf_cookie_name)

    refresh_response = client.post("/api/v1/auth/refresh", headers=stateful_headers(client))
    assert refresh_response.status_code == 200
    new_refresh_cookie = refresh_response.cookies.get(settings.refresh_cookie_name)
    assert new_refresh_cookie
    assert new_refresh_cookie != old_refresh_cookie
    assert refresh_response.cookies.get(settings.csrf_cookie_name) == csrf_token

    client.cookies.set(settings.refresh_cookie_name, old_refresh_cookie)
    client.cookies.set(settings.csrf_cookie_name, csrf_token)
    reuse_response = client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "http://testserver", "X-CSRF-Token": csrf_token},
    )
    assert reuse_response.status_code == 401
    assert reuse_response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"

    client.cookies.set(settings.refresh_cookie_name, new_refresh_cookie)
    client.cookies.set(settings.csrf_cookie_name, csrf_token)
    second_refresh = client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "http://testserver", "X-CSRF-Token": csrf_token},
    )
    assert second_refresh.status_code == 401
    assert second_refresh.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def create_department(client) -> int:
    response = client.post(
        "/api/v1/admin/departments",
        headers=stateful_headers(client),
        json={"name": "Computer Science", "code": "CS"},
    )
    assert response.status_code == 201
    return response.json()["id"]
