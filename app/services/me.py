from sqlalchemy import exists, select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import UserRole
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.offering import CourseOffering, CourseOfferingTeacher
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.common import Page
from app.schemas.offering import CourseOfferingRead
from app.schemas.student import StudentRead
from app.schemas.teacher import TeacherRead
from app.services.common import build_page, paginate
from app.services.serializers import serialize_offering, serialize_student, serialize_teacher


class MeService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_student_profile(self, user: User) -> StudentRead:
        self._ensure_role(user, UserRole.STUDENT)
        student = self.db.scalar(
            select(Student)
            .join(Student.user)
            .options(selectinload(Student.user), selectinload(Student.department))
            .where(Student.user_id == user.id, Student.deleted_at.is_(None), User.deleted_at.is_(None))
        )
        if student is None:
            raise NotFoundError(code="STUDENT_PROFILE_NOT_FOUND", message="Student profile not found.")
        return serialize_student(student)

    def list_student_offerings(self, user: User, *, limit: int, offset: int) -> Page[CourseOfferingRead]:
        self._ensure_role(user, UserRole.STUDENT)
        student = self.db.scalar(select(Student).where(Student.user_id == user.id, Student.deleted_at.is_(None)))
        if student is None:
            raise NotFoundError(code="STUDENT_PROFILE_NOT_FOUND", message="Student profile not found.")

        stmt = (
            select(CourseOffering)
            .join(Enrollment, Enrollment.offering_id == CourseOffering.id)
            .join(CourseOffering.course)
            .options(
                selectinload(CourseOffering.course),
                selectinload(CourseOffering.teacher_links),
                selectinload(CourseOffering.enrollments),
            )
            .where(
                Enrollment.student_id == student.id,
                CourseOffering.deleted_at.is_(None),
                Course.deleted_at.is_(None),
            )
            .order_by(CourseOffering.id)
        )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_offering(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_teacher_profile(self, user: User) -> TeacherRead:
        self._ensure_role(user, UserRole.TEACHER)
        teacher = self.db.scalar(
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user), selectinload(Teacher.department))
            .where(Teacher.user_id == user.id, Teacher.deleted_at.is_(None), User.deleted_at.is_(None))
        )
        if teacher is None:
            raise NotFoundError(code="TEACHER_PROFILE_NOT_FOUND", message="Teacher profile not found.")
        return serialize_teacher(teacher)

    def list_teacher_offerings(self, user: User, *, limit: int, offset: int) -> Page[CourseOfferingRead]:
        self._ensure_role(user, UserRole.TEACHER)
        teacher = self.db.scalar(select(Teacher).where(Teacher.user_id == user.id, Teacher.deleted_at.is_(None)))
        if teacher is None:
            raise NotFoundError(code="TEACHER_PROFILE_NOT_FOUND", message="Teacher profile not found.")

        stmt = (
            select(CourseOffering)
            .join(CourseOfferingTeacher, CourseOfferingTeacher.offering_id == CourseOffering.id)
            .join(CourseOffering.course)
            .options(
                selectinload(CourseOffering.course),
                selectinload(CourseOffering.teacher_links),
                selectinload(CourseOffering.enrollments),
            )
            .where(
                CourseOfferingTeacher.teacher_id == teacher.id,
                CourseOffering.deleted_at.is_(None),
                Course.deleted_at.is_(None),
            )
            .order_by(CourseOffering.id)
        )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_offering(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def list_teacher_offering_students(
        self,
        user: User,
        *,
        offering_id: int,
        limit: int,
        offset: int,
    ) -> Page[StudentRead]:
        self._ensure_role(user, UserRole.TEACHER)
        teacher = self.db.scalar(select(Teacher).where(Teacher.user_id == user.id, Teacher.deleted_at.is_(None)))
        if teacher is None:
            raise NotFoundError(code="TEACHER_PROFILE_NOT_FOUND", message="Teacher profile not found.")

        can_access = self.db.scalar(
            select(exists().where(
                CourseOfferingTeacher.teacher_id == teacher.id,
                CourseOfferingTeacher.offering_id == offering_id,
                CourseOfferingTeacher.offering_id == CourseOffering.id,
                CourseOffering.deleted_at.is_(None),
            ))
        )
        if not can_access:
            raise ForbiddenError(
                code="OFFERING_ACCESS_DENIED",
                message="You do not have access to students for this offering.",
            )

        stmt = (
            select(Student)
            .join(Student.user)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .options(selectinload(Student.user))
            .where(
                Enrollment.offering_id == offering_id,
                Student.deleted_at.is_(None),
                User.deleted_at.is_(None),
            )
            .order_by(Student.id)
        )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_student(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def _ensure_role(self, user: User, expected_role: UserRole) -> None:
        if user.role != expected_role.value:
            raise ForbiddenError(code="FORBIDDEN", message="You do not have permission to do this.")
