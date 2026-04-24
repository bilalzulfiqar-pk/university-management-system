from sqlalchemy import select

from app.core.config import settings
from app.models.user import User


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


def create_department(client, *, name: str = "Engineering", code: str = "ENG") -> int:
    response = client.post(
        "/api/v1/admin/departments",
        headers=stateful_headers(client),
        json={"name": name, "code": code},
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_course(client, department_id: int) -> int:
    response = client.post(
        "/api/v1/admin/courses",
        headers=stateful_headers(client),
        json={
            "name": "Databases",
            "code": "CS301",
            "credit_hours": 3,
            "department_id": department_id,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_offering(client, course_id: int) -> int:
    response = client.post(
        "/api/v1/admin/course-offerings",
        headers=stateful_headers(client),
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


def create_teacher(client, department_id: int) -> dict:
    response = client.post(
        "/api/v1/admin/teachers",
        headers=stateful_headers(client),
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


def create_student(client, department_id: int) -> dict:
    response = client.post(
        "/api/v1/admin/students",
        headers=stateful_headers(client),
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


def force_password_change(client, email: str, temporary_password: str, new_password: str) -> None:
    login(client, email, temporary_password)
    change_response = client.post(
        "/api/v1/auth/change-password",
        headers=stateful_headers(client),
        json={"current_password": temporary_password, "new_password": new_password},
    )
    assert change_response.status_code == 200


def test_admin_teacher_student_workflow_and_role_boundaries(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")

    department_id = create_department(client)
    course_id = create_course(client, department_id)
    offering_id = create_offering(client, course_id)
    teacher = create_teacher(client, department_id)
    student = create_student(client, department_id)

    assign_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/teachers/{teacher['id']}",
        headers=stateful_headers(client),
    )
    assert assign_response.status_code == 200

    enroll_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=stateful_headers(client),
    )
    assert enroll_response.status_code == 200

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    force_password_change(client, "teacher@example.com", "TeachPass123!", "TeacherNew123!")

    teacher_admin_access = client.get("/api/v1/admin/students")
    assert teacher_admin_access.status_code == 403

    teacher_offerings = client.get("/api/v1/me/teacher/course-offerings")
    assert teacher_offerings.status_code == 200
    assert teacher_offerings.json()["total"] == 1

    teacher_roster = client.get(
        f"/api/v1/me/teacher/course-offerings/{offering_id}/students",
    )
    assert teacher_roster.status_code == 200
    assert teacher_roster.json()["items"][0]["email"] == "student@example.com"

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    force_password_change(client, "student@example.com", "StudPass123!", "StudentNew123!")

    student_admin_access = client.get(f"/api/v1/admin/students/{student['id']}")
    assert student_admin_access.status_code == 403

    my_offerings = client.get("/api/v1/me/student/course-offerings")
    assert my_offerings.status_code == 200
    assert my_offerings.json()["items"][0]["course_code"] == "CS301"

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    force_password_change(client, "teacher@example.com", "TeacherNew123!", "TeacherNewest123!")
    teacher_student_route = client.get("/api/v1/me/student")
    assert teacher_student_route.status_code == 403


def test_student_soft_delete_restore_and_hard_delete_rules(client, admin_user, db_session):
    login(client, "admin@example.com", "AdminPass123!")

    department_id = create_department(client, name="Science", code="SCI")
    course_id = create_course(client, department_id)
    offering_id = create_offering(client, course_id)
    student = create_student(client, department_id)

    enroll_response = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=stateful_headers(client),
    )
    assert enroll_response.status_code == 200

    soft_delete = client.delete(f"/api/v1/admin/students/{student['id']}", headers=stateful_headers(client))
    assert soft_delete.status_code == 200

    deleted_list = client.get("/api/v1/admin/students?include_deleted=true")
    assert deleted_list.status_code == 200
    assert deleted_list.json()["items"][0]["deleted_at"] is not None

    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    assert user is not None
    assert user.is_active is False
    assert user.deleted_at is not None

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    blocked_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StudPass123!"},
    )
    assert blocked_login.status_code == 401

    login(client, "admin@example.com", "AdminPass123!")
    hard_delete_blocked = client.delete(
        f"/api/v1/admin/students/{student['id']}/hard",
        headers=stateful_headers(client),
    )
    assert hard_delete_blocked.status_code == 409

    restore = client.post(f"/api/v1/admin/students/{student['id']}/restore", headers=stateful_headers(client))
    assert restore.status_code == 200
    assert restore.json()["deleted_at"] is None

    unenroll = client.delete(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=stateful_headers(client),
    )
    assert unenroll.status_code == 200

    soft_delete_again = client.delete(f"/api/v1/admin/students/{student['id']}", headers=stateful_headers(client))
    assert soft_delete_again.status_code == 200

    hard_delete = client.delete(
        f"/api/v1/admin/students/{student['id']}/hard",
        headers=stateful_headers(client),
    )
    assert hard_delete.status_code == 200

    remaining_user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    assert remaining_user is None


def test_include_deleted_and_uniqueness_constraints(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")

    department_id = create_department(client, name="Business", code="BUS")
    course_id = create_course(client, department_id)
    offering_id = create_offering(client, course_id)
    teacher = create_teacher(client, department_id)
    student = create_student(client, department_id)

    duplicate_student = client.post(
        "/api/v1/admin/students",
        headers=stateful_headers(client),
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
        headers=stateful_headers(client),
    )
    assert assign_once.status_code == 200

    assign_twice = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/teachers/{teacher['id']}",
        headers=stateful_headers(client),
    )
    assert assign_twice.status_code == 409

    enroll_once = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=stateful_headers(client),
    )
    assert enroll_once.status_code == 200

    enroll_twice = client.post(
        f"/api/v1/admin/course-offerings/{offering_id}/students/{student['id']}",
        headers=stateful_headers(client),
    )
    assert enroll_twice.status_code == 409


def test_inactive_teacher_cannot_login(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")
    department_id = create_department(client, name="Arts", code="ART")

    response = client.post(
        "/api/v1/admin/teachers",
        headers=stateful_headers(client),
        json={
            "email": "inactive.teacher@example.com",
            "temporary_password": "TeachPass123!",
            "first_name": "Inactive",
            "last_name": "Teacher",
            "employee_id": "EMP-999",
            "department_id": department_id,
            "is_active": False,
        },
    )
    assert response.status_code == 201

    client.post("/api/v1/auth/logout", headers=stateful_headers(client))
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive.teacher@example.com", "password": "TeachPass123!"},
    )
    assert login_response.status_code == 401


def test_invalid_term_and_semester_validation_fail(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")
    department_id = create_department(client, name="Validation", code="VAL")
    course_id = create_course(client, department_id)

    invalid_offering = client.post(
        "/api/v1/admin/course-offerings",
        headers=stateful_headers(client),
        json={
            "course_id": course_id,
            "term": "WINTER",
            "year": 2026,
            "section": "A",
            "capacity": 30,
        },
    )
    assert invalid_offering.status_code == 422

    invalid_student = client.post(
        "/api/v1/admin/students",
        headers=stateful_headers(client),
        json={
            "email": "invalid.student@example.com",
            "temporary_password": "StudPass123!",
            "first_name": "Bad",
            "last_name": "Semester",
            "roll_number": "ST-888",
            "department_id": department_id,
            "current_semester": 20,
            "is_active": True,
        },
    )
    assert invalid_student.status_code == 422


def test_department_delete_blocked_when_active_relations_exist(client, admin_user):
    login(client, "admin@example.com", "AdminPass123!")
    department_id = create_department(client, name="Protected", code="PRT")

    create_student(client, department_id)

    delete_response = client.delete(f"/api/v1/admin/departments/{department_id}", headers=stateful_headers(client))
    assert delete_response.status_code == 409
