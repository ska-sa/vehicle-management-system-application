export interface Vehicle {
    id: number;
    vin: string;
    make: string;
    model: string;
    year: number;
    licence_plate: string;
    fuel_type: string;
    mileage: number;
    last_service_date: string;
    last_service_km: number;
}

export interface Trip {
    trip_id: number;
    vehicle_id: number;
    user_id: number;
    start_location: string;
    destination: string;
    purpose: string | null;
    trip_date: string;
    distance: number | null;
    fuel_consumed: number | null;
    trip_status: string | null;
}

export interface Inspection {
    inspection_id: number;
    vehicle_id: number;
    user_id: number;
    type: string;
    date: string;
    signed_by: string;
    status: string;
}

export interface User {
    user_id: number;
    name: string;
    email: string;
    role: string;
    vehicle_id: number | null;
}