from sqlalchemy import Select, exists, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import AcademicTerm, UserRole
from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.course import Course
from app.models.department import Department
from app.models.enrollment import Enrollment
from app.models.offering import CourseOffering, CourseOfferingTeacher
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.common import Page
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.schemas.offering import CourseOfferingCreate, CourseOfferingRead, CourseOfferingUpdate
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate
from app.schemas.teacher import TeacherCreate, TeacherRead, TeacherUpdate
from app.services.common import build_page, commit_or_rollback, paginate, utcnow
from app.services.serializers import (
    serialize_course,
    serialize_department,
    serialize_offering,
    serialize_student,
    serialize_teacher,
)


class DepartmentAdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None,
        include_deleted: bool,
        limit: int,
        offset: int,
    ) -> Page[DepartmentRead]:
        stmt: Select = select(Department).order_by(Department.id)
        if not include_deleted:
            stmt = stmt.where(Department.deleted_at.is_(None))
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Department.name.ilike(pattern),
                    Department.code.ilike(pattern),
                )
            )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_department(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get(self, department_id: int, *, include_deleted: bool = False) -> DepartmentRead:
        department = self._get_department(department_id, include_deleted=include_deleted)
        return serialize_department(department)

    def create(self, payload: DepartmentCreate) -> DepartmentRead:
        self._ensure_department_name_unique(payload.name)
        self._ensure_department_code_unique(payload.code)
        department = Department(name=payload.name, code=payload.code)
        self.db.add(department)
        commit_or_rollback(self.db)
        self.db.refresh(department)
        return serialize_department(department)

    def update(self, department_id: int, payload: DepartmentUpdate) -> DepartmentRead:
        department = self._get_department(department_id)
        if payload.name is not None and payload.name != department.name:
            self._ensure_department_name_unique(payload.name, exclude_id=department.id)
            department.name = payload.name
        if payload.code is not None and payload.code != department.code:
            self._ensure_department_code_unique(payload.code, exclude_id=department.id)
            department.code = payload.code
        commit_or_rollback(self.db)
        self.db.refresh(department)
        return serialize_department(department)

    def soft_delete(self, department_id: int) -> dict[str, bool | str]:
        department = self._get_department(department_id)
        if department.deleted_at is not None:
            raise ConflictError(code="DEPARTMENT_ALREADY_DELETED", message="Department is already deleted.")

        active_student_exists = self.db.scalar(
            select(exists().where(Student.department_id == department.id, Student.deleted_at.is_(None)))
        )
        active_teacher_exists = self.db.scalar(
            select(exists().where(Teacher.department_id == department.id, Teacher.deleted_at.is_(None)))
        )
        active_course_exists = self.db.scalar(
            select(exists().where(Course.department_id == department.id, Course.deleted_at.is_(None)))
        )
        if active_student_exists or active_teacher_exists or active_course_exists:
            raise ConflictError(
                code="DEPARTMENT_HAS_ACTIVE_RELATIONS",
                message="Department cannot be deleted while active students, teachers, or courses exist.",
            )

        department.deleted_at = utcnow()
        commit_or_rollback(self.db)
        return {"success": True, "message": "Department deleted successfully."}

    def _get_department(self, department_id: int, *, include_deleted: bool = False) -> Department:
        stmt = select(Department).where(Department.id == department_id)
        if not include_deleted:
            stmt = stmt.where(Department.deleted_at.is_(None))
        department = self.db.scalar(stmt)
        if department is None:
            raise NotFoundError(code="DEPARTMENT_NOT_FOUND", message="Department not found.")
        return department

    def _ensure_department_name_unique(self, name: str, *, exclude_id: int | None = None) -> None:
        stmt = select(Department).where(func.lower(Department.name) == name.lower())
        if exclude_id is not None:
            stmt = stmt.where(Department.id != exclude_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="DEPARTMENT_NAME_EXISTS", message="Department name already exists.")

    def _ensure_department_code_unique(self, code: str, *, exclude_id: int | None = None) -> None:
        stmt = select(Department).where(Department.code == code)
        if exclude_id is not None:
            stmt = stmt.where(Department.id != exclude_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="DEPARTMENT_CODE_EXISTS", message="Department code already exists.")


class StudentAdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None,
        department_id: int | None,
        semester: int | None,
        include_deleted: bool,
        limit: int,
        offset: int,
    ) -> Page[StudentRead]:
        stmt = (
            select(Student)
            .join(Student.user)
            .options(selectinload(Student.user))
            .order_by(Student.id)
        )
        if not include_deleted:
            stmt = stmt.where(Student.deleted_at.is_(None), User.deleted_at.is_(None))
        if department_id is not None:
            stmt = stmt.where(Student.department_id == department_id)
        if semester is not None:
            stmt = stmt.where(Student.current_semester == semester)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Student.first_name.ilike(pattern),
                    Student.last_name.ilike(pattern),
                    Student.roll_number.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_student(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get(self, student_id: int, *, include_deleted: bool = False) -> StudentRead:
        student = self._get_student(student_id, include_deleted=include_deleted)
        return serialize_student(student)

    def create(self, payload: StudentCreate) -> StudentRead:
        department = self._get_active_department(payload.department_id)
        self._ensure_email_unique(payload.email)
        self._ensure_roll_number_unique(payload.roll_number)

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.temporary_password),
            role=UserRole.STUDENT.value,
            is_active=payload.is_active,
            must_change_password=True,
            token_version=0,
        )
        student = Student(
            user=user,
            first_name=payload.first_name,
            last_name=payload.last_name,
            roll_number=payload.roll_number,
            department=department,
            current_semester=payload.current_semester,
        )
        self.db.add_all([user, student])
        commit_or_rollback(self.db)
        self.db.refresh(student)
        return serialize_student(student)

    def update(self, student_id: int, payload: StudentUpdate) -> StudentRead:
        student = self._get_student(student_id, include_deleted=True)
        user = student.user
        if payload.email is not None and payload.email.lower() != user.email.lower():
            self._ensure_email_unique(payload.email, exclude_user_id=user.id)
            user.email = payload.email.lower()
        if payload.temporary_password is not None:
            user.password_hash = hash_password(payload.temporary_password)
            user.must_change_password = True
            user.token_version += 1
        if payload.first_name is not None:
            student.first_name = payload.first_name
        if payload.last_name is not None:
            student.last_name = payload.last_name
        if payload.roll_number is not None and payload.roll_number != student.roll_number:
            self._ensure_roll_number_unique(payload.roll_number, exclude_student_id=student.id)
            student.roll_number = payload.roll_number
        if payload.department_id is not None:
            student.department = self._get_active_department(payload.department_id)
        if payload.current_semester is not None:
            student.current_semester = payload.current_semester
        if payload.is_active is not None:
            user.is_active = payload.is_active
        commit_or_rollback(self.db)
        self.db.refresh(student)
        return serialize_student(student)

    def soft_delete(self, student_id: int) -> dict[str, bool | str]:
        student = self._get_student(student_id, include_deleted=True)
        if student.deleted_at is not None:
            raise ConflictError(code="STUDENT_ALREADY_DELETED", message="Student is already deleted.")

        now = utcnow()
        student.deleted_at = now
        student.user.deleted_at = now
        student.user.is_active = False
        student.user.token_version += 1
        commit_or_rollback(self.db)
        return {"success": True, "message": "Student deleted successfully."}

    def restore(self, student_id: int) -> StudentRead:
        student = self._get_student(student_id, include_deleted=True)
        if student.deleted_at is None:
            raise ConflictError(code="STUDENT_NOT_DELETED", message="Student is not deleted.")

        student.deleted_at = None
        student.user.deleted_at = None
        student.user.is_active = True
        commit_or_rollback(self.db)
        self.db.refresh(student)
        return serialize_student(student)

    def hard_delete(self, student_id: int) -> dict[str, bool | str]:
        student = self._get_student(student_id, include_deleted=True)
        if student.deleted_at is None:
            raise ConflictError(
                code="STUDENT_SOFT_DELETE_REQUIRED",
                message="Student must be soft-deleted before hard delete.",
            )
        enrollment_exists = self.db.scalar(
            select(exists().where(Enrollment.student_id == student.id))
        )
        if enrollment_exists:
            raise ConflictError(
                code="STUDENT_HAS_ENROLLMENTS",
                message="Student cannot be hard-deleted while enrollments exist.",
            )

        user = student.user
        self.db.delete(student)
        self.db.delete(user)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Student permanently deleted."}

    def _get_student(self, student_id: int, *, include_deleted: bool = False) -> Student:
        stmt = (
            select(Student)
            .join(Student.user)
            .options(selectinload(Student.user))
            .where(Student.id == student_id)
        )
        if not include_deleted:
            stmt = stmt.where(Student.deleted_at.is_(None), User.deleted_at.is_(None))
        student = self.db.scalar(stmt)
        if student is None:
            raise NotFoundError(code="STUDENT_NOT_FOUND", message="Student not found.")
        return student

    def _ensure_roll_number_unique(self, roll_number: str, *, exclude_student_id: int | None = None) -> None:
        stmt = select(Student).where(Student.roll_number == roll_number)
        if exclude_student_id is not None:
            stmt = stmt.where(Student.id != exclude_student_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="ROLL_NUMBER_EXISTS", message="Roll number already exists.")

    def _ensure_email_unique(self, email: str, *, exclude_user_id: int | None = None) -> None:
        stmt = select(User).where(func.lower(User.email) == email.lower())
        if exclude_user_id is not None:
            stmt = stmt.where(User.id != exclude_user_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="EMAIL_EXISTS", message="Email already exists.")

    def _get_active_department(self, department_id: int) -> Department:
        department = self.db.scalar(
            select(Department).where(Department.id == department_id, Department.deleted_at.is_(None))
        )
        if department is None:
            raise BadRequestError(code="INVALID_DEPARTMENT", message="Department does not exist.")
        return department


class TeacherAdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None,
        department_id: int | None,
        include_deleted: bool,
        limit: int,
        offset: int,
    ) -> Page[TeacherRead]:
        stmt = (
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user))
            .order_by(Teacher.id)
        )
        if not include_deleted:
            stmt = stmt.where(Teacher.deleted_at.is_(None), User.deleted_at.is_(None))
        if department_id is not None:
            stmt = stmt.where(Teacher.department_id == department_id)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Teacher.first_name.ilike(pattern),
                    Teacher.last_name.ilike(pattern),
                    Teacher.employee_id.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_teacher(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get(self, teacher_id: int, *, include_deleted: bool = False) -> TeacherRead:
        teacher = self._get_teacher(teacher_id, include_deleted=include_deleted)
        return serialize_teacher(teacher)

    def create(self, payload: TeacherCreate) -> TeacherRead:
        department = self._get_active_department(payload.department_id)
        self._ensure_email_unique(payload.email)
        self._ensure_employee_id_unique(payload.employee_id)

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.temporary_password),
            role=UserRole.TEACHER.value,
            is_active=payload.is_active,
            must_change_password=True,
            token_version=0,
        )
        teacher = Teacher(
            user=user,
            first_name=payload.first_name,
            last_name=payload.last_name,
            employee_id=payload.employee_id,
            department=department,
        )
        self.db.add_all([user, teacher])
        commit_or_rollback(self.db)
        self.db.refresh(teacher)
        return serialize_teacher(teacher)

    def update(self, teacher_id: int, payload: TeacherUpdate) -> TeacherRead:
        teacher = self._get_teacher(teacher_id, include_deleted=True)
        user = teacher.user
        if payload.email is not None and payload.email.lower() != user.email.lower():
            self._ensure_email_unique(payload.email, exclude_user_id=user.id)
            user.email = payload.email.lower()
        if payload.temporary_password is not None:
            user.password_hash = hash_password(payload.temporary_password)
            user.must_change_password = True
            user.token_version += 1
        if payload.first_name is not None:
            teacher.first_name = payload.first_name
        if payload.last_name is not None:
            teacher.last_name = payload.last_name
        if payload.employee_id is not None and payload.employee_id != teacher.employee_id:
            self._ensure_employee_id_unique(payload.employee_id, exclude_teacher_id=teacher.id)
            teacher.employee_id = payload.employee_id
        if payload.department_id is not None:
            teacher.department = self._get_active_department(payload.department_id)
        if payload.is_active is not None:
            user.is_active = payload.is_active
        commit_or_rollback(self.db)
        self.db.refresh(teacher)
        return serialize_teacher(teacher)

    def soft_delete(self, teacher_id: int) -> dict[str, bool | str]:
        teacher = self._get_teacher(teacher_id, include_deleted=True)
        if teacher.deleted_at is not None:
            raise ConflictError(code="TEACHER_ALREADY_DELETED", message="Teacher is already deleted.")

        now = utcnow()
        teacher.deleted_at = now
        teacher.user.deleted_at = now
        teacher.user.is_active = False
        teacher.user.token_version += 1
        commit_or_rollback(self.db)
        return {"success": True, "message": "Teacher deleted successfully."}

    def restore(self, teacher_id: int) -> TeacherRead:
        teacher = self._get_teacher(teacher_id, include_deleted=True)
        if teacher.deleted_at is None:
            raise ConflictError(code="TEACHER_NOT_DELETED", message="Teacher is not deleted.")

        teacher.deleted_at = None
        teacher.user.deleted_at = None
        teacher.user.is_active = True
        commit_or_rollback(self.db)
        self.db.refresh(teacher)
        return serialize_teacher(teacher)

    def hard_delete(self, teacher_id: int) -> dict[str, bool | str]:
        teacher = self._get_teacher(teacher_id, include_deleted=True)
        if teacher.deleted_at is None:
            raise ConflictError(
                code="TEACHER_SOFT_DELETE_REQUIRED",
                message="Teacher must be soft-deleted before hard delete.",
            )

        assignment_exists = self.db.scalar(
            select(exists().where(CourseOfferingTeacher.teacher_id == teacher.id))
        )
        if assignment_exists:
            raise ConflictError(
                code="TEACHER_HAS_ASSIGNMENTS",
                message="Teacher cannot be hard-deleted while course assignments exist.",
            )

        user = teacher.user
        self.db.delete(teacher)
        self.db.delete(user)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Teacher permanently deleted."}

    def _get_teacher(self, teacher_id: int, *, include_deleted: bool = False) -> Teacher:
        stmt = (
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user))
            .where(Teacher.id == teacher_id)
        )
        if not include_deleted:
            stmt = stmt.where(Teacher.deleted_at.is_(None), User.deleted_at.is_(None))
        teacher = self.db.scalar(stmt)
        if teacher is None:
            raise NotFoundError(code="TEACHER_NOT_FOUND", message="Teacher not found.")
        return teacher

    def _ensure_employee_id_unique(self, employee_id: str, *, exclude_teacher_id: int | None = None) -> None:
        stmt = select(Teacher).where(Teacher.employee_id == employee_id)
        if exclude_teacher_id is not None:
            stmt = stmt.where(Teacher.id != exclude_teacher_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="EMPLOYEE_ID_EXISTS", message="Employee ID already exists.")

    def _ensure_email_unique(self, email: str, *, exclude_user_id: int | None = None) -> None:
        stmt = select(User).where(func.lower(User.email) == email.lower())
        if exclude_user_id is not None:
            stmt = stmt.where(User.id != exclude_user_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="EMAIL_EXISTS", message="Email already exists.")

    def _get_active_department(self, department_id: int) -> Department:
        department = self.db.scalar(
            select(Department).where(Department.id == department_id, Department.deleted_at.is_(None))
        )
        if department is None:
            raise BadRequestError(code="INVALID_DEPARTMENT", message="Department does not exist.")
        return department


class CourseAdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None,
        department_id: int | None,
        include_deleted: bool,
        limit: int,
        offset: int,
    ) -> Page[CourseRead]:
        stmt = select(Course).order_by(Course.id)
        if not include_deleted:
            stmt = stmt.where(Course.deleted_at.is_(None))
        if department_id is not None:
            stmt = stmt.where(Course.department_id == department_id)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(or_(Course.name.ilike(pattern), Course.code.ilike(pattern)))
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_course(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get(self, course_id: int, *, include_deleted: bool = False) -> CourseRead:
        course = self._get_course(course_id, include_deleted=include_deleted)
        return serialize_course(course)

    def create(self, payload: CourseCreate) -> CourseRead:
        self._get_active_department(payload.department_id)
        self._ensure_course_code_unique(payload.code)
        course = Course(
            name=payload.name,
            code=payload.code,
            credit_hours=payload.credit_hours,
            department_id=payload.department_id,
        )
        self.db.add(course)
        commit_or_rollback(self.db)
        self.db.refresh(course)
        return serialize_course(course)

    def update(self, course_id: int, payload: CourseUpdate) -> CourseRead:
        course = self._get_course(course_id, include_deleted=True)
        if payload.name is not None:
            course.name = payload.name
        if payload.code is not None and payload.code != course.code:
            self._ensure_course_code_unique(payload.code, exclude_course_id=course.id)
            course.code = payload.code
        if payload.credit_hours is not None:
            course.credit_hours = payload.credit_hours
        if payload.department_id is not None:
            self._get_active_department(payload.department_id)
            course.department_id = payload.department_id
        commit_or_rollback(self.db)
        self.db.refresh(course)
        return serialize_course(course)

    def soft_delete(self, course_id: int) -> dict[str, bool | str]:
        course = self._get_course(course_id, include_deleted=True)
        if course.deleted_at is not None:
            raise ConflictError(code="COURSE_ALREADY_DELETED", message="Course is already deleted.")

        active_offering_exists = self.db.scalar(
            select(exists().where(CourseOffering.course_id == course.id, CourseOffering.deleted_at.is_(None)))
        )
        if active_offering_exists:
            raise ConflictError(
                code="COURSE_HAS_ACTIVE_OFFERINGS",
                message="Course cannot be deleted while active offerings exist.",
            )

        course.deleted_at = utcnow()
        commit_or_rollback(self.db)
        return {"success": True, "message": "Course deleted successfully."}

    def _get_course(self, course_id: int, *, include_deleted: bool = False) -> Course:
        stmt = select(Course).where(Course.id == course_id)
        if not include_deleted:
            stmt = stmt.where(Course.deleted_at.is_(None))
        course = self.db.scalar(stmt)
        if course is None:
            raise NotFoundError(code="COURSE_NOT_FOUND", message="Course not found.")
        return course

    def _ensure_course_code_unique(self, code: str, *, exclude_course_id: int | None = None) -> None:
        stmt = select(Course).where(Course.code == code)
        if exclude_course_id is not None:
            stmt = stmt.where(Course.id != exclude_course_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(code="COURSE_CODE_EXISTS", message="Course code already exists.")

    def _get_active_department(self, department_id: int) -> Department:
        department = self.db.scalar(
            select(Department).where(Department.id == department_id, Department.deleted_at.is_(None))
        )
        if department is None:
            raise BadRequestError(code="INVALID_DEPARTMENT", message="Department does not exist.")
        return department


class OfferingAdminService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None,
        course_id: int | None,
        term: AcademicTerm | None,
        year: int | None,
        include_deleted: bool,
        limit: int,
        offset: int,
    ) -> Page[CourseOfferingRead]:
        stmt = (
            select(CourseOffering)
            .join(CourseOffering.course)
            .options(
                selectinload(CourseOffering.course),
                selectinload(CourseOffering.teacher_links),
                selectinload(CourseOffering.enrollments),
            )
            .order_by(CourseOffering.id)
        )
        if not include_deleted:
            stmt = stmt.where(CourseOffering.deleted_at.is_(None), Course.deleted_at.is_(None))
        if course_id is not None:
            stmt = stmt.where(CourseOffering.course_id == course_id)
        if term is not None:
            stmt = stmt.where(CourseOffering.term == term.value)
        if year is not None:
            stmt = stmt.where(CourseOffering.year == year)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(or_(Course.name.ilike(pattern), Course.code.ilike(pattern), CourseOffering.section.ilike(pattern)))
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[serialize_offering(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get(self, offering_id: int, *, include_deleted: bool = False) -> CourseOfferingRead:
        offering = self._get_offering(offering_id, include_deleted=include_deleted)
        return serialize_offering(offering)

    def create(self, payload: CourseOfferingCreate) -> CourseOfferingRead:
        self._get_active_course(payload.course_id)
        self._ensure_offering_unique(payload.course_id, payload.term.value, payload.year, payload.section)
        offering = CourseOffering(
            course_id=payload.course_id,
            term=payload.term.value,
            year=payload.year,
            section=payload.section,
            capacity=payload.capacity,
        )
        self.db.add(offering)
        commit_or_rollback(self.db)
        offering = self._get_offering(offering.id, include_deleted=True)
        return serialize_offering(offering)

    def update(self, offering_id: int, payload: CourseOfferingUpdate) -> CourseOfferingRead:
        offering = self._get_offering(offering_id, include_deleted=True)
        new_course_id = payload.course_id if payload.course_id is not None else offering.course_id
        new_term = payload.term.value if payload.term is not None else offering.term
        new_year = payload.year if payload.year is not None else offering.year
        new_section = payload.section if payload.section is not None else offering.section

        if payload.course_id is not None:
            self._get_active_course(payload.course_id)
        if (
            new_course_id != offering.course_id
            or new_term != offering.term
            or new_year != offering.year
            or new_section != offering.section
        ):
            self._ensure_offering_unique(
                new_course_id,
                new_term,
                new_year,
                new_section,
                exclude_offering_id=offering.id,
            )
        if payload.capacity is not None and payload.capacity < len(offering.enrollments):
            raise BadRequestError(
                code="INVALID_CAPACITY",
                message="Capacity cannot be lower than the current enrollment count.",
            )

        offering.course_id = new_course_id
        offering.term = new_term
        offering.year = new_year
        offering.section = new_section
        if payload.capacity is not None:
            offering.capacity = payload.capacity
        commit_or_rollback(self.db)
        offering = self._get_offering(offering.id, include_deleted=True)
        return serialize_offering(offering)

    def soft_delete(self, offering_id: int) -> dict[str, bool | str]:
        offering = self._get_offering(offering_id, include_deleted=True)
        if offering.deleted_at is not None:
            raise ConflictError(code="OFFERING_ALREADY_DELETED", message="Offering is already deleted.")
        if offering.teacher_links or offering.enrollments:
            raise ConflictError(
                code="OFFERING_HAS_DEPENDENCIES",
                message="Offering cannot be deleted while teachers or enrollments exist.",
            )
        offering.deleted_at = utcnow()
        commit_or_rollback(self.db)
        return {"success": True, "message": "Course offering deleted successfully."}

    def assign_teacher(self, offering_id: int, teacher_id: int) -> dict[str, bool | str]:
        offering = self._get_offering(offering_id)
        teacher = self._get_teacher(teacher_id)
        existing = self.db.scalar(
            select(CourseOfferingTeacher).where(
                CourseOfferingTeacher.offering_id == offering.id,
                CourseOfferingTeacher.teacher_id == teacher.id,
            )
        )
        if existing is not None:
            raise ConflictError(code="ASSIGNMENT_EXISTS", message="Teacher is already assigned to this offering.")

        assignment = CourseOfferingTeacher(offering_id=offering.id, teacher_id=teacher.id)
        self.db.add(assignment)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Teacher assigned successfully."}

    def unassign_teacher(self, offering_id: int, teacher_id: int) -> dict[str, bool | str]:
        assignment = self.db.scalar(
            select(CourseOfferingTeacher).where(
                CourseOfferingTeacher.offering_id == offering_id,
                CourseOfferingTeacher.teacher_id == teacher_id,
            )
        )
        if assignment is None:
            raise NotFoundError(code="ASSIGNMENT_NOT_FOUND", message="Teacher assignment not found.")
        self.db.delete(assignment)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Teacher unassigned successfully."}

    def enroll_student(self, offering_id: int, student_id: int) -> dict[str, bool | str]:
        offering = self._get_offering(offering_id)
        student = self._get_student(student_id)
        existing = self.db.scalar(
            select(Enrollment).where(Enrollment.offering_id == offering.id, Enrollment.student_id == student.id)
        )
        if existing is not None:
            raise ConflictError(code="ENROLLMENT_EXISTS", message="Student is already enrolled in this offering.")
        if offering.capacity is not None and len(offering.enrollments) >= offering.capacity:
            raise ConflictError(code="OFFERING_FULL", message="Offering capacity has been reached.")

        enrollment = Enrollment(offering_id=offering.id, student_id=student.id)
        self.db.add(enrollment)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Student enrolled successfully."}

    def unenroll_student(self, offering_id: int, student_id: int) -> dict[str, bool | str]:
        enrollment = self.db.scalar(
            select(Enrollment).where(Enrollment.offering_id == offering_id, Enrollment.student_id == student_id)
        )
        if enrollment is None:
            raise NotFoundError(code="ENROLLMENT_NOT_FOUND", message="Enrollment not found.")
        self.db.delete(enrollment)
        commit_or_rollback(self.db)
        return {"success": True, "message": "Student unenrolled successfully."}

    def _get_offering(self, offering_id: int, *, include_deleted: bool = False) -> CourseOffering:
        stmt = (
            select(CourseOffering)
            .join(CourseOffering.course)
            .options(
                selectinload(CourseOffering.course),
                selectinload(CourseOffering.teacher_links),
                selectinload(CourseOffering.enrollments),
            )
            .where(CourseOffering.id == offering_id)
        )
        if not include_deleted:
            stmt = stmt.where(CourseOffering.deleted_at.is_(None), Course.deleted_at.is_(None))
        offering = self.db.scalar(stmt)
        if offering is None:
            raise NotFoundError(code="OFFERING_NOT_FOUND", message="Course offering not found.")
        return offering

    def _get_active_course(self, course_id: int) -> Course:
        course = self.db.scalar(select(Course).where(Course.id == course_id, Course.deleted_at.is_(None)))
        if course is None:
            raise BadRequestError(code="INVALID_COURSE", message="Course does not exist.")
        return course

    def _ensure_offering_unique(
        self,
        course_id: int,
        term: str,
        year: int,
        section: str,
        *,
        exclude_offering_id: int | None = None,
    ) -> None:
        stmt = select(CourseOffering).where(
            CourseOffering.course_id == course_id,
            CourseOffering.term == term,
            CourseOffering.year == year,
            CourseOffering.section == section,
        )
        if exclude_offering_id is not None:
            stmt = stmt.where(CourseOffering.id != exclude_offering_id)
        if self.db.scalar(stmt) is not None:
            raise ConflictError(
                code="OFFERING_EXISTS",
                message="A course offering with the same course, term, year, and section already exists.",
            )

    def _get_teacher(self, teacher_id: int) -> Teacher:
        stmt = (
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user))
            .where(Teacher.id == teacher_id, Teacher.deleted_at.is_(None), User.deleted_at.is_(None))
        )
        teacher = self.db.scalar(stmt)
        if teacher is None:
            raise BadRequestError(code="INVALID_TEACHER", message="Teacher does not exist.")
        return teacher

    def _get_student(self, student_id: int) -> Student:
        stmt = (
            select(Student)
            .join(Student.user)
            .options(selectinload(Student.user))
            .where(Student.id == student_id, Student.deleted_at.is_(None), User.deleted_at.is_(None))
        )
        student = self.db.scalar(stmt)
        if student is None:
            raise BadRequestError(code="INVALID_STUDENT", message="Student does not exist.")
        return student

