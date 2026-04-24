"""Add user TOTP fields."""

from alembic import op
import sqlalchemy as sa


revision = "20260424_0005"
down_revision = "20260424_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("totp_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("users", sa.Column("totp_secret", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "totp_secret")
    op.drop_column("users", "totp_enabled")
