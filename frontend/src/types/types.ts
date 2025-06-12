// types.ts
export interface UserProfile {
    user_id: number;
    email: string;
    name: string;
    role: 'admin' | 'employee';
    vehicle_id: number | null;
}

export interface Vehicle {
    id: number;
    vin: string;
    year: number;
    make: string;
    model: string;
    licence_plate: string;
    fuel_type: string | null;
    mileage: number;
    last_service_km: number;
    last_service_date: string;
}

export interface Trip {
    trip_id: number;
    user_id: number;
    vehicle_id: number;
    trip_date: string;
    distance: number | null;
    trip_status: 'pending' | 'completed' | 'cancelled';
    fuel_consumed: number | null;
    purpose: string | null;
    start_location: string | null;
    destination: string | null;
}

export enum InspectionStatus {
    good = 'good',
    needs_attention = 'needs_attention',
    moderate = 'moderate',
    excellent = 'excellent',
}

export enum InspectionType {
    pre_trip = 'pre_trip',
    post_trip = 'post_trip',
}

export interface Inspection {
    inspection_id: number;
    user_id: number;
    vehicle_id: number;
    tires: InspectionStatus | null;
    brakes: InspectionStatus | null;
    lights: InspectionStatus | null;
    fluids: InspectionStatus | null;
    mirrors: InspectionStatus | null;
    wipers: InspectionStatus | null;
    battery: InspectionStatus | null;
    body: InspectionStatus | null;
    interior: InspectionStatus | null;
    engine: InspectionStatus | null;
    transmission: InspectionStatus | null;
    suspension: InspectionStatus | null;
    date: string;
    signed_by: string | null;
    type: InspectionType;
}

export interface InspectionResponse {
    inspection_id: number;
    user_id: number;
    vehicle_id: number;
    tires: InspectionStatus | null;
    brakes: InspectionStatus | null;
    lights: InspectionStatus | null;
    fluids: InspectionStatus | null;
    mirrors: InspectionStatus | null;
    wipers: InspectionStatus | null;
    battery: InspectionStatus | null;
    body: InspectionStatus | null;
    interior: InspectionStatus | null;
    engine: InspectionStatus | null;
    transmission: InspectionStatus | null;
    suspension: InspectionStatus | null;
    date: string;
    signed_by: string | null;
    type: InspectionType;
}

export interface VehicleDueForServiceResponse {
    id: number;
    vin: string;
    year: number;
    make: string;
    model: string;
    licence_plate: string;
    mileage: number;
    last_service_km: number;
    last_service_date: string;
    reason: string;
    service_notification: any;
}

export interface ServiceHistory {
    service_id: number;
    vehicle_vin: string;
    service_date: string;
    service_mileage: number;
}