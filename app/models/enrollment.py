from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, PrimaryKeyMixin, TimestampMixin


class Enrollment(PrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "offering_id", name="uq_enrollments_student_offering"),)

    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    offering_id: Mapped[int] = mapped_column(ForeignKey("course_offerings.id"), nullable=False)

    student = relationship("Student", back_populates="enrollments")
    offering = relationship("CourseOffering", back_populates="enrollments")

