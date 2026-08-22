"""add severe event count to monitor sessions

Revision ID: a3f7c2d1e9b0
Revises: 17b159fb551d
Create Date: 2026-07-30 20:33:28.006285

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f7c2d1e9b0'
down_revision: Union[str, Sequence[str], None] = '17b159fb551d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'monitor_sessions',
        sa.Column('severe_event_count', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('monitor_sessions', 'severe_event_count')
