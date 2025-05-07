from datetime import date
import os
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.models import Inspection, Vehicle, User, Trip, ServiceNotification, Role, Status
# from app.routes import vehicles
from app.database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
from app import models
from fpdf import FPDF
from app.schemas import InspectionCreate, InspectionResponse, TripBase, TripResponse, UserCreate, UserResponse, VehicleBase, VehicleCreate, VehicleResponse
from app.emailSender import send_email
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

#E: quick test
@app.get("/test")
async def test():
    return {"message": "Test successful!"}

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

##Todo{Fix the updating of the new miliage after the trip is finished as of now it's not updating the vehicles mileage at all!}
@app.post("/api/log_trip/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        # Create a new trip instance
        db_trip = Trip(**trip.model_dump())
        db.add(db_trip)
        # Fetch vehicle
        db_vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        print("Fetched vehicle:", db_vehicle)
        if db_vehicle is None:
            print("No vehicle found with ID:", trip.vehicle_id)
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if trip.distance is not None:
            print("Trip distance:", trip.distance)
            print("Current vehicle mileage:", db_vehicle.mileage)
            new_mileage = (db_vehicle.mileage or 0) + trip.distance
            print("New calculated mileage:", new_mileage)
            db_vehicle.mileage = new_mileage  # Update mileage
        else:
            print("Trip distance is None")
            raise HTTPException(status_code=400, detail="Trip distance cannot be None")
        # Commit the changes to the database
        db.commit()
        db.refresh(db_trip)  # Refresh the trip object to get the latest state
        print("Trip logged successfully with ID:", db_trip.trip_id)
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


##in regards of the above route it shows the out of service vehicle the one below can possible send the emails to Admin to notify the vehicle is due for a service?
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
#Use case 8 Still being worked on
##This end point might be removed in the future{This route brings up a list of the inspections done of the particular Vehicle ID}
@app.get("/api/inspections/vehicle/{vehicle_id}", response_model=List[InspectionResponse])
def get_inspections_by_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
   return db.query(Inspection).filter(Inspection.vehicle_id == vehicle_id).all()

#Use case 7 Admin finishes inspection the driver "Signs" the form in this case we only use the drivers Name as a signature 
##The pdf is sent to the Admin's email address with details and the attatched signed pdf document,also ads the signed documents in the DB
@app.post("/api/complete_inspection/", response_model=InspectionResponse)
def complete_inspection(inspection: InspectionCreate, db: Session = Depends(get_db)):
    try:
        # Generate the signed PDF path
        signed_pdf_path = generate_signed_pdf(inspection)

        # Create the inspection record
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

        # Fetch all admin users
        admins = db.query(User).filter(User.role == Role.admin).all()
        if not admins:
            return {"message": "No admin users found."}

        # Prepare the email body with inspection details
        body = (
            f"An inspection has been completed.\n\n"
            f"Inspection details:\n"
            f"- Vehicle ID: {inspection.vehicle_id}\n"
            f"- Inspected by user ID: {inspection.user_id}\n"
            f"- Type: {inspection.type}\n"
            f"- Date: {inspection.date}\n"
            f"- Status: {inspection.status}\n"
            f"- Signed by: {inspection.signed_by}\n\n"
            f"Signed inspection PDF is attached."
        )

        subject = "Inspection Completed Notification"

        # Send email with attachment to all admins
        for admin in admins:
            try:
                send_email(
                    admin.email,
                    subject,
                    body,
                    attachment=signed_pdf_path  # Include the signed PDF as an attachment
                )
                print(f"Sent inspection notification email to {admin.email}")
            except Exception as e:
                print(f"Failed to send inspection email to {admin.email}: {str(e)}")

        return db_inspection

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



##This route will retrieve the inspection History of the particular vehicle ID ,sort of the same as the "/api/inspections/vehicle/{vehicle_id}" route above
@app.get("/api/inspections/history/{vehicle_id}", response_model=List[InspectionResponse])
def get_inspections_history(vehicle_id: int, db: Session = Depends(get_db)):
    inspections = db.query(Inspection).filter(Inspection.vehicle_id == vehicle_id).all()
    if not inspections:
        raise HTTPException(status_code=404, detail="No inspections found.")
    return inspections

##Attempt to update vehicles new Mileage sofar this function integrated in a endpoint updates the vehicles mileage but does not when it's called in the create trip if the trip is finished
def update_vehicle_mileage(vehicle_id: int, new_mileage: int, db: Session):
    # Fetch the vehicle from the database
    print(f"Updating mileage for vehicle ID: {vehicle_id} to {new_mileage}")  # Debugging line
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    
    if not vehicle:
        print(f"Vehicle with ID {vehicle_id} not found!")  # Debugging line
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update the mileage
    print(f"Old mileage: {vehicle.mileage}, New mileage: {new_mileage}")  # Debugging line
    vehicle.mileage = new_mileage
    db.commit()  # Commit the changes
    db.refresh(vehicle)  # Refresh to get the updated value
    print(f"Updated mileage: {vehicle.mileage}")  # Debugging line
    
    return vehicle

##Posibly another attempt to add a trip 
##This End point does update the vehicles Mileage in the database at long last It!!
##This end point is almost the same as "@app.post("/api/log_trip/", response_model=TripResponse)""
##This one just apdates the used vehicles mileage in the trip!
@app.post("/api/add_trip/", response_model=TripResponse)
def create_trip(trip: TripBase, db: Session = Depends(get_db)):
    try:
        print(f"Creating trip for vehicle ID: {trip.vehicle_id}, user ID: {trip.user_id}")

        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        user = db.query(User).filter(User.user_id == trip.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if trip.distance is not None:
            print(f"Distance to add: {trip.distance} km")
            new_mileage = vehicle.mileage + trip.distance
            print(f"Updating vehicle mileage from {vehicle.mileage} to {new_mileage}")
            vehicle.mileage = new_mileage
            db.commit()
            db.refresh(vehicle)
            print(f"Vehicle mileage updated to {vehicle.mileage}")

        # Prepare trip data
        trip_data = trip.model_dump()
        trip_data.pop('trip_date', None)
        trip_data['trip_date'] = date.today()  # Set today's date
        trip_data['trip_status'] = Status.completed  # Override status safely

        db_trip = Trip(**trip_data)
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        print(f"Trip created with ID: {db_trip.trip_id}")
        return db_trip

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while creating the trip.")




##Helper method to generate the PDF 
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
