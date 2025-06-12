from .models import User, Vehicle, Trip, ServiceNotification, Inspection, ServiceHistory
import psycopg2
from .models import Base
from sqlalchemy import and_
from datetime import time as datetime_time
import logging
import os
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from .schemas import (
    InspectionUpdate, UserUpdate, UserCreate, UserResponse,
    VehicleCreate, VehicleResponse, VehicleDueForServiceResponse,
    TripCreate, TripResponse,
    ServiceNotificationCreate, ServiceNotificationResponse,
    InspectionCreate, InspectionResponse,
    ServiceHistoryCreate, ServiceHistoryResponse,
    Login, AssignVehicleRequest
)
# New schema for PATCH request
from pydantic import BaseModel


class InspectionSignedByUpdate(BaseModel):
    signed_by: Optional[str]


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

# Helper function to check if a vehicle is due for service


def is_vehicle_due_for_service(vehicle: Vehicle, db: Session) -> bool:
    mileage = getattr(vehicle, "mileage", None)
    last_service_km = getattr(vehicle, "last_service_km", None)
    mileage_threshold = 15000
    if mileage is not None and last_service_km is not None and (mileage - last_service_km) >= mileage_threshold:
        return True
    else:
        return False

# Initialize database tables on app startup with retry


@app.on_event("startup")
async def startup_event():
    from .models import Base
    from .database import engine
    from sqlalchemy import text
    print("Starting database initialization...")
    max_retries = 10
    retry_delay = 5
    for i in range(max_retries):
        try:
            print(f"Attempt {i + 1}/{max_retries}: Connecting to database...")
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                print(f"Connection successful: {result.fetchone()}")
            print("Creating tables...")
            Base.metadata.create_all(bind=engine)
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
        f"Attempting login with email: {user.email}, role: {user.role}")
    try:
        db_user = db.query(User).filter(
            User.email == user.email,
            User.role == user.role
        ).first()
        if not db_user or user.password != db_user.hashed_password:
            logger.error(
                f"Invalid credentials for email: {user.email}, role: {user.role}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user_data = {
            "user_id": db_user.user_id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role.value,
            "vehicle_id": db_user.vehicle_id,
        }
        return {
            "token": "mock-token-123",
            "user": user_data
        }
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


@app.get("/api/get_available_vehicles/", response_model=List[VehicleResponse])
def get_available_vehicles(db: Session = Depends(get_db)):
    try:
        unassigned_vehicles = db.query(Vehicle).outerjoin(User, User.vehicle_id == Vehicle.id)\
            .filter(User.user_id.is_(None)).all()
        available_vehicles = [
            vehicle for vehicle in unassigned_vehicles
            if not is_vehicle_due_for_service(vehicle, db)
        ]
        if not available_vehicles:
            raise HTTPException(
                status_code=404, detail="No available vehicles found")
        return available_vehicles
    except Exception as e:
        logger.error(f"Error fetching available vehicles: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_all_vehicles/", response_model=List[VehicleResponse])
def get_all_vehicles(make: Optional[str] = None, model: Optional[str] = None, licence_plate: Optional[str] = None, db: Session = Depends(get_db)):
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
        update_data = vehicle.model_dump()
        logger.debug(f"Update data for vehicle {vehicle_id}: {update_data}")
        if update_data['vin'] != db_vehicle.vin:
            existing_vehicle = db.query(Vehicle).filter(
                Vehicle.vin == update_data['vin'],
                Vehicle.id != vehicle_id
            ).first()
            if existing_vehicle:
                raise HTTPException(
                    status_code=400, detail="Vehicle with this VIN already exists")
        if update_data['licence_plate'] != db_vehicle.licence_plate:
            existing_vehicle = db.query(Vehicle).filter(
                Vehicle.licence_plate == update_data['licence_plate'],
                Vehicle.id != vehicle_id
            ).first()
            if existing_vehicle:
                raise HTTPException(
                    status_code=400, detail="Vehicle with this licence plate already exists")
        for key, value in update_data.items():
            if hasattr(db_vehicle, key):
                logger.debug(f"Updating {key} to {value}")
                setattr(db_vehicle, key, value)
            else:
                logger.warning(
                    f"Ignoring unknown attribute '{key}' for Vehicle model")
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating vehicle {vehicle_id}: {str(e)}")
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
def assign_vehicle_by_email(request: AssignVehicleRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"Assigning vehicle with data: {request.dict()}")
        if request.vehicle_id <= 0:
            logger.warning(
                "Invalid vehicle_id: vehicle_id must be greater than 0")
            raise HTTPException(
                status_code=400, detail="Invalid vehicle_id: vehicle_id must be greater than 0")
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            logger.warning(f"User not found for email: {request.email}")
            raise HTTPException(status_code=404, detail="User not found")
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == request.vehicle_id).first()
        if not vehicle:
            logger.warning(f"Vehicle not found for ID: {request.vehicle_id}")
            raise HTTPException(status_code=404, detail="Vehicle not found")
        existing_user = db.query(User).filter(
            User.vehicle_id == request.vehicle_id,
            User.user_id != user.user_id
        ).first()
        if existing_user:
            logger.warning(
                f"Vehicle {request.vehicle_id} already assigned to user {existing_user.email}")
            raise HTTPException(
                status_code=400, detail="Vehicle is already assigned to another user")
        if is_vehicle_due_for_service(vehicle, db):
            logger.warning(f"Vehicle {request.vehicle_id} is due for service")
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {request.vehicle_id} is due for service and cannot be assigned")
        db.query(User).filter(User.email == request.email).update(
            {"vehicle_id": request.vehicle_id})
        db.commit()
        db.refresh(user)
        logger.info(
            f"Vehicle {request.vehicle_id} assigned to user {request.email}")
        return {"message": "Vehicle assigned successfully", "user": {"user_id": user.user_id, "email": user.email, "vehicle_id": user.vehicle_id}}
    except Exception as e:
        db.rollback()
        logger.error(f"Error assigning vehicle: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/vehicles/assigned", response_model=VehicleResponse)
def get_assigned_vehicle(email: str, db: Session = Depends(get_db)):
    try:
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
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception: {str(http_exc.detail)}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching assigned vehicle: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/vehicles/due_for_service/", response_model=List[VehicleDueForServiceResponse])
def get_vehicles_due_for_service(db: Session = Depends(get_db)):
    try:
        vehicles = db.query(Vehicle).outerjoin(ServiceNotification).filter(
            (Vehicle.mileage - Vehicle.last_service_km) >= 15000,
            ServiceNotification.vehicle_id == None
        ).all()
        due_vehicles = [
            VehicleDueForServiceResponse(
                id=vehicle.id,  # type: ignore
                vin=vehicle.vin,  # type: ignore
                year=vehicle.year,  # type: ignore
                make=vehicle.make,  # type: ignore
                model=vehicle.model,  # type: ignore
                licence_plate=vehicle.licence_plate,  # type: ignore
                mileage=vehicle.mileage,  # type: ignore
                last_service_km=vehicle.last_service_km,  # type: ignore
                last_service_date=vehicle.last_service_date,  # type: ignore
                reason=f"Due to mileage: {vehicle.mileage - vehicle.last_service_km} km since last service",
                service_notification=None
            )
            for vehicle in vehicles
        ]
        return due_vehicles

    except Exception as e:
        logger.error(f"Error fetching vehicles due for service: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/add_user/", response_model=UserResponse)
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating user with email: {user.email}")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        logger.warning(f"User with email {user.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.vehicle_id:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == user.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if is_vehicle_due_for_service(vehicle, db):
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {user.vehicle_id} is due for service and cannot be assigned")
    new_user = User(
        email=user.email,
        name=user.name,
        hashed_password=user.password,
        role=user.role,
        vehicle_id=user.vehicle_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User created with email: {new_user.email}")
    return new_user


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
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/update_user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    logger.info(f"Updating user with ID: {user_id}")
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        logger.warning(f"User with ID {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    if user_update.name is not None:
        db_user.name = user_update.name  # type: ignore
    if user_update.email is not None:
        existing_user = db.query(User).filter(
            User.email == user_update.email, User.user_id != user_id).first()
        if existing_user:
            logger.warning(f"Email {user_update.email} already in use")
            raise HTTPException(
                status_code=400, detail="Email already registered")
        db_user.email = user_update.email  # type: ignore
    if user_update.password is not None:
        db_user.hashed_password = user_update.password  # type: ignore
    if user_update.vehicle_id is not None:
        db_user.vehicle_id = user_update.vehicle_id  # type: ignore
    db.commit()
    db.refresh(db_user)
    logger.info(f"User with ID {user_id} updated")
    return db_user


@app.get("/api/get_available_users/", response_model=List[UserResponse])
def get_available_users(db: Session = Depends(get_db)):
    try:
        users = db.query(User).filter(
            and_(
                User.vehicle_id.is_(None),
                User.role == "employee"
            )
        ).all()
        return users
    except Exception as e:
        logger.exception("Error fetching available users")
        raise HTTPException(status_code=500, detail="Internal server error")


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


@app.post("/api/add_trip/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == trip.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {trip.vehicle_id} not found")
        if not db.query(User).filter(User.user_id == trip.user_id).first():
            raise HTTPException(
                status_code=400, detail=f"User with ID {trip.user_id} not found")
        assigned_user = db.query(User).filter(
            User.vehicle_id == trip.vehicle_id,
            User.user_id != trip.user_id
        ).first()
        if assigned_user:
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {trip.vehicle_id} is already assigned to another user")
        if is_vehicle_due_for_service(vehicle, db):
            raise HTTPException(
                status_code=400, detail=f"Vehicle with ID {trip.vehicle_id} is due for service and cannot be used for a trip")
        db_trip = Trip(**trip.model_dump())
        db_user = db.query(User).filter(User.user_id == trip.user_id).first()
        db_user.vehicle_id = trip.vehicle_id  # type: ignore
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


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
        logger.info("Fetching all trips")
        trips = db.query(Trip).all()
        logger.info(f"Retrieved {len(trips)} trips")
        return trips
    except Exception as e:
        logger.error(f"Error fetching trips: {str(e)}", exc_info=True)
        return []


@app.get("/api/get_user_trips/{user_id}", response_model=List[TripResponse])
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Fetching trips for user_id: {user_id}")
        trips = db.query(Trip).filter(Trip.user_id == user_id).all()
        logger.info(f"Found {len(trips)} trips for user_id: {user_id}")
        if not trips:
            logger.warning(f"No trips found for user_id: {user_id}")
            return []
        return trips
    except Exception as e:
        logger.error(
            f"Error fetching trips for user_id {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.put("/api/update_trip/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip: TripCreate, db: Session = Depends(get_db)):
    db_trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for key, value in trip.model_dump(exclude_unset=True).items():
        setattr(db_trip, key, value)
    if trip.trip_status == "completed":
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == db_trip.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if trip.distance is not None:
            vehicle.mileage += trip.distance  # type: ignore
        trip_user = db.query(User).filter(
            User.user_id == db_trip.user_id).first()
        if trip_user:
            trip_user.vehicle_id = None  # type: ignore
    db.commit()
    db.refresh(db_trip)
    return db_trip


@app.delete("/api/delete_trip/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    try:
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        # unassign the vehicle from the user
        trip_user = db.query(User).filter(
            User.user_id == trip.user_id).first()
        if trip_user:
            trip_user.vehicle_id = None  # type: ignore
        db.delete(trip)
        db.commit()
        return {"message": "Trip deleted successfully"}
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


@app.get("/api/get_all_inspections/", response_model=List[InspectionResponse])
def get_all_inspections(db: Session = Depends(get_db)):
    try:
        logger.info("Fetching all inspections")
        inspections = db.query(Inspection).all()
        logger.info(f"Retrieved {len(inspections)} inspections")
        return inspections
    except Exception as e:
        logger.error(f"Error fetching inspections: {str(e)}", exc_info=True)
        return []


@app.get("/api/inspections/user/{user_id}", response_model=List[InspectionResponse])
def get_user_inspections(user_id: int, db: Session = Depends(get_db)):
    inspections = db.query(Inspection).filter(
        Inspection.user_id == user_id).all()
    if not inspections:
        logger.warning(f"No inspections found for user_id: {user_id}")
        return []
    return inspections


@app.put("/api/inspections/{inspection_id}", response_model=InspectionResponse)
def update_inspection(inspection_id: int, inspection_update: InspectionUpdate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Updating inspection with ID: {inspection_id}")
        inspection = db.query(Inspection).filter(
            Inspection.inspection_id == inspection_id).first()
        if not inspection:
            logger.warning(f"Inspection with ID {inspection_id} not found")
            raise HTTPException(status_code=404, detail="Inspection not found")
        update_data = inspection_update.model_dump(exclude_unset=True)
        logger.debug(
            f"Update data for inspection {inspection_id}: {update_data}")
        for key, value in update_data.items():
            if hasattr(inspection, key):
                setattr(inspection, key, value)
            else:
                logger.warning(
                    f"Ignoring unknown attribute '{key}' for Inspection model")
        db.commit()
        db.refresh(inspection)
        logger.info(f"Inspection with ID {inspection_id} updated")
        return inspection
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating inspection {inspection_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# New DELETE endpoint for inspections


@app.delete("/api/inspections/{inspection_id}")
def delete_inspection(inspection_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Deleting inspection with ID: {inspection_id}")
        inspection = db.query(Inspection).filter(
            Inspection.inspection_id == inspection_id).first()
        if not inspection:
            logger.warning(f"Inspection with ID {inspection_id} not found")
            raise HTTPException(status_code=404, detail="Inspection not found")
        db.delete(inspection)
        db.commit()
        logger.info(f"Inspection with ID {inspection_id} deleted")
        return {"message": "Inspection deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting inspection {inspection_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# New PATCH endpoint for updating signed_by


@app.patch("/api/inspections/{inspection_id}", response_model=InspectionResponse)
def update_inspection_signed_by(inspection_id: int, inspection_update: InspectionSignedByUpdate, db: Session = Depends(get_db)):
    try:
        logger.info(
            f"Updating signed_by for inspection with ID: {inspection_id}")
        inspection = db.query(Inspection).filter(
            Inspection.inspection_id == inspection_id).first()
        if not inspection:
            logger.warning(f"Inspection with ID {inspection_id} not found")
            raise HTTPException(status_code=404, detail="Inspection not found")
        if inspection_update.signed_by is not None:
            inspection.signed_by = inspection_update.signed_by  # type: ignore
        db.commit()
        db.refresh(inspection)
        logger.info(f"Inspection with ID {inspection_id} signed_by updated")
        return inspection
    except Exception as e:
        db.rollback()
        logger.error(
            f"Error updating signed_by for inspection {inspection_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")

# ServiceHistory CRUD Endpoints


@app.post("/api/add_service_history/", response_model=ServiceHistoryResponse)
def create_service_history(service_history: ServiceHistoryCreate, db: Session = Depends(get_db)):
    try:
        vehicle = db.query(Vehicle).filter(
            Vehicle.vin == service_history.vehicle_vin).first()
        if not vehicle:
            raise HTTPException(
                status_code=400, detail=f"Vehicle with VIN {service_history.vehicle_vin} not found")
        db_service_history = ServiceHistory(**service_history.model_dump())
        vehicle.last_service_km = service_history.service_mileage  # type: ignore
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


@app.get("/api/get_all_service_notifications/", response_model=List[ServiceNotificationResponse])
def get_all_service_notifications(db: Session = Depends(get_db)):
    try:
        notifications = db.query(ServiceNotification).all()
        if not notifications:
            raise HTTPException(
                status_code=404, detail="No service notifications found")
        return notifications
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/get_all_service_history/", response_model=List[ServiceHistoryResponse])
def get_all_service_history(db: Session = Depends(get_db)):
    try:
        logger.info("Fetching all service history")
        history = db.query(ServiceHistory).all()
        logger.info(f"Retrieved {len(history)} service history records")
        return history
    except Exception as e:
        logger.error(
            f"Error fetching service history: {str(e)}", exc_info=True)
        return []


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/test_db")
def test_db(db: Session = Depends(get_db)):
    from sqlalchemy.sql import text
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection working"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {str(e)}")
