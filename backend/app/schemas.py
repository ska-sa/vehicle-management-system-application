from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# Define the schemas for the API using Pydantic models
# These models will be used for request and response validation

# Define the enums for roles, statuses, and inspection types
# These enums will be used to restrict the values for certain fields in the models

class Role(str, Enum):
    admin = "admin"
    employee = "employee"


class Status(str, Enum):
    completed = "completed"
    cancelled = "cancelled"
    pending = "pending"


class InspectionType(str, Enum):
    pre_trip = "pre_trip"
    post_trip = "post_trip"

# Define the base model for login
# This model will be used for user login requests


class Login(BaseModel):
    role: Role
    email: str
    password: str


# Define the base model for user
# This model will be used for user creation and response

class UserBase(BaseModel):
    name: str
    email: str
    role: Role

# Define the model for user creation
# This model will be used for user creation requests


class UserCreate(UserBase):
    password: str


# Define the model for user response
# This model will be used for user response after creation
class UserResponse(UserBase):
    user_id: int
    name: str
    email: str
    role: str


# Define the model for vehicle
# This model will be used for vehicle creation and response

class VehicleBase(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    licence_plate: str
    fuel_type: Optional[str] = None
    mileage: Optional[int] = 0
    last_service_date: date
    last_service_km: int


# Define the model for vehicle creation
# This model will be used for vehicle creation requests
class VehicleCreate(VehicleBase):
    pass


# Define the model for vehicle response
# This model will be used for vehicle response after creation
class VehicleResponse(VehicleBase):
    id: int


# Define the model for trip
# This model will be used for trip creation requests
class TripBase(BaseModel):
    vehicle_id: int
    user_id: int
    start_location: str
    destination: str
    purpose: Optional[str] = None
    trip_date: date
    distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    trip_status: Status


class TripCreate(TripBase):
    pass


class TripResponse(TripBase):
    trip_id: int
    user_id: int
    trip_date: date
    trip_status: Status
    status: Status = Field(..., alias="trip_status")


class ServiceNotificationBase(BaseModel):
    vehicle_id: int
    service_date: date


class ServiceNotificationResponse(ServiceNotificationBase):
    notification_id: int
    notified: bool


class InspectionBase(BaseModel):
    vehicle_id: int
    user_id: int
    type: InspectionType
    date: date
    signed_by: str
    status: Status


class InspectionCreate(BaseModel):
    vehicle_id: int
    user_id: int
    type: str
    date: date
    signed_by: str
    status: str

class InspectionResponse(InspectionBase):
    inspection_id: int
    date: date


class ServiceHistoryBase(BaseModel):
    vehicle_vin: str
    service_date: date
    mileage: int


class ServiceHistoryCreate(ServiceHistoryBase):
    pass


class ServiceHistoryResponse(ServiceHistoryBase):
    service_id: int
    vehicle_vin: int
    service_date: date
    mileage: int

# model for user's trip


class TripWithVehicle(BaseModel):
    trip_id: int
    start_location: str
    destination: str
    purpose: Optional[str] = None
    trip_date: date
    distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    trip_status: Status

    # Embedded vehicle info
    vehicle_id: int
    vehicle_vin: str
    vehicle_make: str
    vehicle_model: str
