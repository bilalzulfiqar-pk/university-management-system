def login(client, email: str, password: str):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_admin_login_and_me(client, admin_user):
    response = login(client, "admin@example.com", "AdminPass123!")
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "ADMIN"

    token = body["access_token"]
    me_response = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@example.com"


def test_invalid_login_rejected(client, admin_user):
    response = login(client, "admin@example.com", "WrongPass123!")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


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


def test_first_login_password_change_invalidates_old_token(client, admin_user):
    admin_login = login(client, "admin@example.com", "AdminPass123!")
    admin_token = admin_login.json()["access_token"]
    headers = auth_headers(admin_token)

    create_response = client.post(
        "/api/v1/admin/students",
        headers=headers,
        json={
            "email": "student1@example.com",
            "temporary_password": "TempPass123!",
            "first_name": "Ali",
            "last_name": "Khan",
            "roll_number": "ST-001",
            "department_id": create_department(client, headers),
            "current_semester": 3,
            "is_active": True,
        },
    )
    assert create_response.status_code == 201

    first_login = login(client, "student1@example.com", "TempPass123!")
    assert first_login.status_code == 200
    student_token = first_login.json()["access_token"]
    student_headers = auth_headers(student_token)

    blocked_response = client.get("/api/v1/me/student", headers=student_headers)
    assert blocked_response.status_code == 403
    assert blocked_response.json()["error"]["code"] == "PASSWORD_CHANGE_REQUIRED"

    change_password = client.post(
        "/api/v1/auth/change-password",
        headers=student_headers,
        json={"current_password": "TempPass123!", "new_password": "StudentPass123!"},
    )
    assert change_password.status_code == 200

    old_token_response = client.get("/api/v1/auth/me", headers=student_headers)
    assert old_token_response.status_code == 401

    second_login = login(client, "student1@example.com", "StudentPass123!")
    assert second_login.status_code == 200
    new_headers = auth_headers(second_login.json()["access_token"])
    student_profile = client.get("/api/v1/me/student", headers=new_headers)
    assert student_profile.status_code == 200
    assert student_profile.json()["email"] == "student1@example.com"


def create_department(client, headers) -> int:
    response = client.post(
        "/api/v1/admin/departments",
        headers=headers,
        json={"name": "Computer Science", "code": "CS"},
    )
    assert response.status_code == 201
    return response.json()["id"]
