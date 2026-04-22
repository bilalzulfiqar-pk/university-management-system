from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, PrimaryKeyMixin, SoftDeleteMixin, TimestampMixin


class Course(PrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (CheckConstraint("credit_hours > 0", name="ck_courses_credit_hours"),)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    credit_hours: Mapped[int] = mapped_column(nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True, nullable=False)

    department = relationship("Department", back_populates="courses")
    offerings = relationship("CourseOffering", back_populates="course")

