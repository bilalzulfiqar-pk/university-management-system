from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.schemas.common import Page
from app.schemas.offering import CourseOfferingRead
from app.schemas.student import StudentRead
from app.schemas.teacher import TeacherRead
from app.services.me import MeService


router = APIRouter()


@router.get("/student", response_model=StudentRead)
def get_my_student_profile(db: SessionDep, user: CurrentUser) -> StudentRead:
    return MeService(db).get_student_profile(user)


@router.get("/student/course-offerings", response_model=Page[CourseOfferingRead])
def list_my_student_offerings(
    db: SessionDep,
    user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[CourseOfferingRead]:
    return MeService(db).list_student_offerings(user, limit=limit, offset=offset)


@router.get("/teacher", response_model=TeacherRead)
def get_my_teacher_profile(db: SessionDep, user: CurrentUser) -> TeacherRead:
    return MeService(db).get_teacher_profile(user)


@router.get("/teacher/course-offerings", response_model=Page[CourseOfferingRead])
def list_my_teacher_offerings(
    db: SessionDep,
    user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[CourseOfferingRead]:
    return MeService(db).list_teacher_offerings(user, limit=limit, offset=offset)


@router.get("/teacher/course-offerings/{offering_id}/students", response_model=Page[StudentRead])
def list_my_teacher_students(
    offering_id: int,
    db: SessionDep,
    user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[StudentRead]:
    return MeService(db).list_teacher_offering_students(
        user,
        offering_id=offering_id,
        limit=limit,
        offset=offset,
    )

