"""Initial university management schema."""

from alembic import op
import sqlalchemy as sa


revision = "20260422_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.CheckConstraint("role IN ('ADMIN', 'TEACHER', 'STUDENT')", name="ck_users_role"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "departments",
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_departments_code", "departments", ["code"], unique=False)

    op.create_table(
        "courses",
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("credit_hours", sa.Integer(), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.CheckConstraint("credit_hours > 0", name="ck_courses_credit_hours"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_courses_code", "courses", ["code"], unique=False)
    op.create_index("ix_courses_department_id", "courses", ["department_id"], unique=False)

    op.create_table(
        "students",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("roll_number", sa.String(length=30), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("current_semester", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.CheckConstraint("current_semester >= 1 AND current_semester <= 12", name="ck_students_semester"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("roll_number"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_students_department_id", "students", ["department_id"], unique=False)
    op.create_index("ix_students_roll_number", "students", ["roll_number"], unique=False)

    op.create_table(
        "teachers",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("employee_id", sa.String(length=30), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("employee_id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_teachers_department_id", "teachers", ["department_id"], unique=False)
    op.create_index("ix_teachers_employee_id", "teachers", ["employee_id"], unique=False)

    op.create_table(
        "course_offerings",
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("term", sa.String(length=20), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("section", sa.String(length=10), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.CheckConstraint("term IN ('SPRING', 'SUMMER', 'FALL')", name="ck_course_offerings_term"),
        sa.CheckConstraint("year >= 2000 AND year <= 2100", name="ck_course_offerings_year"),
        sa.CheckConstraint("capacity IS NULL OR capacity > 0", name="ck_course_offerings_capacity"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.UniqueConstraint("course_id", "term", "year", "section", name="uq_course_offerings_identity"),
    )
    op.create_index("ix_course_offerings_course_id", "course_offerings", ["course_id"], unique=False)

    op.create_table(
        "course_offering_teachers",
        sa.Column("offering_id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.ForeignKeyConstraint(["offering_id"], ["course_offerings.id"]),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.UniqueConstraint("offering_id", "teacher_id", name="uq_course_offering_teacher"),
    )

    op.create_table(
        "enrollments",
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("offering_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.ForeignKeyConstraint(["offering_id"], ["course_offerings.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.UniqueConstraint("student_id", "offering_id", name="uq_enrollments_student_offering"),
    )


def downgrade() -> None:
    op.drop_table("enrollments")
    op.drop_table("course_offering_teachers")
    op.drop_index("ix_course_offerings_course_id", table_name="course_offerings")
    op.drop_table("course_offerings")
    op.drop_index("ix_teachers_employee_id", table_name="teachers")
    op.drop_index("ix_teachers_department_id", table_name="teachers")
    op.drop_table("teachers")
    op.drop_index("ix_students_roll_number", table_name="students")
    op.drop_index("ix_students_department_id", table_name="students")
    op.drop_table("students")
    op.drop_index("ix_courses_department_id", table_name="courses")
    op.drop_index("ix_courses_code", table_name="courses")
    op.drop_table("courses")
    op.drop_index("ix_departments_code", table_name="departments")
    op.drop_table("departments")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
