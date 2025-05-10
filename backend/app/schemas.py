from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional, List
from datetime import date

# Role Enum


class Role(str, Enum):
    admin = "admin"
    employee = "employee"

# Status Enum for Trip


class Status(str, Enum):
    completed = "completed"
    cancelled = "cancelled"
    pending = "pending"

# InspectionType Enum


class InspectionType(str, Enum):
    pre_trip = "pre_trip"
    post_trip = "post_trip"

# Vehicle Schemas


class VehicleBase(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    licence_plate: str
    fuel_type: Optional[str] = None
    mileage: int = 0
    last_service_date: date
    last_service_km: int


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True

# User Schemas


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Role
    vehicle_id: Optional[int] = None


class UserCreate(UserBase):
    password: str  # Note: We're using plain text passwords as per your request


class UserResponse(UserBase):
    user_id: int
    vehicle: Optional[VehicleResponse] = None

    class Config:
        from_attributes = True
        use_enum_values = True

# Trip Schemas


class TripBase(BaseModel):
    vehicle_id: int
    user_id: int
    start_location: str
    destination: str
    purpose: Optional[str] = None
    trip_date: date
    distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    trip_status: Optional[Status] = None


class TripCreate(TripBase):
    pass


class TripResponse(TripBase):
    trip_id: int

    class Config:
        from_attributes = True
        use_enum_values = True

# ServiceNotification Schemas


class ServiceNotificationBase(BaseModel):
    vehicle_id: int
    service_date: date
    notified: bool = False


class ServiceNotificationCreate(ServiceNotificationBase):
    pass


class ServiceNotificationResponse(ServiceNotificationBase):
    notification_id: int

    class Config:
        from_attributes = True

# Inspection Schemas


class InspectionBase(BaseModel):
    vehicle_id: int
    user_id: int
    type: InspectionType
    date: date
    signed_by: str
    status: Status


class InspectionCreate(InspectionBase):
    pass


class InspectionResponse(InspectionBase):
    inspection_id: int

    class Config:
        from_attributes = True
        use_enum_values = True

# ServiceHistory Schemas


class ServiceHistoryBase(BaseModel):
    vehicle_vin: int
    service_date: date
    service_mileage: int


class ServiceHistoryCreate(ServiceHistoryBase):
    pass


class ServiceHistoryResponse(ServiceHistoryBase):
    service_id: int

    class Config:
        from_attributes = True

# Schema for login


class Login(BaseModel):
    email: EmailStr
    password: str
    role: Role
