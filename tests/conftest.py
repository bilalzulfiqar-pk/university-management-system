import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import middleware as middleware_module
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.services import auth as auth_module
from app.services.auth import create_admin_user


TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture()
def db_session() -> Session:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session: Session):
    auth_module.login_rate_limiter.reset()
    auth_module.login_ip_rate_limiter.reset()
    auth_module.change_password_rate_limiter.reset()
    middleware_module.read_rate_limiter.reset()
    middleware_module.write_rate_limiter.reset()
    middleware_module.SessionLocal = TestingSessionLocal

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session: Session):
    return create_admin_user(db=db_session, email="admin@example.com", password="AdminPass123!")
