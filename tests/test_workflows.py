from sqlalchemy import select

from app.models.user import User


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def create_department(client, headers, *, name: str = "Engineering", code: str = "ENG") -> int:
    response = client.post(
        "/api/v1/admin/departments",
        headers=headers,
        json={"name": name, "code": code},
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_course(client, headers, department_id: int) -> int:
    response = client.post(
        "/api/v1/admin/courses",
        headers=headers,
        json={
            "name": "Databases",
            "code": "CS301",
            "credit_hours": 3,
            "department_id": department_id,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_offering(client, headers, course_id: int) -> int:
    response = client.post(
        "/api/v1/admin/course-offerings",
        headers=headers,
        json={
            "course_id": course_id,
            "term": "FALL",
            "year": 2026,
            "section": "A",
            "capacity": 30,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_teacher(client, headers, department_id: int) -> dict:
    response = client.post(
        "/api/v1/admin/teachers",
        headers=headers,
        json={
            "email": "teacher@example.com",
            "temporary_password": "TeachPass123!",
            "first_name": "Sara",
            "last_name": "Ahmed",
            "employee_id": "EMP-001",
            "department_id": department_id,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_student(client, headers, department_id: int) -> dict:
    response = client.post(
        "/api/v1/admin/students",
        headers=headers,
        json={
            "email": "student@example.com",
            "temporary_password": "StudPass123!",
            "first_name": "Usman",
            "last_name": "Ali",
            "roll_number": "ST-100",
            "department_id": department_id,
            "current_semester": 5,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    return response.json()


def force_password_change(client, email: str, temporary_password: str, new_password: str) -> str:
    temp_token = login(client, email, temporary_password)
    headers = auth_headers(temp_token)
    change_response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": temporary_password, "new_password": new_password},
    )
    assert change_response.status_code == 200
    return login(client, email, new_password)


def test_admin_teacher_student_workflow_and_role_boundaries(client, admin_user):
    admin_token = login(client, "admin@example.com", "AdminPass123!")
    admin_headers = auth_headers(admin_token)

    department_id = create_department(client, admin_headers)
    course_id = create_course(client, admin_headers, department_id)
    offering_id = create_offering(client, admin_headers, course_id)
    teacher = create_teacher(client, admin_headers, department_id)
    student = create_student(client, admin_headers, department_id)

    assign_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/teachers/{teacher['id']}",
        headers=admin_headers,
    )
    assert assign_response.status_code == 200

    enroll_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=admin_headers,
    )
    assert enroll_response.status_code == 200

    teacher_token = force_password_change(
        client,
        "teacher@example.com",
        "TeachPass123!",
        "TeacherNew123!",
    )
    teacher_headers = auth_headers(teacher_token)

    teacher_admin_access = client.get("/api/v1/admin/students", headers=teacher_headers)
    assert teacher_admin_access.status_code == 403

    teacher_offerings = client.get("/api/v1/me/teacher/course-offerings", headers=teacher_headers)
    assert teacher_offerings.status_code == 200
    assert teacher_offerings.json()["total"] == 1

    teacher_roster = client.get(
        f"/api/v1/me/teacher/course-offerings/{offering_id}/students",
        headers=teacher_headers,
    )
    assert teacher_roster.status_code == 200
    assert teacher_roster.json()["items"][0]["email"] == "student@example.com"

    student_token = force_password_change(
        client,
        "student@example.com",
        "StudPass123!",
        "StudentNew123!",
    )
    student_headers = auth_headers(student_token)

    student_admin_access = client.get(f"/api/v1/admin/students/{student['id']}", headers=student_headers)
    assert student_admin_access.status_code == 403

    my_offerings = client.get("/api/v1/me/student/course-offerings", headers=student_headers)
    assert my_offerings.status_code == 200
    assert my_offerings.json()["items"][0]["course_code"] == "CS301"


def test_student_soft_delete_restore_and_hard_delete_rules(client, admin_user, db_session):
    admin_token = login(client, "admin@example.com", "AdminPass123!")
    admin_headers = auth_headers(admin_token)

    department_id = create_department(client, admin_headers, name="Science", code="SCI")
    course_id = create_course(client, admin_headers, department_id)
    offering_id = create_offering(client, admin_headers, course_id)
    student = create_student(client, admin_headers, department_id)

    enroll_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=admin_headers,
    )
    assert enroll_response.status_code == 200

    soft_delete = client.delete(f"/api/v1/admin/students/{student['id']}", headers=admin_headers)
    assert soft_delete.status_code == 200

    deleted_list = client.get(
        "/api/v1/admin/students?include_deleted=true",
        headers=admin_headers,
    )
    assert deleted_list.status_code == 200
    assert deleted_list.json()["items"][0]["deleted_at"] is not None

    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    assert user is not None
    assert user.is_active is False
    assert user.deleted_at is not None

    blocked_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StudPass123!"},
    )
    assert blocked_login.status_code == 401

    hard_delete_blocked = client.delete(
        f"/api/v1/admin/students/{student['id']}/hard",
        headers=admin_headers,
    )
    assert hard_delete_blocked.status_code == 409

    restore = client.post(f"/api/v1/admin/students/{student['id']}/restore", headers=admin_headers)
    assert restore.status_code == 200
    assert restore.json()["deleted_at"] is None

    unenroll = client.delete(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=admin_headers,
    )
    assert unenroll.status_code == 200

    soft_delete_again = client.delete(f"/api/v1/admin/students/{student['id']}", headers=admin_headers)
    assert soft_delete_again.status_code == 200

    hard_delete = client.delete(
        f"/api/v1/admin/students/{student['id']}/hard",
        headers=admin_headers,
    )
    assert hard_delete.status_code == 200

    remaining_user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    assert remaining_user is None


def test_include_deleted_and_uniqueness_constraints(client, admin_user):
    admin_token = login(client, "admin@example.com", "AdminPass123!")
    admin_headers = auth_headers(admin_token)

    department_id = create_department(client, admin_headers, name="Business", code="BUS")
    course_id = create_course(client, admin_headers, department_id)
    offering_id = create_offering(client, admin_headers, course_id)
    teacher = create_teacher(client, admin_headers, department_id)
    student = create_student(client, admin_headers, department_id)

    duplicate_student = client.post(
        "/api/v1/admin/students",
        headers=admin_headers,
        json={
            "email": "student@example.com",
            "temporary_password": "StudPass123!",
            "first_name": "Aisha",
            "last_name": "Noor",
            "roll_number": "ST-101",
            "department_id": department_id,
            "current_semester": 2,
            "is_active": True,
        },
    )
    assert duplicate_student.status_code == 409

    assign_once = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/teachers/{teacher['id']}",
        headers=admin_headers,
    )
    assert assign_once.status_code == 200

    assign_twice = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/teachers/{teacher['id']}",
        headers=admin_headers,
    )
    assert assign_twice.status_code == 409

    enroll_once = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=admin_headers,
    )
    assert enroll_once.status_code == 200

    enroll_twice = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=admin_headers,
    )
    assert enroll_twice.status_code == 409
