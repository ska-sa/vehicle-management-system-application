from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Role(str, Enum):
    admin = "admin"
    employee = "employee"


class Status(str, Enum):
    completed = "completed"
    cancelled = "cancelled"


class InspectionType(str, Enum):
    pre_trip = "pre_trip"
    post_trip = "post_trip"


class UserBase(BaseModel):
    name: str
    email: str
    role: Role


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    user_id: int
    name: str
    email: str
    role: str


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


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int


class TripBase(BaseModel):
    vehicle_id: int
    user_id: int
    start_location: str
    destination: str
    purpose: Optional[str] = None
    distance: Optional[float] = None
    fuel_consumed: Optional[float] = None


class TripResponse(TripBase):
    trip_id: int
    trip_date: date
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
    vehicle_vin: int
    service_date: date
    mileage: int


class ServiceHistoryCreate(ServiceHistoryBase):
    pass


class ServiceHistoryResponse(ServiceHistoryBase):
    service_id: int
    vehicle_vin: int
    service_date: date
    mileage: int
