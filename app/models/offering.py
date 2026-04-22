from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import TERM_VALUES
from app.models.base import Base, PrimaryKeyMixin, SoftDeleteMixin, TimestampMixin


TERM_CHECK_CONSTRAINT = "term IN ({})".format(", ".join(f"'{value}'" for value in TERM_VALUES))


class CourseOffering(PrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "course_offerings"
    __table_args__ = (
        CheckConstraint(TERM_CHECK_CONSTRAINT, name="ck_course_offerings_term"),
        CheckConstraint("year >= 2000 AND year <= 2100", name="ck_course_offerings_year"),
        CheckConstraint("capacity IS NULL OR capacity > 0", name="ck_course_offerings_capacity"),
        UniqueConstraint("course_id", "term", "year", "section", name="uq_course_offerings_identity"),
    )

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True, nullable=False)
    term: Mapped[str] = mapped_column(String(20), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    section: Mapped[str] = mapped_column(String(10), nullable=False)
    capacity: Mapped[int | None] = mapped_column(nullable=True)

    course = relationship("Course", back_populates="offerings")
    teacher_links = relationship("CourseOfferingTeacher", back_populates="offering")
    enrollments = relationship("Enrollment", back_populates="offering")


class CourseOfferingTeacher(PrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "course_offering_teachers"
    __table_args__ = (UniqueConstraint("offering_id", "teacher_id", name="uq_course_offering_teacher"),)

    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), nullable=False)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"), nullable=False)

    offering = relationship("CourseOffering", back_populates="teacher_links")
    teacher = relationship("Teacher", back_populates="course_offering_links")

