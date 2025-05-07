import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://admin:admin123@database:5432/VehicleManagementSystemDB"
)
##The commented code below is the one from Git the one above I edited to add the "DATABASE_URL" to make docker work ,revert back to the one below if the above method doesn't work for you
##SQLALCHEMY_DATABASE_URL = "postgresql://admin:admin123@localhost:5432/VehicleManagementSystemDB"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()