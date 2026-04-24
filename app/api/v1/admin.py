from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import SessionDep, document_csrf_header, require_role
from app.core.audit import set_audit_context
from app.core.constants import AcademicTerm, UserRole
from app.schemas.common import MessageResponse, Page
from app.schemas.audit_log import AdminAuditLogRead
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
from app.services.audit_log import AuditLogService


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


@router.get("/audit-logs", response_model=Page[AdminAuditLogRead])
def list_audit_logs(
    db: SessionDep,
    actor_user_id: int | None = None,
    method: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[AdminAuditLogRead]:
    return AuditLogService(db).list(
        actor_user_id=actor_user_id,
        method=method,
        action=action,
        entity_type=entity_type,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/departments",
    response_model=DepartmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(document_csrf_header)],
)
def create_department(payload: DepartmentCreate, db: SessionDep, request: Request) -> DepartmentRead:
    department = DepartmentAdminService(db).create(payload)
    set_audit_context(
        request,
        action="CREATE_DEPARTMENT",
        entity_type="department",
        entity_id=department.id,
        entity_label=f"{department.name} ({department.code})",
        description=f"Admin created department {department.name} ({department.code}).",
    )
    return department


@router.get("/departments/{department_id}", response_model=DepartmentRead)
def get_department(department_id: int, db: SessionDep, include_deleted: bool = False) -> DepartmentRead:
    return DepartmentAdminService(db).get(department_id, include_deleted=include_deleted)


@router.patch("/departments/{department_id}", response_model=DepartmentRead, dependencies=[Depends(document_csrf_header)])
def update_department(department_id: int, payload: DepartmentUpdate, db: SessionDep, request: Request) -> DepartmentRead:
    department = DepartmentAdminService(db).update(department_id, payload)
    set_audit_context(
        request,
        action="UPDATE_DEPARTMENT",
        entity_type="department",
        entity_id=department.id,
        entity_label=f"{department.name} ({department.code})",
        description=f"Admin updated department {department.name} ({department.code}).",
    )
    return department


@router.delete("/departments/{department_id}", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def delete_department(department_id: int, db: SessionDep, request: Request) -> MessageResponse:
    department = DepartmentAdminService(db).get(department_id)
    result = DepartmentAdminService(db).soft_delete(department_id)
    set_audit_context(
        request,
        action="SOFT_DELETE_DEPARTMENT",
        entity_type="department",
        entity_id=department.id,
        entity_label=f"{department.name} ({department.code})",
        description=f"Admin soft-deleted department {department.name} ({department.code}).",
    )
    return MessageResponse(**result)


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


@router.post(
    "/students",
    response_model=StudentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(document_csrf_header)],
)
def create_student(payload: StudentCreate, db: SessionDep, request: Request) -> StudentRead:
    student = StudentAdminService(db).create(payload)
    set_audit_context(
        request,
        action="CREATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        entity_label=f"{student.first_name} {student.last_name} ({student.roll_number})",
        description=f"Admin created student {student.first_name} {student.last_name} ({student.roll_number}).",
    )
    return student


@router.get("/students/{student_id}", response_model=StudentRead)
def get_student(student_id: int, db: SessionDep, include_deleted: bool = False) -> StudentRead:
    return StudentAdminService(db).get(student_id, include_deleted=include_deleted)


@router.patch("/students/{student_id}", response_model=StudentRead, dependencies=[Depends(document_csrf_header)])
def update_student(student_id: int, payload: StudentUpdate, db: SessionDep, request: Request) -> StudentRead:
    student = StudentAdminService(db).update(student_id, payload)
    set_audit_context(
        request,
        action="UPDATE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        entity_label=f"{student.first_name} {student.last_name} ({student.roll_number})",
        description=f"Admin updated student {student.first_name} {student.last_name} ({student.roll_number}).",
    )
    return student


@router.delete("/students/{student_id}", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def delete_student(student_id: int, db: SessionDep, request: Request) -> MessageResponse:
    student = StudentAdminService(db).get(student_id, include_deleted=True)
    result = StudentAdminService(db).soft_delete(student_id)
    set_audit_context(
        request,
        action="SOFT_DELETE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        entity_label=f"{student.first_name} {student.last_name} ({student.roll_number})",
        description=f"Admin soft-deleted student {student.first_name} {student.last_name} ({student.roll_number}).",
    )
    return MessageResponse(**result)


@router.post("/students/{student_id}/restore", response_model=StudentRead, dependencies=[Depends(document_csrf_header)])
def restore_student(student_id: int, db: SessionDep, request: Request) -> StudentRead:
    student = StudentAdminService(db).restore(student_id)
    set_audit_context(
        request,
        action="RESTORE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        entity_label=f"{student.first_name} {student.last_name} ({student.roll_number})",
        description=f"Admin restored student {student.first_name} {student.last_name} ({student.roll_number}).",
    )
    return student


@router.delete("/students/{student_id}/hard", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def hard_delete_student(student_id: int, db: SessionDep, request: Request) -> MessageResponse:
    student = StudentAdminService(db).get(student_id, include_deleted=True)
    result = StudentAdminService(db).hard_delete(student_id)
    set_audit_context(
        request,
        action="HARD_DELETE_STUDENT",
        entity_type="student",
        entity_id=student.id,
        entity_label=f"{student.first_name} {student.last_name} ({student.roll_number})",
        description=f"Admin permanently deleted student {student.first_name} {student.last_name} ({student.roll_number}).",
    )
    return MessageResponse(**result)


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


@router.post(
    "/teachers",
    response_model=TeacherRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(document_csrf_header)],
)
def create_teacher(payload: TeacherCreate, db: SessionDep, request: Request) -> TeacherRead:
    teacher = TeacherAdminService(db).create(payload)
    set_audit_context(
        request,
        action="CREATE_TEACHER",
        entity_type="teacher",
        entity_id=teacher.id,
        entity_label=f"{teacher.first_name} {teacher.last_name} ({teacher.employee_id})",
        description=f"Admin created teacher {teacher.first_name} {teacher.last_name} ({teacher.employee_id}).",
    )
    return teacher


@router.get("/teachers/{teacher_id}", response_model=TeacherRead)
def get_teacher(teacher_id: int, db: SessionDep, include_deleted: bool = False) -> TeacherRead:
    return TeacherAdminService(db).get(teacher_id, include_deleted=include_deleted)


@router.patch("/teachers/{teacher_id}", response_model=TeacherRead, dependencies=[Depends(document_csrf_header)])
def update_teacher(teacher_id: int, payload: TeacherUpdate, db: SessionDep, request: Request) -> TeacherRead:
    teacher = TeacherAdminService(db).update(teacher_id, payload)
    set_audit_context(
        request,
        action="UPDATE_TEACHER",
        entity_type="teacher",
        entity_id=teacher.id,
        entity_label=f"{teacher.first_name} {teacher.last_name} ({teacher.employee_id})",
        description=f"Admin updated teacher {teacher.first_name} {teacher.last_name} ({teacher.employee_id}).",
    )
    return teacher


@router.delete("/teachers/{teacher_id}", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def delete_teacher(teacher_id: int, db: SessionDep, request: Request) -> MessageResponse:
    teacher = TeacherAdminService(db).get(teacher_id, include_deleted=True)
    result = TeacherAdminService(db).soft_delete(teacher_id)
    set_audit_context(
        request,
        action="SOFT_DELETE_TEACHER",
        entity_type="teacher",
        entity_id=teacher.id,
        entity_label=f"{teacher.first_name} {teacher.last_name} ({teacher.employee_id})",
        description=f"Admin soft-deleted teacher {teacher.first_name} {teacher.last_name} ({teacher.employee_id}).",
    )
    return MessageResponse(**result)


@router.post("/teachers/{teacher_id}/restore", response_model=TeacherRead, dependencies=[Depends(document_csrf_header)])
def restore_teacher(teacher_id: int, db: SessionDep, request: Request) -> TeacherRead:
    teacher = TeacherAdminService(db).restore(teacher_id)
    set_audit_context(
        request,
        action="RESTORE_TEACHER",
        entity_type="teacher",
        entity_id=teacher.id,
        entity_label=f"{teacher.first_name} {teacher.last_name} ({teacher.employee_id})",
        description=f"Admin restored teacher {teacher.first_name} {teacher.last_name} ({teacher.employee_id}).",
    )
    return teacher


@router.delete("/teachers/{teacher_id}/hard", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def hard_delete_teacher(teacher_id: int, db: SessionDep, request: Request) -> MessageResponse:
    teacher = TeacherAdminService(db).get(teacher_id, include_deleted=True)
    result = TeacherAdminService(db).hard_delete(teacher_id)
    set_audit_context(
        request,
        action="HARD_DELETE_TEACHER",
        entity_type="teacher",
        entity_id=teacher.id,
        entity_label=f"{teacher.first_name} {teacher.last_name} ({teacher.employee_id})",
        description=f"Admin permanently deleted teacher {teacher.first_name} {teacher.last_name} ({teacher.employee_id}).",
    )
    return MessageResponse(**result)


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


@router.post(
    "/courses",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(document_csrf_header)],
)
def create_course(payload: CourseCreate, db: SessionDep, request: Request) -> CourseRead:
    course = CourseAdminService(db).create(payload)
    set_audit_context(
        request,
        action="CREATE_COURSE",
        entity_type="course",
        entity_id=course.id,
        entity_label=f"{course.name} ({course.code})",
        description=f"Admin created course {course.name} ({course.code}).",
    )
    return course


@router.get("/courses/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: SessionDep, include_deleted: bool = False) -> CourseRead:
    return CourseAdminService(db).get(course_id, include_deleted=include_deleted)


@router.patch("/courses/{course_id}", response_model=CourseRead, dependencies=[Depends(document_csrf_header)])
def update_course(course_id: int, payload: CourseUpdate, db: SessionDep, request: Request) -> CourseRead:
    course = CourseAdminService(db).update(course_id, payload)
    set_audit_context(
        request,
        action="UPDATE_COURSE",
        entity_type="course",
        entity_id=course.id,
        entity_label=f"{course.name} ({course.code})",
        description=f"Admin updated course {course.name} ({course.code}).",
    )
    return course


@router.delete("/courses/{course_id}", response_model=MessageResponse, dependencies=[Depends(document_csrf_header)])
def delete_course(course_id: int, db: SessionDep, request: Request) -> MessageResponse:
    course = CourseAdminService(db).get(course_id, include_deleted=True)
    result = CourseAdminService(db).soft_delete(course_id)
    set_audit_context(
        request,
        action="SOFT_DELETE_COURSE",
        entity_type="course",
        entity_id=course.id,
        entity_label=f"{course.name} ({course.code})",
        description=f"Admin soft-deleted course {course.name} ({course.code}).",
    )
    return MessageResponse(**result)


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


@router.post(
    "/course-offerings",
    response_model=CourseOfferingRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(document_csrf_header)],
)
def create_course_offering(payload: CourseOfferingCreate, db: SessionDep, request: Request) -> CourseOfferingRead:
    offering = OfferingAdminService(db).create(payload)
    label = f"{offering.course_code} {offering.term} {offering.year} section {offering.section}"
    set_audit_context(
        request,
        action="CREATE_COURSE_OFFERING",
        entity_type="course_offering",
        entity_id=offering.id,
        entity_label=label,
        description=f"Admin created course offering {label}.",
    )
    return offering


@router.get("/course-offerings/{offering_id}", response_model=CourseOfferingRead)
def get_course_offering(offering_id: int, db: SessionDep, include_deleted: bool = False) -> CourseOfferingRead:
    return OfferingAdminService(db).get(offering_id, include_deleted=include_deleted)


@router.patch(
    "/course-offerings/{offering_id}",
    response_model=CourseOfferingRead,
    dependencies=[Depends(document_csrf_header)],
)
def update_course_offering(
    offering_id: int,
    payload: CourseOfferingUpdate,
    db: SessionDep,
    request: Request,
) -> CourseOfferingRead:
    offering = OfferingAdminService(db).update(offering_id, payload)
    label = f"{offering.course_code} {offering.term} {offering.year} section {offering.section}"
    set_audit_context(
        request,
        action="UPDATE_COURSE_OFFERING",
        entity_type="course_offering",
        entity_id=offering.id,
        entity_label=label,
        description=f"Admin updated course offering {label}.",
    )
    return offering


@router.delete(
    "/course-offerings/{offering_id}",
    response_model=MessageResponse,
    dependencies=[Depends(document_csrf_header)],
)
def delete_course_offering(offering_id: int, db: SessionDep, request: Request) -> MessageResponse:
    offering = OfferingAdminService(db).get(offering_id, include_deleted=True)
    result = OfferingAdminService(db).soft_delete(offering_id)
    label = f"{offering.course_code} {offering.term} {offering.year} section {offering.section}"
    set_audit_context(
        request,
        action="SOFT_DELETE_COURSE_OFFERING",
        entity_type="course_offering",
        entity_id=offering.id,
        entity_label=label,
        description=f"Admin soft-deleted course offering {label}.",
    )
    return MessageResponse(**result)


@router.post(
    "/course-offerings/{offering_id}/teachers/{teacher_id}",
    response_model=MessageResponse,
    dependencies=[Depends(document_csrf_header)],
)
def assign_teacher(offering_id: int, teacher_id: int, db: SessionDep, request: Request) -> MessageResponse:
    result = OfferingAdminService(db).assign_teacher(offering_id, teacher_id)
    set_audit_context(
        request,
        action="ASSIGN_TEACHER",
        entity_type="course_offering_teacher",
        entity_id=offering_id,
        entity_label=result["offering_label"],
        description=f"Admin assigned teacher {result['teacher_label']} to course offering {result['offering_label']}.",
    )
    return MessageResponse(success=result["success"], message=result["message"])


@router.delete(
    "/course-offerings/{offering_id}/teachers/{teacher_id}",
    response_model=MessageResponse,
    dependencies=[Depends(document_csrf_header)],
)
def unassign_teacher(offering_id: int, teacher_id: int, db: SessionDep, request: Request) -> MessageResponse:
    result = OfferingAdminService(db).unassign_teacher(offering_id, teacher_id)
    set_audit_context(
        request,
        action="UNASSIGN_TEACHER",
        entity_type="course_offering_teacher",
        entity_id=offering_id,
        entity_label=result["offering_label"],
        description=f"Admin unassigned teacher {result['teacher_label']} from course offering {result['offering_label']}.",
    )
    return MessageResponse(success=result["success"], message=result["message"])


@router.post(
    "/course-offerings/{offering_id}/students/{student_id}",
    response_model=MessageResponse,
    dependencies=[Depends(document_csrf_header)],
)
def enroll_student(offering_id: int, student_id: int, db: SessionDep, request: Request) -> MessageResponse:
    result = OfferingAdminService(db).enroll_student(offering_id, student_id)
    set_audit_context(
        request,
        action="ENROLL_STUDENT",
        entity_type="enrollment",
        entity_id=offering_id,
        entity_label=result["offering_label"],
        description=f"Admin enrolled student {result['student_label']} in course offering {result['offering_label']}.",
    )
    return MessageResponse(success=result["success"], message=result["message"])


@router.delete(
    "/course-offerings/{offering_id}/students/{student_id}",
    response_model=MessageResponse,
    dependencies=[Depends(document_csrf_header)],
)
def unenroll_student(offering_id: int, student_id: int, db: SessionDep, request: Request) -> MessageResponse:
    result = OfferingAdminService(db).unenroll_student(offering_id, student_id)
    set_audit_context(
        request,
        action="UNENROLL_STUDENT",
        entity_type="enrollment",
        entity_id=offering_id,
        entity_label=result["offering_label"],
        description=f"Admin unenrolled student {result['student_label']} from course offering {result['offering_label']}.",
    )
    return MessageResponse(success=result["success"], message=result["message"])
