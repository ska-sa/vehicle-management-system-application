# This makes the 'app' directory a Python package
# Can be empty or contain package-level initialization code

# Optional: Import key components to make them available at package level
from .main import app  # Makes 'app' directly importable from package
from . import models, schemas, database

# Optional: Package version
__version__ = "1.0.0"

# Optional: Package documentation
__doc__ = "Vehicle Management System FastAPI Application"

# Optional: Initialize database connections or other resources


def initialize():
    from .database import engine
    from .models import Base
    Base.metadata.create_all(bind=engine)
