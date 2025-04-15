from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import Vehicle, User, Trip, ServiceNotification, Role, Status
# from app.routes import vehicles
from app.database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
from app import models
from app.schemas import UserCreate, UserResponse, VehicleBase, VehicleCreate, VehicleResponse

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# User CRUD operations and routes

# add user to database
@app.post("/api/add_user/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        hashed_password = user.password

        db_user = User(
            name=user.name,
            email=user.email,
            hashed_password=hashed_password,
            role=user.role
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# get user from from database
@app.get("/api/get_user/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# delete user from database


@app.delete("/api/delete_user/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# Vehicle CRUD operations and routes

# add vehicle to database
@app.post("/api/add_vehicle/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    # Check if the vehicle already exists
    try:
        if db.query(Vehicle).filter(Vehicle.vin == vehicle.vin).first():
            raise HTTPException(
                status_code=400,
                detail="Vehicle with this VIN already exists")
        if db.query(Vehicle).filter(Vehicle.licence_plate == vehicle.licence_plate).first():
            raise HTTPException(
                status_code=400,
                detail="Vehicle with this licence plate already exists")

        db_vehicle = Vehicle(**vehicle.model_dump())

        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# get vehicle from database


@app.get("/api/get_vehicle/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

# delete vehicle from database


@app.delete("/delete_vehicle/{vehicle_id}", response_model=VehicleResponse)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully"}
