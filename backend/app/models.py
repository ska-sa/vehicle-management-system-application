from .database import Base
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from typing import Optional

# Vehicle Model


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

    # Relationships
    trips = relationship("Trip", back_populates="vehicle")
    service_notifications = relationship(
        "ServiceNotification", back_populates="vehicle")
    inspections = relationship("Inspection", back_populates="vehicle")
    service_histories = relationship(
        "ServiceHistory", back_populates="vehicle")
    # Fixed to plural "users"
    users = relationship("User", back_populates="vehicle")

# Role Enum


class Role(str, Enum):
    admin = "admin"
    employee = "employee"

# User Model


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(Role))
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"),
                        index=True)  # Fixed to "vehicle_id"

    # Relationships
    trips = relationship("Trip", back_populates="user")
    inspections = relationship("Inspection", back_populates="user")
    vehicle = relationship("Vehicle", back_populates="users")

# Status Enum for Trip


class Status(str, Enum):
    completed = "completed"
    cancelled = "cancelled"
    pending = "pending"

# Trip Model


class Trip(Base):
    __tablename__ = "trip"

    trip_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    start_location = Column(String)
    destination = Column(String)
    purpose = Column(String, nullable=True)
    trip_date = Column(Date)
    distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)
    trip_status = Column(SQLEnum(Status), nullable=True, default='pending')

    # Relationships
    vehicle = relationship("Vehicle", back_populates="trips")
    user = relationship("User", back_populates="trips")

# ServiceNotification Model


class ServiceNotification(Base):
    __tablename__ = "ServiceNotification"
    notification_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    service_date = Column(Date)
    notified = Column(Boolean, default=False)

    # Relationship
    vehicle = relationship("Vehicle", back_populates="service_notifications")

# InspectionType Enum


class InspectionType(str, Enum):
    pre_trip = "pre_trip"
    post_trip = "post_trip"

# Inspection Model


class Inspection(Base):
    __tablename__ = "Inspection"
    inspection_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    type = Column(SQLEnum(InspectionType))
    date = Column(Date)
    signed_by = Column(String)
    status = Column(SQLEnum(Status))

    # Relationships
    vehicle = relationship("Vehicle", back_populates="inspections")
    user = relationship("User", back_populates="inspections")

# ServiceHistory Model


class ServiceHistory(Base):
    __tablename__ = "ServiceHistory"
    service_id = Column(Integer, primary_key=True, index=True)
    vehicle_vin = Column(Integer, ForeignKey("vehicle.id"), index=True)
    service_date = Column(Date)
    service_mileage = Column(Integer)

    # Relationship
    vehicle = relationship("Vehicle", back_populates="service_histories")
