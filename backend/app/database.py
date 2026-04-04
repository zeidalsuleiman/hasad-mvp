from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine and session maker lazily
def _get_engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def _get_session_maker():
    return sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())


def get_db():
    """Dependency for getting a database session."""
    engine = _get_engine()
    SessionLocal = _get_session_maker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Import Base after engine to avoid circular import
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()
