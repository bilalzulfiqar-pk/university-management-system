from app.core.constants import UserRole
from app.models.course import Course
from app.models.department import Department
from app.models.offering import CourseOffering
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.auth import AuthMeResponse
from app.schemas.course import CourseRead
from app.schemas.department import DepartmentRead
from app.schemas.offering import CourseOfferingRead
from app.schemas.student import StudentRead
from app.schemas.teacher import TeacherRead


def serialize_auth_user(user: User) -> AuthMeResponse:
    profile_id = None
    first_name = None
    last_name = None
    if user.role == UserRole.STUDENT.value and user.student is not None:
        profile_id = user.student.id
        first_name = user.student.first_name
        last_name = user.student.last_name
    if user.role == UserRole.TEACHER.value and user.teacher is not None:
        profile_id = user.teacher.id
        first_name = user.teacher.first_name
        last_name = user.teacher.last_name
    return AuthMeResponse(
        id=user.id,
        email=user.email,
        role=UserRole(user.role),
        is_active=user.is_active,
        must_change_password=user.must_change_password,
        profile_id=profile_id,
        first_name=first_name,
        last_name=last_name,
    )


def serialize_department(department: Department) -> DepartmentRead:
    return DepartmentRead.model_validate(department)


def serialize_student(student: Student) -> StudentRead:
    return StudentRead(
        id=student.id,
        user_id=student.user_id,
        email=student.user.email,
        is_active=student.user.is_active,
        must_change_password=student.user.must_change_password,
        first_name=student.first_name,
        last_name=student.last_name,
        roll_number=student.roll_number,
        department_id=student.department_id,
        current_semester=student.current_semester,
        created_at=student.created_at,
        updated_at=student.updated_at,
        deleted_at=student.deleted_at,
    )


def serialize_teacher(teacher: Teacher) -> TeacherRead:
    return TeacherRead(
        id=teacher.id,
        user_id=teacher.user_id,
        email=teacher.user.email,
        is_active=teacher.user.is_active,
        must_change_password=teacher.user.must_change_password,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        employee_id=teacher.employee_id,
        department_id=teacher.department_id,
        created_at=teacher.created_at,
        updated_at=teacher.updated_at,
        deleted_at=teacher.deleted_at,
    )


def serialize_course(course: Course) -> CourseRead:
    return CourseRead.model_validate(course)


def serialize_offering(offering: CourseOffering) -> CourseOfferingRead:
    return CourseOfferingRead(
        id=offering.id,
        course_id=offering.course_id,
        course_code=offering.course.code,
        course_name=offering.course.name,
        term=offering.term,
        year=offering.year,
        section=offering.section,
        capacity=offering.capacity,
        teacher_ids=[link.teacher_id for link in offering.teacher_links],
        student_count=len(offering.enrollments),
        created_at=offering.created_at,
        updated_at=offering.updated_at,
        deleted_at=offering.deleted_at,
    )

