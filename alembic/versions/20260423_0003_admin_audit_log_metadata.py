"""Add structured admin audit log metadata."""

from alembic import op
import sqlalchemy as sa


revision = "20260423_0003"
down_revision = "20260423_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_audit_logs", sa.Column("action", sa.String(length=50), nullable=True))
    op.add_column("admin_audit_logs", sa.Column("entity_type", sa.String(length=50), nullable=True))
    op.add_column("admin_audit_logs", sa.Column("entity_id", sa.Integer(), nullable=True))
    op.add_column("admin_audit_logs", sa.Column("entity_label", sa.String(length=255), nullable=True))
    op.add_column("admin_audit_logs", sa.Column("description", sa.String(length=500), nullable=True))

    op.execute(
        """
        UPDATE admin_audit_logs
        SET action = method,
            entity_type = 'unknown',
            description = 'Admin performed ' || method || ' on ' || path || '.'
        """
    )

    op.alter_column("admin_audit_logs", "action", nullable=False)
    op.alter_column("admin_audit_logs", "entity_type", nullable=False)
    op.alter_column("admin_audit_logs", "description", nullable=False)

    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"], unique=False)
    op.create_index("ix_admin_audit_logs_entity_type", "admin_audit_logs", ["entity_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_entity_type", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_action", table_name="admin_audit_logs")
    op.drop_column("admin_audit_logs", "description")
    op.drop_column("admin_audit_logs", "entity_label")
    op.drop_column("admin_audit_logs", "entity_id")
    op.drop_column("admin_audit_logs", "entity_type")
    op.drop_column("admin_audit_logs", "action")
