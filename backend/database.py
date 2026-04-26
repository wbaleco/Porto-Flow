from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Troque para sua URL do PostgreSQL se já tiver o banco rodando, ex: postgresql://postgres:senha@localhost/portoflow
SQLALCHEMY_DATABASE_URL = "sqlite:///./portoflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
