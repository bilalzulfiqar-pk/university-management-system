from fastapi import APIRouter, Depends, Query, status

from app.api.deps import SessionDep, require_role
from app.core.constants import AcademicTerm, UserRole
from app.schemas.common import MessageResponse, Page
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.schemas.offering import CourseOfferingCreate, CourseOfferingRead, CourseOfferingUpdate
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate
from app.schemas.teacher import TeacherCreate, TeacherRead, TeacherUpdate
from app.services.admin import (
    CourseAdminService,
    DepartmentAdminService,
    OfferingAdminService,
    StudentAdminService,
    TeacherAdminService,
)


router = APIRouter(dependencies=[Depends(require_role(UserRole.ADMIN))])


@router.get("/departments", response_model=Page[DepartmentRead])
def list_departments(
    db: SessionDep,
    search: str | None = None,
    include_deleted: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[DepartmentRead]:
    return DepartmentAdminService(db).list(
        search=search,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )


@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, db: SessionDep) -> DepartmentRead:
    return DepartmentAdminService(db).create(payload)


@router.get("/departments/{department_id}", response_model=DepartmentRead)
def get_department(department_id: int, db: SessionDep, include_deleted: bool = False) -> DepartmentRead:
    return DepartmentAdminService(db).get(department_id, include_deleted=include_deleted)


@router.patch("/departments/{department_id}", response_model=DepartmentRead)
def update_department(department_id: int, payload: DepartmentUpdate, db: SessionDep) -> DepartmentRead:
    return DepartmentAdminService(db).update(department_id, payload)


@router.delete("/departments/{department_id}", response_model=MessageResponse)
def delete_department(department_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**DepartmentAdminService(db).soft_delete(department_id))


@router.get("/students", response_model=Page[StudentRead])
def list_students(
    db: SessionDep,
    search: str | None = None,
    department_id: int | None = None,
    semester: int | None = Query(default=None, ge=1, le=12),
    include_deleted: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[StudentRead]:
    return StudentAdminService(db).list(
        search=search,
        department_id=department_id,
        semester=semester,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )


@router.post("/students", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: SessionDep) -> StudentRead:
    return StudentAdminService(db).create(payload)


@router.get("/students/{student_id}", response_model=StudentRead)
def get_student(student_id: int, db: SessionDep, include_deleted: bool = False) -> StudentRead:
    return StudentAdminService(db).get(student_id, include_deleted=include_deleted)


@router.patch("/students/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: SessionDep) -> StudentRead:
    return StudentAdminService(db).update(student_id, payload)


@router.delete("/students/{student_id}", response_model=MessageResponse)
def delete_student(student_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**StudentAdminService(db).soft_delete(student_id))


@router.post("/students/{student_id}/restore", response_model=StudentRead)
def restore_student(student_id: int, db: SessionDep) -> StudentRead:
    return StudentAdminService(db).restore(student_id)


@router.delete("/students/{student_id}/hard", response_model=MessageResponse)
def hard_delete_student(student_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**StudentAdminService(db).hard_delete(student_id))


@router.get("/teachers", response_model=Page[TeacherRead])
def list_teachers(
    db: SessionDep,
    search: str | None = None,
    department_id: int | None = None,
    include_deleted: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[TeacherRead]:
    return TeacherAdminService(db).list(
        search=search,
        department_id=department_id,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )


@router.post("/teachers", response_model=TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(payload: TeacherCreate, db: SessionDep) -> TeacherRead:
    return TeacherAdminService(db).create(payload)


@router.get("/teachers/{teacher_id}", response_model=TeacherRead)
def get_teacher(teacher_id: int, db: SessionDep, include_deleted: bool = False) -> TeacherRead:
    return TeacherAdminService(db).get(teacher_id, include_deleted=include_deleted)


@router.patch("/teachers/{teacher_id}", response_model=TeacherRead)
def update_teacher(teacher_id: int, payload: TeacherUpdate, db: SessionDep) -> TeacherRead:
    return TeacherAdminService(db).update(teacher_id, payload)


@router.delete("/teachers/{teacher_id}", response_model=MessageResponse)
def delete_teacher(teacher_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**TeacherAdminService(db).soft_delete(teacher_id))


@router.post("/teachers/{teacher_id}/restore", response_model=TeacherRead)
def restore_teacher(teacher_id: int, db: SessionDep) -> TeacherRead:
    return TeacherAdminService(db).restore(teacher_id)


@router.delete("/teachers/{teacher_id}/hard", response_model=MessageResponse)
def hard_delete_teacher(teacher_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**TeacherAdminService(db).hard_delete(teacher_id))


@router.get("/courses", response_model=Page[CourseRead])
def list_courses(
    db: SessionDep,
    search: str | None = None,
    department_id: int | None = None,
    include_deleted: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[CourseRead]:
    return CourseAdminService(db).list(
        search=search,
        department_id=department_id,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )


@router.post("/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: SessionDep) -> CourseRead:
    return CourseAdminService(db).create(payload)


@router.get("/courses/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: SessionDep, include_deleted: bool = False) -> CourseRead:
    return CourseAdminService(db).get(course_id, include_deleted=include_deleted)


@router.patch("/courses/{course_id}", response_model=CourseRead)
def update_course(course_id: int, payload: CourseUpdate, db: SessionDep) -> CourseRead:
    return CourseAdminService(db).update(course_id, payload)


@router.delete("/courses/{course_id}", response_model=MessageResponse)
def delete_course(course_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**CourseAdminService(db).soft_delete(course_id))


@router.get("/course-offerings", response_model=Page[CourseOfferingRead])
def list_course_offerings(
    db: SessionDep,
    search: str | None = None,
    course_id: int | None = None,
    term: AcademicTerm | None = None,
    year: int | None = Query(default=None, ge=2000, le=2100),
    include_deleted: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[CourseOfferingRead]:
    return OfferingAdminService(db).list(
        search=search,
        course_id=course_id,
        term=term,
        year=year,
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )


@router.post("/course-offerings", response_model=CourseOfferingRead, status_code=status.HTTP_201_CREATED)
def create_course_offering(payload: CourseOfferingCreate, db: SessionDep) -> CourseOfferingRead:
    return OfferingAdminService(db).create(payload)


@router.get("/course-offerings/{offering_id}", response_model=CourseOfferingRead)
def get_course_offering(offering_id: int, db: SessionDep, include_deleted: bool = False) -> CourseOfferingRead:
    return OfferingAdminService(db).get(offering_id, include_deleted=include_deleted)


@router.patch("/course-offerings/{offering_id}", response_model=CourseOfferingRead)
def update_course_offering(
    offering_id: int,
    payload: CourseOfferingUpdate,
    db: SessionDep,
) -> CourseOfferingRead:
    return OfferingAdminService(db).update(offering_id, payload)


@router.delete("/course-offerings/{offering_id}", response_model=MessageResponse)
def delete_course_offering(offering_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**OfferingAdminService(db).soft_delete(offering_id))


@router.post("/course-offerings/{offering_id}/teachers/{teacher_id}", response_model=MessageResponse)
def assign_teacher(offering_id: int, teacher_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**OfferingAdminService(db).assign_teacher(offering_id, teacher_id))


@router.delete("/course-offerings/{offering_id}/teachers/{teacher_id}", response_model=MessageResponse)
def unassign_teacher(offering_id: int, teacher_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**OfferingAdminService(db).unassign_teacher(offering_id, teacher_id))


@router.post("/course-offerings/{offering_id}/students/{student_id}", response_model=MessageResponse)
def enroll_student(offering_id: int, student_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**OfferingAdminService(db).enroll_student(offering_id, student_id))


@router.delete("/course-offerings/{offering_id}/students/{student_id}", response_model=MessageResponse)
def unenroll_student(offering_id: int, student_id: int, db: SessionDep) -> MessageResponse:
    return MessageResponse(**OfferingAdminService(db).unenroll_student(offering_id, student_id))
