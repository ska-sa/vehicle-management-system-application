from datetime import date, datetime
import os
from typing import List
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import Inspection, Vehicle, User, Trip, ServiceNotification, Role, Status
# from app.routes import vehicles
from app.database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
from app import models
from fpdf import FPDF
from app.schemas import InspectionCreate, InspectionResponse, TripBase, TripResponse, UserCreate, UserResponse, VehicleBase, VehicleCreate, VehicleResponse
from app.emailSender import send_email
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

#E: quick test
@app.get("/test")
async def test():
    return {"message": "Test successful!"}

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


@app.delete("/api/delete_user/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Manually delete related inspections
    db.query(Inspection).filter(Inspection.user_id == user_id).delete()

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

##############################################
#Get available vehicles that are either just came back from the service or is still in there range
@app.get("/api/available_vehicles/", response_model=List[VehicleResponse])
def get_available_vehicles(db: Session = Depends(get_db)):
    try:
        vehicle = db.query(Vehicle).all()
        if not vehicle:
            raise HTTPException(status_code=404,detail="No vehicle found in the database")
        available_vehicles = [v for v in vehicle if not is_service_due(v)]
        return available_vehicles
    except Exception as e:
        raise HTTPException(status_code=500,detail="Database error: "+str(e))

#Helper method to verify the vehicles milage
def is_service_due(vehicle: Vehicle) -> bool:
    try:
        return vehicle.mileage >= vehicle.last_service_km + 10000
    except (TypeError,AttributeError):
        return True

# Get vehicles that are out of service (service is due) this comes from the function above if it is out of service
@app.get("/api/out_of_service_vehicles/", response_model=List[VehicleResponse])
def get_out_of_service_vehicles(db: Session = Depends(get_db)):
    try:
        vehicles = db.query(Vehicle).all()
        if not vehicles:
            raise HTTPException(status_code=404,detail="No vehicles found in the database.")
        
        out_of_service_vehicles = [v for v in vehicles if is_service_due(v)]
        #notify_admins_about_maintenance()
        return out_of_service_vehicles
    except Exception as e:  
        raise HTTPException(status_code=500,detail="Database error: "+str(e))

##in regards of the above route it shows the out of service vehicle the one below can possible send the emails?
@app.post("/api/send_maintenance_notification/")
def notify_admins_about_maintenance(db: Session = Depends(get_db)):
    # Fetch admins and vehicles due for maintenance
    admins = db.query(User).filter(User.role == Role.admin).all()
    vehicles_due = db.query(Vehicle).all()
    
    # Filter the vehicles that are due for service
    due_vehicles = [v for v in vehicles_due if is_service_due(v)]
    
    if not due_vehicles:
        return {"message": "No vehicles due for service"}
    
    print(f"Found {len(admins)} admins and {len(due_vehicles)} vehicles due for maintenance.")
    
    # Send notifications to admins
    for admin in admins:
        body = "Vehicles due for maintenance:\n" + "\n".join(
            [f"{v.make} {v.model} ({v.licence_plate})" for v in due_vehicles]
        )
        send_email(admin.email, "Maintenance Alert", body)
        print(f"Sent email to {admin.email}") 
    
    return {"message": f"Notifications sent to {len(admins)} admins about {len(due_vehicles)} vehicles."}





##############################################
##Still in progress
#Use case 8 Still being worked on
@app.get("/api/inspections/vehicle/{vehicle_id}", response_model=List[InspectionResponse])
def get_inspections_by_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
   return db.query(Inspection).filter(Inspection.vehicle_id == vehicle_id).all()

#Use case 7 Still being worked on
@app.post("/api/complete_inspection/",response_model=InspectionResponse)
def complete_inspection(inspection: InspectionCreate, db: Session = Depends(get_db)):
    try:
        signed_pdf_path = generate_signed_pdf(inspection)

        db_inspection = Inspection(
            vehicle_id=inspection.vehicle_id,
            user_id=inspection.user_id,
            type=inspection.type,
            date=inspection.date,
            signed_by=inspection.signed_by,
            status=inspection.status,
            signed_pdf_path=signed_pdf_path
        )
        db.add(db_inspection)
        db.commit()
        db.refresh(db_inspection)

        return db_inspection
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400,detail=str(e))

##Still being worked on
@app.get("/api/inspections/history/{vehicle_id}", response_model=List[InspectionResponse])
def get_inspections_history(vehicle_id: int, db: Session = Depends(get_db)):
    inspections = db.query(Inspection).filter(Inspection.vehicle_id == vehicle_id).all()
    if not inspections:
        raise HTTPException(status_code=404, detail="No inspections found.")
    return inspections

@app.post("/api/add_trip/", response_model=TripResponse)
def create_trip(trip: TripBase, db: Session = Depends(get_db)):
    try:
        # Ensure that the vehicle and user exist in the database
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        user = db.query(User).filter(User.user_id == trip.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create the trip entry in the database
        db_trip = Trip(
        **trip.model_dump(),
        trip_date=date.today(),  # or datetime.utcnow().date()
        trip_status=Status.completed  # or set based on logic
        )

        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip

    except Exception as e:
        print(f"Error: {e}")  # Log the error to your console or log file
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while creating the trip.")

def generate_signed_pdf(inspection: InspectionCreate) -> str:
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        pdf.cell(200, 10, txt="Vehicle Inspection Report", ln=True, align="C")
        pdf.cell(200, 10, txt=f"Vehicle ID: {inspection.vehicle_id}", ln=True)
        pdf.cell(200, 10, txt=f"User ID: {inspection.user_id}", ln=True)
        pdf.cell(200, 10, txt=f"Type: {inspection.type}", ln=True)
        pdf.cell(200, 10, txt=f"Date: {inspection.date}", ln=True)
        pdf.cell(200, 10, txt=f"Status: {inspection.status}", ln=True)
        pdf.cell(200, 10, txt=f"Signed By: {inspection.signed_by}", ln=True)

        output_dir = "inspections"
        os.makedirs(output_dir, exist_ok=True)

        file_name = f"inspection_{inspection.vehicle_id}_{inspection.date}.pdf"
        file_path = os.path.join(output_dir, file_name)

        pdf.output(file_path)
        print(f"PDF saved at: {file_path}")  # <-- Confirm path

        return file_path
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise