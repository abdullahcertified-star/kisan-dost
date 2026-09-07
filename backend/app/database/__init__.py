import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.app.config import settings

db_url = settings.DATABASE_URL
if not db_url or db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
    db_url = "sqlite+aiosqlite:////tmp/kisan_dost.db" if os.environ.get("VERCEL") else "sqlite+aiosqlite:///./kisan_dost.db"

engine = create_async_engine(db_url, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    """Dependency for obtaining an asynchronous database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables asynchronously on startup."""
    from backend.app.database import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
