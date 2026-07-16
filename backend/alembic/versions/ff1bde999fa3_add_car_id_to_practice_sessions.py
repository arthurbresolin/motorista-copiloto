"""add car_id to practice sessions

Revision ID: ff1bde999fa3
Revises: 7968fccf9fb3
Create Date: 2026-07-15 22:28:33.369548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff1bde999fa3'
down_revision: Union[str, Sequence[str], None] = '7968fccf9fb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so adding a column
    # with a foreign key requires batch mode (copy-and-move strategy).
    with op.batch_alter_table('practice_sessions') as batch_op:
        batch_op.add_column(sa.Column('car_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_practice_sessions_car_id_cars', 'cars', ['car_id'], ['id']
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('practice_sessions') as batch_op:
        batch_op.drop_constraint('fk_practice_sessions_car_id_cars', type_='foreignkey')
        batch_op.drop_column('car_id')
