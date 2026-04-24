from __future__ import annotations

import argparse
import re
from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.constants import AcademicTerm, UserRole
from app.core.security import hash_password
from app.db.base import Base  # noqa: F401
from app.db.session import SessionLocal
from app.models import AdminAuditLog, Course, CourseOffering, CourseOfferingTeacher, Department, Enrollment, Student, Teacher, User
from app.scripts.demo_seed_dataset import PROGRAMS, TEMP_ACCOUNT_PASSWORD


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed HEC-aligned demo academic data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing non-admin academic data and audit logs before seeding the demo dataset.",
    )
    return parser.parse_args()


def slugify_email_part(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", ".", value.lower()).strip(".")
    return normalized or "user"


def build_email(first_name: str, last_name: str, track_code: str) -> str:
    return f"{slugify_email_part(first_name)}.{slugify_email_part(last_name)}.{track_code.lower()}@example.com"


def admission_year_for_semester(semester: int) -> int:
    if semester in {1, 2}:
        return 2026
    if semester in {3, 4}:
        return 2025
    if semester in {5, 6}:
        return 2024
    return 2023


def offering_schedule_for_semester(semester: int) -> tuple[str, int, str, int]:
    if semester % 2 == 1:
        return AcademicTerm.FALL.value, 2026, f"S{semester}-A", 50 if semester <= 2 else 40 if semester <= 4 else 35
    return AcademicTerm.SPRING.value, 2027, f"S{semester}-A", 50 if semester <= 2 else 40 if semester <= 4 else 35


def reset_academic_data(db: Session) -> None:
    db.execute(delete(AdminAuditLog))
    db.execute(delete(Enrollment))
    db.execute(delete(CourseOfferingTeacher))
    db.execute(delete(CourseOffering))
    db.execute(delete(Student))
    db.execute(delete(Teacher))
    db.execute(delete(Course))
    db.execute(delete(Department))
    db.execute(delete(User).where(User.role != UserRole.ADMIN.value))
    db.commit()


def ensure_department(db: Session, *, code: str, name: str) -> Department:
    department = db.scalar(select(Department).where(Department.code == code))
    if department is None:
        department = Department(code=code, name=name)
        db.add(department)
        db.flush()
    else:
        department.code = code
        department.name = name
        department.deleted_at = None
    return department


def ensure_user(
    db: Session,
    *,
    email: str,
    role: UserRole,
    password: str,
    must_change_password: bool,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role.value,
            is_active=True,
            must_change_password=must_change_password,
            token_version=0,
        )
        db.add(user)
        db.flush()
    else:
        user.email = email
        user.password_hash = hash_password(password)
        user.role = role.value
        user.is_active = True
        user.must_change_password = must_change_password
        user.deleted_at = None
        user.token_version = 0
        user.last_login_at = None
    return user


def ensure_teacher(
    db: Session,
    *,
    first_name: str,
    last_name: str,
    employee_id: str,
    department_id: int,
    user: User,
) -> Teacher:
    teacher = db.scalar(select(Teacher).where(Teacher.employee_id == employee_id))
    if teacher is None:
        teacher = Teacher(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            employee_id=employee_id,
            department_id=department_id,
        )
        db.add(teacher)
        db.flush()
    else:
        teacher.user_id = user.id
        teacher.first_name = first_name
        teacher.last_name = last_name
        teacher.employee_id = employee_id
        teacher.department_id = department_id
        teacher.deleted_at = None
    return teacher


def ensure_student(
    db: Session,
    *,
    first_name: str,
    last_name: str,
    roll_number: str,
    department_id: int,
    current_semester: int,
    user: User,
) -> Student:
    student = db.scalar(select(Student).where(Student.roll_number == roll_number))
    if student is None:
        student = Student(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            roll_number=roll_number,
            department_id=department_id,
            current_semester=current_semester,
        )
        db.add(student)
        db.flush()
    else:
        student.user_id = user.id
        student.first_name = first_name
        student.last_name = last_name
        student.roll_number = roll_number
        student.department_id = department_id
        student.current_semester = current_semester
        student.deleted_at = None
    return student


def ensure_course(
    db: Session,
    *,
    code: str,
    name: str,
    credit_hours: int,
    department_id: int,
) -> Course:
    course = db.scalar(select(Course).where(Course.code == code))
    if course is None:
        course = Course(code=code, name=name, credit_hours=credit_hours, department_id=department_id)
        db.add(course)
        db.flush()
    else:
        course.code = code
        course.name = name
        course.credit_hours = credit_hours
        course.department_id = department_id
        course.deleted_at = None
    return course


def ensure_offering(
    db: Session,
    *,
    course_id: int,
    term: str,
    year: int,
    section: str,
    capacity: int,
) -> CourseOffering:
    offering = db.scalar(
        select(CourseOffering).where(
            CourseOffering.course_id == course_id,
            CourseOffering.term == term,
            CourseOffering.year == year,
            CourseOffering.section == section,
        )
    )
    if offering is None:
        offering = CourseOffering(course_id=course_id, term=term, year=year, section=section, capacity=capacity)
        db.add(offering)
        db.flush()
    else:
        offering.course_id = course_id
        offering.term = term
        offering.year = year
        offering.section = section
        offering.capacity = capacity
        offering.deleted_at = None
    return offering


def ensure_assignment(db: Session, *, offering_id: int, teacher_id: int) -> CourseOfferingTeacher:
    link = db.scalar(
        select(CourseOfferingTeacher).where(
            CourseOfferingTeacher.offering_id == offering_id,
            CourseOfferingTeacher.teacher_id == teacher_id,
        )
    )
    if link is None:
        link = CourseOfferingTeacher(offering_id=offering_id, teacher_id=teacher_id)
        db.add(link)
        db.flush()
    return link


def ensure_enrollment(db: Session, *, student_id: int, offering_id: int) -> Enrollment:
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.offering_id == offering_id,
        )
    )
    if enrollment is None:
        enrollment = Enrollment(student_id=student_id, offering_id=offering_id)
        db.add(enrollment)
        db.flush()
    return enrollment


def seed_demo_data(db: Session) -> dict[str, int]:
    counts = defaultdict(int)

    for program in PROGRAMS:
        department = ensure_department(db, code=program["code"], name=program["name"])
        counts["departments"] += 1

        teachers: list[Teacher] = []
        for index, (first_name, last_name) in enumerate(program["teachers"], start=1):
            user = ensure_user(
                db,
                email=build_email(first_name, last_name, program["code"]),
                role=UserRole.TEACHER,
                password=TEMP_ACCOUNT_PASSWORD,
                must_change_password=True,
            )
            teacher = ensure_teacher(
                db,
                first_name=first_name,
                last_name=last_name,
                employee_id=f"{program['code']}-T-{index:03d}",
                department_id=department.id,
                user=user,
            )
            teachers.append(teacher)
            counts["teachers"] += 1

        students_by_semester: dict[int, list[Student]] = defaultdict(list)
        cohort_sequence: dict[int, int] = defaultdict(int)
        for first_name, last_name, semester in program["students"]:
            admission_year = admission_year_for_semester(semester)
            cohort_sequence[admission_year] += 1
            user = ensure_user(
                db,
                email=build_email(first_name, last_name, program["code"]),
                role=UserRole.STUDENT,
                password=TEMP_ACCOUNT_PASSWORD,
                must_change_password=True,
            )
            student = ensure_student(
                db,
                first_name=first_name,
                last_name=last_name,
                roll_number=f"{program['code']}-{admission_year}-{cohort_sequence[admission_year]:03d}",
                department_id=department.id,
                current_semester=semester,
                user=user,
            )
            students_by_semester[semester].append(student)
            counts["students"] += 1

        offerings_by_semester: dict[int, list[CourseOffering]] = defaultdict(list)
        for index, course_data in enumerate(program["courses"]):
            course = ensure_course(
                db,
                code=course_data["code"],
                name=course_data["name"],
                credit_hours=course_data.get("credit_hours", 3),
                department_id=department.id,
            )
            counts["courses"] += 1

            semester = course_data["semester"]
            term, year, section, capacity = offering_schedule_for_semester(semester)
            offering = ensure_offering(
                db,
                course_id=course.id,
                term=term,
                year=year,
                section=section,
                capacity=capacity,
            )
            offerings_by_semester[semester].append(offering)
            counts["offerings"] += 1

            teacher = teachers[(semester + index) % len(teachers)]
            ensure_assignment(db, offering_id=offering.id, teacher_id=teacher.id)
            counts["assignments"] += 1

        for semester, students in students_by_semester.items():
            for student in students:
                for offering in offerings_by_semester[semester]:
                    ensure_enrollment(db, student_id=student.id, offering_id=offering.id)
                    counts["enrollments"] += 1

    db.commit()
    return dict(counts)


def main() -> None:
    args = parse_args()
    db = SessionLocal()
    try:
        if args.reset:
            reset_academic_data(db)
        counts = seed_demo_data(db)
        print("HEC-aligned demo data ready.")
        print(
            "Departments: {departments}, Courses: {courses}, Offerings: {offerings}, Teachers: {teachers}, "
            "Students: {students}, Assignments: {assignments}, Enrollments: {enrollments}".format(**counts)
        )
        print(f"Temporary password for seeded teacher/student accounts: {TEMP_ACCOUNT_PASSWORD}")
        print("Example teacher login: ahmed.raza.bscs@example.com")
        print("Example student login: abdullah.khan.bscs@example.com")
    finally:
        db.close()


if __name__ == "__main__":
    main()
