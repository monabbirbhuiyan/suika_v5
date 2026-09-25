import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# 1. Force Alembic to look inside the 'src' folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

# 2. Use the exact same 'backend' imports your models are using
from backend.core.database import Base
from backend.models.problem_space import User, ProblemSpace, Node, Verification, Account
from backend.models.graph import Edge, Fragment
from backend.models.legal import Dataset, CaseStudy
from backend.models.settings import NotificationPreference, PrivacyPreference

# Force the IDE to register the models
__models__ = [
    User, ProblemSpace, Node, Edge, Fragment, Dataset, CaseStudy,
    NotificationPreference, PrivacyPreference, Verification, Account
]

config = context.config
load_dotenv()

database_url = os.getenv("DATABASE_URL", "postgresql://suika_admin:localpassword@localhost:5433/suika_db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def include_name(name, type_, parent_names):
    if type_ == "table":
        # Add the exact names of the old Prisma tables you want Alembic to ignore
        return name not in ["user", "session", "account", "subscriptions", "notification_preferences", "privacy_preferences"]
    return True

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Removed include_name parameter here
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
