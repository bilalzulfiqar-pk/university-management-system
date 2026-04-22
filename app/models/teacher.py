from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, PrimaryKeyMixin, SoftDeleteMixin, TimestampMixin


class Teacher(PrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "teachers"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True, nullable=False)

    user = relationship("User", back_populates="teacher")
    department = relationship("Department", back_populates="teachers")
    course_offering_links = relationship("CourseOfferingTeacher", back_populates="teacher")

