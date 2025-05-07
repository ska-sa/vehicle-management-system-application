from .database import Base
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from typing import Optional
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

class Vehicle(Base):
    __tablename__ = "vehicle"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    licence_plate = Column(String, unique=True, index=True)
    fuel_type = Column(String, nullable=True)
    mileage = Column(Integer, nullable=False, default=0)
    last_service_date = Column(Date, nullable=False)
    last_service_km = Column(Integer, nullable=False)

    # Relationship with inspections
    inspections = relationship("Inspection", back_populates="vehicle")

# enum class for user role


class Role(str, Enum):
    admin = "admin"
    employee = "employee"


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(Role))

    # Relationship with inspections
    inspections = relationship("Inspection", back_populates="user")


# enum class for trip status
class Status(str, Enum):
    completed = "completed"
    cancelled = "cancelled"
    pending = "pending"


class Trip(Base):
    __tablename__ = "trip"

    trip_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    start_location = Column(String)
    destination = Column(String)
    purpose = Column(String, nullable=True)
    trip_date = Column(Date)
    distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)
    trip_status = Column(SQLEnum(Status, name="status"),
                         nullable=False, default="pending")
    vehicle = relationship("Vehicle")


class ServiceNotification(Base):
    __tablename__ = "ServiceNotification"
    notification_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    service_date = Column(Date)
    notified = Column(Boolean, default=False)


# enum class for inspection type
class InspectionType(str, Enum):
    pre_trip = "pre_trip"
    post_trip = "post_trip"

class Inspection(Base):
    __tablename__ = "Inspection"

    inspection_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    type = Column(SQLEnum(InspectionType))
    date = Column(Date)
    signed_by = Column(String)
    status = Column(SQLEnum(Status))
    vehicle = relationship("Vehicle", back_populates="inspections")
    user = relationship("User", back_populates="inspections")

    signed_pdf_path = Column(String, nullable=True)

class ServiceHistory(Base):
    __tablename__ = "ServiceHistory"
    service_id = Column(Integer, primary_key=True, index=True)
    vehicle_vin = Column(String, ForeignKey("vehicle.vin"), index=True)
    service_date = Column(Date)
    service_mileage = Column(Integer)
