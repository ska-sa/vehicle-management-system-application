from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.main import get_db
from . import models

def get_current_user(db: Session = Depends(get_db)):
    # Function to fetch the current user (you'll need to implement this in your authentication system)
    pass

def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin rights required"
        )

def require_employee(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee rights required"
        )
