from datetime import time as datetime_time
import logging
import os
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .schemas import (
    UserCreate, UserResponse,
    VehicleCreate, VehicleResponse,
    TripCreate, TripResponse,
    ServiceNotificationCreate, ServiceNotificationResponse,
    InspectionCreate, InspectionResponse,
    ServiceHistoryCreate, ServiceHistoryResponse,
    Login
)
from .models import User, Vehicle, Trip, ServiceNotification, Inspection, ServiceHistory
from .models import Base
import psycopg2

app = FastAPI()

# Load CORS origins from environment variable
origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Dependency to get DB session


def get_db():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database tables on app startup with retry


@app.on_event("startup")
async def startup_event():
    from .models import Base
    from .database import engine
    from sqlalchemy import text
    print("Starting database initialization...")
    max_retries = 10
    retry_delay = 5  # seconds
    for i in range(max_retries):
        try:
            print(f"Attempt {i + 1}/{max_retries}: Connecting to database...")
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                print(f"Connection successful: {result.fetchone()}")
            print("Creating tables...")
            Base.metadata.create_all(bind=engine)
            # Verify tables were created
            with engine.connect() as connection:
                result = connection.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
                tables = [row[0] for row in result]
                print(f"Tables in database: {tables}")
            if "users" in tables:
                print("Database tables created successfully, including 'users'")
            else:
                print("Table 'users' not created!")
            break
        except Exception as e:
            print(f"Attempt {i + 1}/{max_retries} failed: {str(e)}")
            if i < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise Exception(
                    f"Failed to initialize database after {max_retries} retries: {str(e)}")


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.post("/api/login/")
def login(user: Login, db: Session = Depends(get_db)):
    logger.info(
        f"Attempting login with email: {user.email}, role: {user.role}, password: {user.password}")
    try:
        db_user = db.query(User).filter(
            User.email == user.email,
            User.role == user.role.value
        ).first()
        if not db_user:
            logger.error(
                "User not found or role mismatch for email: %s, role: %s", user.email, user.role.value)
            raise HTTPException(status_code=400, detail="Invalid credentials")
        logger.info(
            f"Found user: {db_user.email}, stored password: {db_user.hashed_password}")
        if user.password != db_user.hashed_password:
            logger.error("Password mismatch for user: %s", db_user.email)
            raise HTTPException(status_code=400, detail="Invalid credentials")
        return {"user": db_user, "token": "mock-token"}
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception: {str(http_exc.detail)}")
        raise http_exc
    except Exception as e:
        logger.error(f"Internal server error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")
# Vehicle CRUD Endpoints


@app.post("/api/add_vehicle/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    try:
        if db.query(Vehicle).filter(Vehicle.vin == vehicle.vin).first():
            raise HTTPException(
                status_code=400, detail="Vehicle with this VIN already exists")
        if db.query(Vehicle).filter(Vehicle.licence_plate == vehicle.licence_plate).first():
            raise HTTPException(
                status_code=400, detail="Vehicle with this licence plate already exists")
        db_vehicle = Vehicle(**vehicle.model_dump())
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_vehicle/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=404, detail=f"Vehicle with ID {vehicle_id} not found")
        return vehicle
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_all_vehicles/", response_model=List[VehicleResponse])
def get_all_vehicles(
    make: Optional[str] = None,
    model: Optional[str] = None,
    licence_plate: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Vehicle)
        if make:
            query = query.filter(Vehicle.make.ilike(f"%{make}%"))
        if model:
            query = query.filter(Vehicle.model.ilike(f"%{model}%"))
        if licence_plate:
            query = query.filter(
                Vehicle.licence_plate.ilike(f"%{licence_plate}%"))
        vehicles = query.all()
        if not vehicles:
            raise HTTPException(status_code=404, detail="No vehicles found")
        return vehicles
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/update_vehicle/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle: VehicleCreate, db: Session = Depends(get_db)):
    try:
        db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not db_vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        db.query(Vehicle).filter(Vehicle.id == vehicle_id).update(
            **vehicle.model_dump())
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.delete("/api/delete_vehicle/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        db.delete(vehicle)
        db.commit()
        return {"message": "Vehicle deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/assign_vehicle_by_email/")
def assign_vehicle_by_email(email: str, vehicle_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        db.query(User).filter(User.email == email).update(
            {"vehicle_id": vehicle_id})
        db.commit()
        db.refresh(user)
        return {"message": "Vehicle assigned successfully", "user": {"user_id": user.user_id, "email": user.email, "vehicle_id": user.vehicle_id}}
    except Exception as e:
        logger.error(f"Error assigning vehicle: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to assign vehicle")


@app.get("/api/vehicles/assigned", response_model=VehicleResponse)
def get_assigned_vehicle(db: Session = Depends(get_db)):
    try:
        # This assumes the request includes a way to identify the user (e.g., via a header or context)
        # For now, we'll need to pass the email via query parameter or header since no auth is used
        email = None  # You might need to get this from a request header or query param
        if not email:
            raise HTTPException(
                status_code=400, detail="Email is required to fetch assigned vehicle")

        user = db.query(User).filter(User.email == email).first()
        if not user or user.vehicle_id is None:
            raise HTTPException(status_code=404, detail="No vehicle assigned")

        vehicle = db.query(Vehicle).filter(
            Vehicle.id == user.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=404, detail="Assigned vehicle not found")
        return vehicle
    except Exception as e:
        logger.error(f"Error fetching assigned vehicle: {str(e)}")
        # User CRUD Endpoints
        raise HTTPException(
            status_code=500, detail="Failed to fetch assigned vehicle")


@app.post("/api/add_user/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(
                status_code=400, detail="User with this email already exists")
        if user.vehicle_id:
            if user.role == "admin":
                raise HTTPException(
                    status_code=400, detail="Admins cannot be assigned a vehicle")
            if not db.query(Vehicle).filter(Vehicle.id == user.vehicle_id).first():
                raise HTTPException(
                    status_code=400, detail=f"Vehicle with ID {user.vehicle_id} not found")
        db_user = User(name=user.name, email=user.email,
                       hashed_password=user.password, role=user.role, vehicle_id=user.vehicle_id)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_user/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404, detail=f"User with ID {user_id} not found")
        return user
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_all_users/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    try:
        users = db.query(User).all()
        if not users:
            raise HTTPException(status_code=404, detail="No users found")
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/update_user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.user_id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.vehicle_id:
            if user.role == "admin":
                raise HTTPException(
                    status_code=400, detail="Admins cannot be assigned a vehicle")
            if not db.query(Vehicle).filter(Vehicle.id == user.vehicle_id).first():
                raise HTTPException(
                    status_code=400, detail=f"Vehicle with ID {user.vehicle_id} not found")
        db.query(User).filter(User.user_id == user_id).update({
            "name": user.name,
            "email": user.email,
            "hashed_password": user.password,
            "role": user.role,
            "vehicle_id": user.vehicle_id
        })
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.delete("/api/delete_user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


# Trip CRUD Endpoints

# add/log trip


@app.post("/api/add_trip/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        if not db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first():
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {trip.vehicle_id} not found")
        if not db.query(User).filter(User.user_id == trip.user_id).first():
            raise HTTPException(
                status_code=400, detail=f"User with ID {trip.user_id} not found")
        db_trip = Trip(**trip.model_dump())
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# get a specific trip


@app.get("/api/get_trip/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    try:
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=404, detail=f"Trip with ID {trip_id} not found")
        return trip
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_all_trips/", response_model=List[TripResponse])
def get_all_trips(db: Session = Depends(get_db)):
    try:
        trips = db.query(Trip).all()
        if not trips:
            raise HTTPException(status_code=404, detail="No trips found")
        return trips
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# get trips of a user


@app.get("/api/get_user_trips/{user_id}", response_model=List[TripResponse])
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    try:
        trips = db.query(Trip).filter(Trip.user_id == user_id).all()
        if not trips:
            raise HTTPException(
                status_code=404, detail="No trips found for this user")
        return trips
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/update_trip/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip: TripCreate, db: Session = Depends(get_db)):
    db_trip = db.query(Trip).filter(
        Trip.trip_id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for key, value in trip.dict(exclude_unset=True).items():
        setattr(db_trip, key, value)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@app.delete("/api/delete_trip/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    try:
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        db.delete(trip)
        db.commit()
        return {"message": "Trip deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# ServiceNotification CRUD Endpoints


@app.post("/api/add_service_notification/", response_model=ServiceNotificationResponse)
def create_service_notification(notification: ServiceNotificationCreate, db: Session = Depends(get_db)):
    try:
        if not db.query(Vehicle).filter(Vehicle.id == notification.vehicle_id).first():
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {notification.vehicle_id} not found")
        db_notification = ServiceNotification(**notification.model_dump())
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_service_notification/{notification_id}", response_model=ServiceNotificationResponse)
def get_service_notification(notification_id: int, db: Session = Depends(get_db)):
    try:
        notification = db.query(ServiceNotification).filter(
            ServiceNotification.notification_id == notification_id).first()
        if not notification:
            raise HTTPException(
                status_code=404, detail=f"Service Notification with ID {notification_id} not found")
        return notification
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# Inspection CRUD Endpoints


@app.post("/api/add_inspection/", response_model=InspectionResponse)
def create_inspection(inspection: InspectionCreate, db: Session = Depends(get_db)):
    try:
        if not db.query(Vehicle).filter(Vehicle.id == inspection.vehicle_id).first():
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {inspection.vehicle_id} not found")
        if not db.query(User).filter(User.user_id == inspection.user_id).first():
            raise HTTPException(
                status_code=400, detail=f"User with ID {inspection.user_id} not found")
        db_inspection = Inspection(**inspection.model_dump())
        db.add(db_inspection)
        db.commit()
        db.refresh(db_inspection)
        return db_inspection
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_inspection/{inspection_id}", response_model=InspectionResponse)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    try:
        inspection = db.query(Inspection).filter(
            Inspection.inspection_id == inspection_id).first()
        if not inspection:
            raise HTTPException(
                status_code=404, detail=f"Inspection with ID {inspection_id} not found")
        return inspection
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_inspections_by_vehicle/{vehicle_id}", response_model=List[InspectionResponse])
def get_inspections_by_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    try:
        inspections = db.query(Inspection).filter(
            Inspection.vehicle_id == vehicle_id).all()
        if not inspections:
            raise HTTPException(
                status_code=404, detail="No inspections found for this vehicle")
        return inspections
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# get all inspections


@app.get("/api/get_all_inspections/", response_model=List[InspectionResponse])
def get_all_inspections(db: Session = Depends(get_db)):
    try:
        inspections = db.query(Inspection).all()
        if not inspections:
            raise HTTPException(status_code=404, detail="No inspections found")
        return inspections
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# ServiceHistory CRUD Endpoints


@app.post("/api/add_service_history/", response_model=ServiceHistoryResponse)
def create_service_history(service_history: ServiceHistoryCreate, db: Session = Depends(get_db)):
    try:
        if not db.query(Vehicle).filter(Vehicle.id == service_history.vehicle_vin).first():
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {service_history.vehicle_vin} not found")
        db_service_history = ServiceHistory(**service_history.model_dump())
        db.add(db_service_history)
        db.commit()
        db.refresh(db_service_history)
        return db_service_history
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_service_history/{service_id}", response_model=ServiceHistoryResponse)
def get_service_history(service_id: int, db: Session = Depends(get_db)):
    try:
        service_history = db.query(ServiceHistory).filter(
            ServiceHistory.service_id == service_id).first()
        if not service_history:
            raise HTTPException(
                status_code=404, detail=f"Service History with ID {service_id} not found")
        return service_history
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# Test database connection


@app.get("/api/test_db")
def test_db(db: Session = Depends(get_db)):
    from sqlalchemy.sql import text
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection working"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {str(e)}")
