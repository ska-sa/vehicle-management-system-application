import os
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.models import Vehicle, User, Trip, ServiceNotification, Role, Status
# from app.routes import vehicles
from app.database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
from app import models
from app.schemas import TripCreate, TripWithVehicle, UserCreate, UserResponse, VehicleBase, VehicleCreate, VehicleResponse, TripResponse, ServiceNotificationBase, ServiceNotificationResponse, Login, TripBase

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


# login route
@app.post("/api/login/", response_model=UserResponse)
def login(user: Login, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.email == user.email,
        User.hashed_password == user.password,
        User.role == user.role
    ).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return db_user

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

# update user in database


@app.put("/api/update_user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        db.query(User).filter(User.user_id == user_id).update({
            User.name: user.name,
            User.email: user.email,
            User.hashed_password: user.password,
            User.role: user.role
        })

        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/get_all_users/", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users


# delete user from database


@app.delete("/api/delete_user/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# get trip details of user


@app.get("/api/get_user_trips/{user_id}", response_model=list[TripWithVehicle])
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    # Join Trip with Vehicle to reduce queries
    trips_with_vehicles = (
        db.query(Trip, Vehicle)
        .join(Vehicle, Trip.vehicle_id == Vehicle.id)
        .filter(Trip.user_id == user_id)
        .all()
    )

    if not trips_with_vehicles:
        raise HTTPException(
            status_code=404, detail="No trips found for this user")

    # Format the response
    trip_details = [
        TripWithVehicle(
            trip_id=trip.trip_id,
            start_location=trip.start_location,
            destination=trip.destination,
            purpose=trip.purpose,
            trip_date=trip.trip_date,
            distance=trip.distance,
            fuel_consumed=trip.fuel_consumed,
            trip_status=trip.trip_status,
            vehicle_id=vehicle.id,
            vehicle_vin=vehicle.vin,
            vehicle_make=vehicle.make,
            vehicle_model=vehicle.model,
        )
        for trip, vehicle in trips_with_vehicles
    ]

    return trip_details


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

# get all vehicles from database


@app.get("/api/get_all_vehicles/", response_model=list[VehicleResponse])
def get_all_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    if not vehicles:
        raise HTTPException(status_code=404, detail="No vehicles found")
    return vehicles


# get vehicles based on filter

@app.get("/api/get_vehicles_with_filter", response_model=List[VehicleResponse])
def get_vehicles(
    make: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    licence_plate: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make == make)
    if model:
        query = query.filter(Vehicle.model == model)
    if licence_plate:
        query = query.filter(Vehicle.licence_plate == licence_plate)

    vehicles = query.all()

    if not vehicles:
        raise HTTPException(status_code=404, detail="No vehicles found")

    return vehicles

# update vehicle in database


@app.put("/api/update_vehicle/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle: VehicleBase, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    try:
        db.query(Vehicle).filter(Vehicle.id == vehicle_id).update({
            Vehicle.vin: vehicle.vin,
            Vehicle.make: vehicle.make,
            Vehicle.model: vehicle.model,
            Vehicle.year: vehicle.year,
            Vehicle.licence_plate: vehicle.licence_plate,
            Vehicle.fuel_type: vehicle.fuel_type,
            Vehicle.mileage: vehicle.mileage,
            Vehicle.last_service_date: vehicle.last_service_date,
            Vehicle.last_service_km: vehicle.last_service_km
        })

        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# delete vehicle from database


@app.delete("/api/delete_vehicle/{vehicle_id}", response_model=VehicleResponse)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully"}

# Trip CRUD operations and routes

# add trip to database


@app.post("/api/log_trip/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        db_trip = Trip(**trip.model_dump())

        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip
    except Exception as e:
        print("Error in create_trip:", str(e))
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# get trip from database


@app.get("/api/get_trip/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

# get all trips from database


@app.get("/api/get_all_trips/", response_model=list[TripResponse])
def get_all_trips(db: Session = Depends(get_db)):
    try:
        trips = db.query(Trip).all()
        if not trips:
            raise HTTPException(status_code=404, detail="No trips found")
        return trips
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# update trip in database


@app.put("/api/update_trip/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip: TripBase, db: Session = Depends(get_db)):
    db_trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        db.query(Trip).filter(Trip.trip_id == trip_id).update({
            Trip.vehicle_id: trip.vehicle_id,
            Trip.trip_date: trip.trip_date,
            Trip.user_id: trip.user_id,
            Trip.start_location: trip.start_location,
            Trip.destination: trip.destination,
            Trip.purpose: trip.purpose,
            Trip.distance: trip.distance,
            Trip.fuel_consumed: trip.fuel_consumed,
            Trip.trip_status: trip.trip_status
        })

        db.commit()
        db.refresh(db_trip)
        return db_trip
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# delete trip from database


@app.delete("/api/delete_trip/{trip_id}", response_model=TripResponse)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}


print("!!! CURRENT DATABASE_URL:", os.getenv("DATABASE_URL"))


@app.get("/api/test_db")
def test_db(db: Session = Depends(get_db)):
    try:
        # Simple test query
        from sqlalchemy.sql import text
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection working"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )
