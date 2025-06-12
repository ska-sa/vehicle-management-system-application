import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    CircularProgress, Alert, IconButton, Tabs, Tab, Select, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import {
    UserProfile, Vehicle, Trip, Inspection, ServiceHistory,
    VehicleDueForServiceResponse, InspectionStatus, InspectionType
} from '../types/types';

interface AdminDashboardProps {
    user: UserProfile | null;
    token: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, token }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('trips');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [dueForService, setDueForService] = useState<VehicleDueForServiceResponse[]>([]);
    const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
    const [openTripDialog, setOpenTripDialog] = useState(false);
    const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
    const [openServiceDialog, setOpenServiceDialog] = useState(false);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
    const [openProfileDialog, setOpenProfileDialog] = useState(false);
    const [editTrip, setEditTrip] = useState<Trip | null>(null);
    const [editInspection, setEditInspection] = useState<Inspection | null>(null);
    const [editUser, setEditUser] = useState<UserProfile | null>(null);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');

    // Initialize form states with minimal defaults
    const [newTrip, setNewTrip] = useState({
        user_id: 0,
        vehicle_id: 0,
        trip_date: new Date().toISOString().split('T')[0],
        distance: null as number | null,
        trip_status: 'pending' as 'pending' | 'completed' | 'cancelled',
        fuel_consumed: null as number | null,
        purpose: '',
        start_location: '',
        destination: '',
    });

    const [newInspection, setNewInspection] = useState({
        vehicle_id: 0,
        user_id: 0,
        employee_id: 0,
        tires: InspectionStatus.good as InspectionStatus,
        brakes: InspectionStatus.good as InspectionStatus,
        lights: InspectionStatus.good as InspectionStatus,
        fluids: InspectionStatus.good as InspectionStatus,
        mirrors: InspectionStatus.good as InspectionStatus,
        wipers: InspectionStatus.good as InspectionStatus,
        battery: InspectionStatus.good as InspectionStatus,
        body: InspectionStatus.good as InspectionStatus,
        interior: InspectionStatus.good as InspectionStatus,
        engine: InspectionStatus.good as InspectionStatus,
        transmission: InspectionStatus.good as InspectionStatus,
        suspension: InspectionStatus.good as InspectionStatus,
        date: new Date().toISOString().split('T')[0],
        signed_by: '',
        type: InspectionType.pre_trip as InspectionType,
    });

    const [newService, setNewService] = useState({
        vehicle_vin: '',
        service_date: new Date().toISOString().split('T')[0],
        service_mileage: 0,
    });

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee' as 'admin' | 'employee',
        vehicle_id: null as number | null,
    });

    const [newVehicle, setNewVehicle] = useState({
        make: '',
        model: '',
        licence_plate: '',
        vin: '',
        mileage: 0,
        year: new Date().getFullYear(),
        fuel_type: null as string | null,
        last_service_km: 0,
        last_service_date: new Date().toISOString().split('T')[0],
    });

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
    });

    // Fetch data
    useEffect(() => {
        if (!user?.user_id || !token || user.role !== 'admin') {
            navigate('/');
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const baseUrl = 'http://localhost:8000';

                const endpoints = [
                    { name: 'All vehicles', url: '/api/get_all_vehicles/', setter: setVehicles },
                    { name: 'Available vehicles', url: '/api/get_available_vehicles/', setter: setAvailableVehicles },
                    { name: 'All users', url: '/api/get_all_users/', setter: setUsers },
                    { name: 'Available users', url: '/api/get_available_users/', setter: setAvailableUsers },
                    { name: 'Trips', url: '/api/get_all_trips/', setter: setTrips },
                    { name: 'Inspections', url: '/api/get_all_inspections/', setter: setInspections },
                    { name: 'Due for service', url: '/api/vehicles/due_for_service/', setter: setDueForService },
                    { name: 'Service history', url: '/api/get_all_service_history/', setter: setServiceHistory }
                ];

                const results = await Promise.allSettled(
                    endpoints.map(async ({ name, url, setter }) => {
                        const res = await axios.get(`${baseUrl}${url}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        return { name, status: 'fulfilled', data: res.data };
                    })
                );

                if (!isMounted) return;

                // Batch error collection
                const errors: string[] = [];
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        endpoints[index].setter(result.value.data || []);
                    } else {
                        endpoints[index].setter([]);
                        errors.push(`${endpoints[index].name} failed: ${result.reason.message}`);
                    }
                });

                if (errors.length > 0) {
                    setError(errors.join(', '));
                }

            } catch (err: any) {
                if (isMounted) {
                    setError(`Unexpected error: ${err.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [token, navigate, user?.user_id, user?.role]);

    // Memoize filtered vehicles
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle =>
            vehicle.make.toLowerCase().includes(filterQuery.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
            vehicle.licence_plate.toLowerCase().includes(filterQuery.toLowerCase())
        );
    }, [vehicles, filterQuery]);

    // Helper to open Trip dialog with defaults
    const handleOpenTripDialog = (trip?: Trip) => {
        if (trip) {
            setEditTrip(trip);
            setNewTrip({
                ...trip,
                distance: trip.distance || null,
                fuel_consumed: trip.fuel_consumed || null,
                purpose: trip.purpose || '',
                start_location: trip.start_location || '',
                destination: trip.destination || ''
            });
        } else {
            setEditTrip(null);
            setNewTrip({
                user_id: availableUsers[0]?.user_id || 0,
                vehicle_id: availableVehicles[0]?.id || 0,
                trip_date: new Date().toISOString().split('T')[0],
                distance: null,
                trip_status: 'pending',
                fuel_consumed: null,
                purpose: '',
                start_location: '',
                destination: '',
            });
        }
        setOpenTripDialog(true);
    };

    // Helper to open Inspection dialog with defaults
    const handleOpenInspectionDialog = (inspection?: Inspection) => {
        if (inspection) {
            setEditInspection(inspection);
            setNewInspection({
                ...inspection,
                user_id: inspection.user_id,
                employee_id: inspection.user_id,
                signed_by: inspection.signed_by ?? '',
                tires: inspection.tires ?? InspectionStatus.good,
                brakes: inspection.brakes ?? InspectionStatus.good,
                lights: inspection.lights ?? InspectionStatus.good,
                fluids: inspection.fluids ?? InspectionStatus.good,
                mirrors: inspection.mirrors ?? InspectionStatus.good,
                wipers: inspection.wipers ?? InspectionStatus.good,
                battery: inspection.battery ?? InspectionStatus.good,
                body: inspection.body ?? InspectionStatus.good,
                interior: inspection.interior ?? InspectionStatus.good,
                engine: inspection.engine ?? InspectionStatus.good,
                transmission: inspection.transmission ?? InspectionStatus.good,
                suspension: inspection.suspension ?? InspectionStatus.good,
            });
        } else {
            setEditInspection(null);
            setNewInspection({
                vehicle_id: availableVehicles[0]?.id || 0,
                user_id: availableUsers[0]?.user_id || 0,
                employee_id: availableUsers[0]?.user_id || 0,
                tires: InspectionStatus.good,
                brakes: InspectionStatus.good,
                lights: InspectionStatus.good,
                fluids: InspectionStatus.good,
                mirrors: InspectionStatus.good,
                wipers: InspectionStatus.good,
                battery: InspectionStatus.good,
                body: InspectionStatus.good,
                interior: InspectionStatus.good,
                engine: InspectionStatus.good,
                transmission: InspectionStatus.good,
                suspension: InspectionStatus.good,
                date: new Date().toISOString().split('T')[0],
                signed_by: '',
                type: InspectionType.pre_trip,
            });
        }
        setOpenInspectionDialog(true);
    };

    // Helper to open Service dialog with defaults
    const handleOpenServiceDialog = () => {
        setNewService({
            vehicle_vin: vehicles[0]?.vin || '',
            service_date: new Date().toISOString().split('T')[0],
            service_mileage: 0,
        });
        setOpenServiceDialog(true);
    };

    const handleTripSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            const payload = {
                ...newTrip,
                distance: newTrip.distance || null,
                fuel_consumed: newTrip.fuel_consumed || null,
                purpose: newTrip.purpose || null,
                start_location: newTrip.start_location || null,
                destination: newTrip.destination || null
            };
            if (editTrip) {
                await axios.put(`${baseUrl}/api/update_trip/${editTrip.trip_id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${baseUrl}/api/add_trip/`, payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            const tripsRes = await axios.get(`${baseUrl}/api/get_all_trips/`, { headers: { Authorization: `Bearer ${token}` } });
            setTrips(tripsRes.data);
            setOpenTripDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save trip');
        }
    };

    const handleInspectionSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            const payload = { ...newInspection, employee_id: newInspection.user_id };
            if (editInspection) {
                await axios.put(`${baseUrl}/api/inspections/${editInspection.inspection_id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${baseUrl}/api/add_inspection/`, payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            const inspectionsRes = await axios.get(`${baseUrl}/api/get_all_inspections/`, { headers: { Authorization: `Bearer ${token}` } });
            setInspections(inspectionsRes.data);
            setOpenInspectionDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save inspection');
        }
    };

    const handleServiceSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            await axios.post(`${baseUrl}/api/add_service_history/`, newService, { headers: { Authorization: `Bearer ${token}` } });
            const historyRes = await axios.get(`${baseUrl}/api/get_all_service_history/`, { headers: { Authorization: `Bearer ${token}` } });
            setServiceHistory(historyRes.data);
            setOpenServiceDialog(false);
        } catch (err: any) {
            if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
                const errorMessages = err.response.data.detail.map((e: any) => e.msg).join(', ');
                setError(errorMessages || 'Failed to save service record');
            } else {
                setError(err.response?.data?.detail || 'Failed to save service record');
            }
        }
    };

    const handleUserSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            if (editUser) {
                await axios.put(`${baseUrl}/api/update_user/${editUser.user_id}`, newUser, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${baseUrl}/api/add_user/`, newUser, { headers: { Authorization: `Bearer ${token}` } });
            }
            const usersRes = await axios.get(`${baseUrl}/api/get_all_users/`, { headers: { Authorization: `Bearer ${token}` } });
            const availableUsersRes = await axios.get(`${baseUrl}/api/get_available_users/`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(usersRes.data);
            setAvailableUsers(availableUsersRes.data);
            setOpenUserDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save user');
        }
    };

    const handleVehicleSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            if (editVehicle) {
                await axios.put(`${baseUrl}/api/update_vehicle/${editVehicle.id}`, newVehicle, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${baseUrl}/api/add_vehicle/`, newVehicle, { headers: { Authorization: `Bearer ${token}` } });
            }
            const vehiclesRes = await axios.get(`${baseUrl}/api/get_all_vehicles/`, { headers: { Authorization: `Bearer ${token}` } });
            const availableVehiclesRes = await axios.get(`${baseUrl}/api/get_available_vehicles/`, { headers: { Authorization: `Bearer ${token}` } });
            setVehicles(vehiclesRes.data);
            setAvailableVehicles(availableVehiclesRes.data);
            setOpenVehicleDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save vehicle');
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const baseUrl = 'http://localhost:8000';
            await axios.put(`${baseUrl}/api/update_user/${user?.user_id}`, profileData, { headers: { Authorization: `Bearer ${token}` } });
            setOpenProfileDialog(false);
            const updatedUser = { ...user, name: profileData.name, email: profileData.email };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Admin Dashboard</Typography>
                <Box>
                    <Button onClick={() => setOpenProfileDialog(true)} sx={{ mr: 2 }}>My Profile</Button>
                    <Button variant="contained" color="secondary" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}>
                        Logout
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Trips" value="trips" />
                <Tab label="Inspections" value="inspections" />
                <Tab label="Users" value="users" />
                <Tab label="Vehicles" value="vehicles" />
                <Tab label="Vehicles Due for Service" value="due" />
                <Tab label="Service History" value="history" />
            </Tabs>

            {activeTab === 'trips' && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Trips</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenTripDialog()}>Add Trip</Button>
                    </Box>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Vehicle</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trips.map((trip) => (
                                <TableRow key={trip.trip_id}>
                                    <TableCell>{trip.trip_id}</TableCell>
                                    <TableCell>{users.find(u => u.user_id === trip.user_id)?.name || 'Unknown'}</TableCell>
                                    <TableCell>{vehicles.find(v => v.id === trip.vehicle_id)?.make} {vehicles.find(v => v.id === trip.vehicle_id)?.model}</TableCell>
                                    <TableCell>{trip.trip_date}</TableCell>
                                    <TableCell>{trip.trip_status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenTripDialog(trip)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton color="error" onClick={async () => {
                                            try {
                                                const baseUrl = 'http://localhost:8000';
                                                await axios.delete(`${baseUrl}/api/delete_trip/${trip.trip_id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                setTrips(trips.filter(t => t.trip_id !== trip.trip_id));
                                            } catch (err: any) {
                                                setError(err.response?.data?.detail || 'Failed to delete trip');
                                            }
                                        }}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}

            {activeTab === 'inspections' && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Inspections</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenInspectionDialog()}>Add Inspection</Button>
                    </Box>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Employee</TableCell>
                                <TableCell>Vehicle</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Signed By</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inspections.map((inspection) => (
                                <TableRow key={inspection.inspection_id}>
                                    <TableCell>{inspection.inspection_id}</TableCell>
                                    <TableCell>{users.find(u => u.user_id === inspection.user_id)?.name || 'Unknown'}</TableCell>
                                    <TableCell>{vehicles.find(v => v.id === inspection.vehicle_id)?.make} {vehicles.find(v => v.id === inspection.vehicle_id)?.model}</TableCell>
                                    <TableCell>{inspection.date}</TableCell>
                                    <TableCell>{inspection.type}</TableCell>
                                    <TableCell>{inspection.signed_by || 'Not signed'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenInspectionDialog(inspection)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton color="error" onClick={async () => {
                                            try {
                                                const baseUrl = 'http://localhost:8000';
                                                await axios.delete(`${baseUrl}/api/inspections/${inspection.inspection_id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                setInspections(inspections.filter(i => i.inspection_id !== inspection.inspection_id));
                                            } catch (err: any) {
                                                setError(err.response?.data?.detail || 'Failed to delete inspection');
                                            }
                                        }}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}

            {activeTab === 'users' && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Users</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditUser(null); setNewUser({ name: '', email: '', password: '', role: 'employee', vehicle_id: null }); setOpenUserDialog(true); }}>
                            Add User
                        </Button>
                    </Box>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Assigned Vehicle</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No users found</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.user_id}>
                                        <TableCell>{user.user_id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.vehicle_id ? vehicles.find(v => v.id === user.vehicle_id)?.make + ' ' + vehicles.find(v => v.id === user.vehicle_id)?.model : 'None'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => { setEditUser(user); setNewUser({ name: user.name, email: user.email, password: '', role: user.role, vehicle_id: user.vehicle_id }); setOpenUserDialog(true); }}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton color="error" onClick={async () => {
                                                try {
                                                    const baseUrl = 'http://localhost:8000';
                                                    await axios.delete(`${baseUrl}/api/delete_user/${user.user_id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                    setUsers(users.filter(u => u.user_id !== user.user_id));
                                                    setAvailableUsers(availableUsers.filter(u => u.user_id !== user.user_id));
                                                } catch (err: any) {
                                                    setError(err.response?.data?.detail || 'Failed to delete user');
                                                }
                                            }}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
            )
            }

            {
                activeTab === 'vehicles' && (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Vehicles</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TextField
                                    label="Search Vehicles"
                                    value={filterQuery}
                                    onChange={(e) => setFilterQuery(e.target.value)}
                                    placeholder="Search by make, model, or license plate"
                                    sx={{ width: 300 }}
                                />
                                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditVehicle(null); setNewVehicle({ make: '', model: '', licence_plate: '', vin: '', mileage: 0, year: new Date().getFullYear(), fuel_type: null, last_service_km: 0, last_service_date: new Date().toISOString().split('T')[0] }); setOpenVehicleDialog(true); }}>
                                    Add Vehicle
                                </Button>
                            </Box>
                        </Box>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Make</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell>License Plate</TableCell>
                                    <TableCell>VIN</TableCell>
                                    <TableCell>Mileage</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredVehicles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">No vehicles found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVehicles.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell>{vehicle.id}</TableCell>
                                            <TableCell>{vehicle.make}</TableCell>
                                            <TableCell>{vehicle.model}</TableCell>
                                            <TableCell>{vehicle.licence_plate}</TableCell>
                                            <TableCell>{vehicle.vin}</TableCell>
                                            <TableCell>{vehicle.mileage}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => { setEditVehicle(vehicle); setNewVehicle({ make: vehicle.make, model: vehicle.model, licence_plate: vehicle.licence_plate, vin: vehicle.vin, mileage: vehicle.mileage, year: vehicle.year, fuel_type: vehicle.fuel_type, last_service_km: vehicle.last_service_km, last_service_date: vehicle.last_service_date }); setOpenVehicleDialog(true); }}>
                                                    <Edit />
                                                </IconButton>
                                                <IconButton color="error" onClick={async () => {
                                                    try {
                                                        const baseUrl = 'http://localhost:8000';
                                                        await axios.delete(`${baseUrl}/api/delete_vehicle/${vehicle.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                        setVehicles(vehicles.filter(v => v.id !== vehicle.id));
                                                        setAvailableVehicles(availableVehicles.filter(v => v.id !== vehicle.id));
                                                    } catch (err: any) {
                                                        setError(err.response?.data?.detail || 'Failed to delete vehicle');
                                                    }
                                                }}>
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                )
            }

            {
                activeTab === 'due' && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Vehicles Due for Service</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehicle</TableCell>
                                    <TableCell>License Plate</TableCell>
                                    <TableCell>Mileage</TableCell>
                                    <TableCell>Last Service</TableCell>
                                    <TableCell>Reason</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dueForService.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                                        <TableCell>{vehicle.licence_plate}</TableCell>
                                        <TableCell>{vehicle.mileage}</TableCell>
                                        <TableCell>{vehicle.last_service_date}</TableCell>
                                        <TableCell>{vehicle.reason}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )
            }

            {
                activeTab === 'history' && (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Service History</Typography>
                            <Button variant="contained" startIcon={<Add />} onClick={handleOpenServiceDialog}>Add Service Record</Button>
                        </Box>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehicle</TableCell>
                                    <TableCell>Service Date</TableCell>
                                    <TableCell>Mileage</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {serviceHistory.map((service) => (
                                    <TableRow key={service.service_id}>
                                        <TableCell>{vehicles.find(v => v.vin === service.vehicle_vin)?.make} {vehicles.find(v => v.vin === service.vehicle_vin)?.model}</TableCell>
                                        <TableCell>{service.service_date}</TableCell>
                                        <TableCell>{service.service_mileage}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )
            }

            {/* Trip Dialog */}
            <Dialog open={openTripDialog} onClose={() => setOpenTripDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Employee *</InputLabel>
                        <Select name="user_id" value={newTrip.user_id} onChange={(e) => setNewTrip({ ...newTrip, user_id: Number(e.target.value) })} label="Employee *" required>
                            {availableUsers.map(user => (
                                <MenuItem key={user.user_id} value={user.user_id}>{user.name} ({user.email})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Vehicle *</InputLabel>
                        <Select name="vehicle_id" value={newTrip.vehicle_id} onChange={(e) => setNewTrip({ ...newTrip, vehicle_id: Number(e.target.value) })} label="Vehicle *" required>
                            {availableVehicles.map(vehicle => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} ({vehicle.licence_plate})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Trip Date" name="trip_date" type="date" value={newTrip.trip_date} onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                    <TextField label="Start Location" name="start_location" value={newTrip.start_location} onChange={(e) => setNewTrip({ ...newTrip, start_location: e.target.value })} fullWidth margin="normal" />
                    <TextField label="Destination" name="destination" value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} fullWidth margin="normal" />
                    <TextField label="Purpose" name="purpose" value={newTrip.purpose} onChange={(e) => setNewTrip({ ...newTrip, purpose: e.target.value })} fullWidth margin="normal" />
                    <TextField label="Distance (km)" name="distance" type="number" value={newTrip.distance || ''} onChange={(e) => setNewTrip({ ...newTrip, distance: e.target.value ? Number(e.target.value) : null })} fullWidth margin="normal" />
                    <TextField label="Fuel Consumed (L)" name="fuel_consumed" type="number" inputProps={{ step: "0.1" }} value={newTrip.fuel_consumed || ''} onChange={(e) => setNewTrip({ ...newTrip, fuel_consumed: e.target.value ? Number(e.target.value) : null })} fullWidth margin="normal" />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Trip Status</InputLabel>
                        <Select name="trip_status" value={newTrip.trip_status} onChange={(e) => setNewTrip({ ...newTrip, trip_status: e.target.value as 'pending' | 'completed' | 'cancelled' })} label="Trip Status" required>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTripDialog(false)}>Cancel</Button>
                    <Button onClick={handleTripSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Inspection Dialog */}
            <Dialog open={openInspectionDialog} onClose={() => setOpenInspectionDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editInspection ? 'Edit Inspection' : 'Add Inspection'}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Employee *</InputLabel>
                        <Select name="user_id" value={newInspection.user_id} onChange={(e) => setNewInspection({ ...newInspection, user_id: Number(e.target.value), employee_id: Number(e.target.value) })} label="Employee *" required>
                            {availableUsers.map(user => (
                                <MenuItem key={user.user_id} value={user.user_id}>{user.name} ({user.email})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Vehicle *</InputLabel>
                        <Select name="vehicle_id" value={newInspection.vehicle_id} onChange={(e) => setNewInspection({ ...newInspection, vehicle_id: Number(e.target.value) })} label="Vehicle *" required>
                            {availableVehicles.map(vehicle => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} ({vehicle.licence_plate})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Inspection Date" name="date" type="date" value={newInspection.date} onChange={(e) => setNewInspection({ ...newInspection, date: e.target.value })} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                    {['tires', 'brakes', 'lights', 'fluids', 'mirrors', 'wipers', 'battery', 'body', 'interior', 'engine', 'transmission', 'suspension'].map((component) => (
                        <FormControl fullWidth margin="normal" key={component}>
                            <InputLabel>{component.charAt(0).toUpperCase() + component.slice(1)}</InputLabel>
                            <Select name={component} value={newInspection[component as keyof typeof newInspection] || InspectionStatus.good} onChange={(e) => setNewInspection({ ...newInspection, [component]: e.target.value as InspectionStatus })} label={component.charAt(0).toUpperCase() + component.slice(1)}>
                                {Object.values(InspectionStatus).map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ))}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Inspection Type</InputLabel>
                        <Select name="type" value={newInspection.type} onChange={(e) => setNewInspection({ ...newInspection, type: e.target.value as InspectionType })} label="Inspection Type" required>
                            <MenuItem value="pre_trip">Pre-Trip</MenuItem>
                            <MenuItem value="post_trip">Post-Trip</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField label="Signed By" name="signed_by" value={newInspection.signed_by} onChange={(e) => setNewInspection({ ...newInspection, signed_by: e.target.value })} fullWidth margin="normal" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInspectionDialog(false)}>Cancel</Button>
                    <Button onClick={handleInspectionSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Service History Dialog */}
            <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)}>
                <DialogTitle>Add Service Record</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Vehicle *</InputLabel>
                        <Select name="vehicle_vin" value={newService.vehicle_vin} onChange={(e) => setNewService({ ...newService, vehicle_vin: e.target.value })} label="Vehicle *" required>
                            {vehicles.map(vehicle => (
                                <MenuItem key={vehicle.vin} value={vehicle.vin}>{vehicle.make} {vehicle.model} ({vehicle.licence_plate})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Service Date" name="service_date" type="date" value={newService.service_date} onChange={(e) => setNewService({ ...newService, service_date: e.target.value })} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                    <TextField label="Mileage" name="service_mileage" type="number" value={newService.service_mileage} onChange={(e) => setNewService({ ...newService, service_mileage: Number(e.target.value) })} fullWidth margin="normal" required />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenServiceDialog(false)}>Cancel</Button>
                    <Button onClick={handleServiceSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* User Dialog */}
            <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)}>
                <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
                <DialogContent>
                    <TextField label="Name" name="name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="Email" name="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="Password" name="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} fullWidth margin="normal" helperText={editUser ? 'Leave blank to keep current password' : ''} />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select name="role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'employee' })} label="Role" required>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="employee">Employee</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Assigned Vehicle</InputLabel>
                        <Select name="vehicle_id" value={newUser.vehicle_id || ''} onChange={(e) => setNewUser({ ...newUser, vehicle_id: e.target.value ? Number(e.target.value) : null })} label="Assigned Vehicle">
                            <MenuItem value="">None</MenuItem>
                            {availableVehicles.map(vehicle => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} ({vehicle.licence_plate})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
                    <Button onClick={handleUserSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Vehicle Dialog */}
            <Dialog open={openVehicleDialog} onClose={() => setOpenVehicleDialog(false)}>
                <DialogTitle>{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
                <DialogContent>
                    <TextField label="Make" name="make" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="Model" name="model" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="License Plate" name="licence_plate" value={newVehicle.licence_plate} onChange={(e) => setNewVehicle({ ...newVehicle, licence_plate: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="VIN" name="vin" value={newVehicle.vin} onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })} fullWidth margin="normal" required />
                    <TextField label="Year" name="year" type="number" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })} fullWidth margin="normal" required inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }} />
                    <TextField label="Fuel Type" name="fuel_type" value={newVehicle.fuel_type || ''} onChange={(e) => setNewVehicle({ ...newVehicle, fuel_type: e.target.value || null })} fullWidth margin="normal" />
                    <TextField label="Mileage" name="mileage" type="number" value={newVehicle.mileage} onChange={(e) => setNewVehicle({ ...newVehicle, mileage: Number(e.target.value) })} fullWidth margin="normal" required />
                    <TextField label="Last Service Mileage" name="last_service_km" type="number" value={newVehicle.last_service_km} onChange={(e) => setNewVehicle({ ...newVehicle, last_service_km: Number(e.target.value) })} fullWidth margin="normal" />
                    <TextField label="Last Service Date" name="last_service_date" type="date" value={newVehicle.last_service_date} onChange={(e) => setNewVehicle({ ...newVehicle, last_service_date: e.target.value })} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenVehicleDialog(false)}>Cancel</Button>
                    <Button onClick={handleVehicleSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Profile Dialog */}
            <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)}>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <TextField label="Name" fullWidth margin="normal" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                    <TextField label="Email" type="email" fullWidth margin="normal" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                    <TextField label="New Password" type="password" fullWidth margin="normal" value={profileData.password} onChange={(e) => setProfileData({ ...profileData, password: e.target.value })} helperText="Leave blank to keep current password" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
                    <Button onClick={handleProfileUpdate} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default AdminDashboard;