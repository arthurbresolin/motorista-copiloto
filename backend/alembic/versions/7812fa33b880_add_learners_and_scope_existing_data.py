"""add learners and scope existing data

Revision ID: 7812fa33b880
Revises: 3f41ca90670a
Create Date: 2026-08-04 21:36:40.286058

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7812fa33b880'
down_revision: Union[str, Sequence[str], None] = '3f41ca90670a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Hash bcrypt de uma senha temporária ("trocar123") — nunca a senha em texto
# puro. É a conta padrão que herda todo dado de teste criado antes de contas
# de aluno existirem; login único pra reivindicar os dados, troca de senha
# fica pra quando a tela de Configurações existir.
DEFAULT_LEARNER_PASSWORD_HASH = "$2b$12$VK4NrsquIeVVn2z4EKqNf./oGagyJhD2DMApKhrLSxtX6V2cvjBG2"


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'learners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('username', sa.String(length=50), nullable=True),
        sa.Column('display_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_learners_email'), 'learners', ['email'], unique=True)

    # Conta padrão com id=1 fixo — os add_column abaixo usam server_default='1'
    # pra apontar exatamente pra essa linha, então a ordem importa: a conta
    # precisa existir antes das colunas learner_id serem criadas (o modo batch
    # do SQLite recria a tabela e valida a FK contra os dados já presentes).
    op.execute(
        "INSERT INTO learners (id, email, password_hash, name, created_at) "
        f"VALUES (1, 'arthur@local', '{DEFAULT_LEARNER_PASSWORD_HASH}', 'Arthur', CURRENT_TIMESTAMP)"
    )

    # SQLite não suporta ALTER TABLE ADD CONSTRAINT — adicionar uma coluna com
    # FK exige modo batch (copiar-e-mover), mesmo padrão já usado em
    # ff1bde999fa3_add_car_id_to_practice_sessions.py.
    with op.batch_alter_table('cars') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key('fk_cars_learner_id_learners', 'learners', ['learner_id'], ['id'])

    with op.batch_alter_table('practice_sessions') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_practice_sessions_learner_id_learners', 'learners', ['learner_id'], ['id']
        )

    with op.batch_alter_table('monitor_sessions') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_monitor_sessions_learner_id_learners', 'learners', ['learner_id'], ['id']
        )

    with op.batch_alter_table('checklist_sessions') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_checklist_sessions_learner_id_learners', 'learners', ['learner_id'], ['id']
        )

    with op.batch_alter_table('quiz_sessions') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_quiz_sessions_learner_id_learners', 'learners', ['learner_id'], ['id']
        )

    with op.batch_alter_table('instructor_invites') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_instructor_invites_learner_id_learners', 'learners', ['learner_id'], ['id']
        )

    with op.batch_alter_table('instructors') as batch_op:
        batch_op.add_column(sa.Column('learner_id', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_foreign_key(
            'fk_instructors_learner_id_learners', 'learners', ['learner_id'], ['id']
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('instructors') as batch_op:
        batch_op.drop_constraint('fk_instructors_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('instructor_invites') as batch_op:
        batch_op.drop_constraint('fk_instructor_invites_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('quiz_sessions') as batch_op:
        batch_op.drop_constraint('fk_quiz_sessions_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('checklist_sessions') as batch_op:
        batch_op.drop_constraint('fk_checklist_sessions_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('monitor_sessions') as batch_op:
        batch_op.drop_constraint('fk_monitor_sessions_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('practice_sessions') as batch_op:
        batch_op.drop_constraint('fk_practice_sessions_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    with op.batch_alter_table('cars') as batch_op:
        batch_op.drop_constraint('fk_cars_learner_id_learners', type_='foreignkey')
        batch_op.drop_column('learner_id')

    op.drop_index(op.f('ix_learners_email'), table_name='learners')
    op.drop_table('learners')
