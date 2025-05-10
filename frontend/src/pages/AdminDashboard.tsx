import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Tabs,
    Tab,
    Box,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Vehicle, Trip, Inspection, User } from '../types/types';

const AdminDashboard: React.FC = () => {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('AuthContext is undefined. Ensure AuthProvider is wrapping the component tree.');
    }
    const { user, token, logout } = authContext;
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
    const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
    const [assignVehicleId, setAssignVehicleId] = useState(0);
    const [filter, setFilter] = useState({ make: '', model: '', licence_plate: '' });
    const [newVehicle, setNewVehicle] = useState({
        vin: '',
        make: '',
        model: '',
        year: 0,
        licence_plate: '',
        fuel_type: '',
        mileage: 0,
        last_service_date: '',
        last_service_km: 0,
    });
    const [newTrip, setNewTrip] = useState({
        vehicle_id: 0,
        user_id: 0,
        start_location: '',
        destination: '',
        purpose: '',
        trip_date: '',
        distance: 0,
        fuel_consumed: 0,
        trip_status: 'completed',
    });
    const [newInspection, setNewInspection] = useState({
        vehicle_id: 0,
        user_id: 0,
        type: 'pre_trip',
        date: '',
        signed_by: '',
        status: 'completed',
    });
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [editTrip, setEditTrip] = useState<Trip | null>(null);
    const [editInspection, setEditInspection] = useState<Inspection | null>(null);
    const [error, setError] = useState('');
    const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
    const [openTripDialog, setOpenTripDialog] = useState(false);
    const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
    const [openViewInspectionDialog, setOpenViewInspectionDialog] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
        } else {
            fetchVehicles();
            fetchUsers();
            fetchTrips();
            fetchAllInspections();
        }
    }, [user, navigate, filter]);

    const fetchVehicles = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_all_vehicles/`, {
                params: filter,
                headers: { Authorization: `Bearer ${token}` },
            });
            setVehicles(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch vehicles');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_all_users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch users');
        }
    };

    const fetchTrips = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_all_trips/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTrips(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch trips');
        }
    };

    const fetchAllInspections = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_all_inspections/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInspections(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch inspections');
        }
    };

    const fetchInspection = async (inspectionId: number) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_inspection/${inspectionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedInspection(response.data);
            setOpenViewInspectionDialog(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch inspection');
        }
    };

    const fetchUser = async (userId: number) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedUser(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch user');
        }
    };

    const handleAddVehicle = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add_vehicle/`, newVehicle, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchVehicles();
            setOpenVehicleDialog(false);
            setNewVehicle({
                vin: '',
                make: '',
                model: '',
                year: 0,
                licence_plate: '',
                fuel_type: '',
                mileage: 0,
                last_service_date: '',
                last_service_km: 0,
            });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add vehicle');
        }
    };

    const handleAddTrip = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add_trip/`, newTrip, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTrips();
            setOpenTripDialog(false);
            setNewTrip({
                vehicle_id: 0,
                user_id: 0,
                start_location: '',
                destination: '',
                purpose: '',
                trip_date: '',
                distance: 0,
                fuel_consumed: 0,
                trip_status: 'completed',
            });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add trip');
        }
    };

    const handleAddInspection = async () => {
        try {
            console.log('Sending inspection payload:', newInspection); // Log payload for debugging
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add_inspection/`, newInspection, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchAllInspections();
            setOpenInspectionDialog(false);
            setNewInspection({
                vehicle_id: 0,
                user_id: 0,
                type: 'pre_trip',
                date: '',
                signed_by: '',
                status: 'completed',
            });
        } catch (err: any) {
            console.error('Error adding inspection:', err.response?.data); // Log full error response
            if (err.response && err.response.data && err.response.data.detail) {
                const errorDetail = err.response.data.detail;
                if (Array.isArray(errorDetail)) {
                    setError(errorDetail.map((e: any) => e.msg).join(', '));
                } else {
                    setError(err.response.data.detail.msg || 'Failed to add inspection');
                }
            } else {
                setError('Failed to add inspection due to an unexpected error.');
            }
        }
    };

    const handleUpdateVehicle = async () => {
        if (!editVehicle) return;
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/update_vehicle/${editVehicle.id}`, editVehicle, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchVehicles();
            setOpenVehicleDialog(false);
            setEditVehicle(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update vehicle');
        }
    };

    const handleUpdateTrip = async () => {
        if (!editTrip) return;
        try {
            const payload = {
                ...editTrip,
                distance: editTrip.distance || null,
                fuel_consumed: editTrip.fuel_consumed || null,
                purpose: editTrip.purpose || null,
                trip_status: editTrip.trip_status || null,
            };
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/update_trip/${editTrip.trip_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTrips();
            setOpenTripDialog(false);
            setEditTrip(null);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail.msg || 'Failed to update trip');
            } else {
                setError('Failed to update trip due to an unexpected error.');
            }
        }
    };

    const handleUpdateInspection = async () => {
        if (!editInspection) return;
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/update_inspection/${editInspection.inspection_id}`, editInspection, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchAllInspections();
            setOpenInspectionDialog(false);
            setEditInspection(null);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail.msg || 'Failed to update inspection');
            } else {
                setError('Failed to update inspection due to an unexpected error.');
            }
        }
    };

    const handleDeleteVehicle = async (id: number) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete_vehicle/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchVehicles();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete vehicle');
        }
    };

    const handleDeleteTrip = async (id: number) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete_trip/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTrips();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete trip');
        }
    };

    const handleDeleteInspection = async (id: number) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete_inspection/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchAllInspections();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete inspection');
        }
    };

    const handleAssignVehicle = async (email: string) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/assign_vehicle_by_email/`, {
                email,
                vehicle_id: assignVehicleId,
            });
            fetchUsers();
            setAssignVehicleId(0);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to assign vehicle');
        }
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditVehicle(vehicle);
        setOpenVehicleDialog(true);
    };

    const handleEditTrip = (trip: Trip) => {
        setEditTrip(trip);
        setOpenTripDialog(true);
    };

    const handleEditInspection = (inspection: Inspection) => {
        setEditInspection(inspection);
        setOpenInspectionDialog(true);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Admin Dashboard
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
                    <Tab label="Vehicles" />
                    <Tab label="Users" />
                    <Tab label="Trips" />
                    <Tab label="Inspections" />
                    <Tab label="Service Notifications" />
                </Tabs>
                {tab === 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                label="Filter by Make"
                                name="make"
                                value={filter.make}
                                onChange={handleFilterChange}
                                fullWidth
                            />
                            <TextField
                                label="Filter by Model"
                                name="model"
                                value={filter.model}
                                onChange={handleFilterChange}
                                fullWidth
                            />
                            <TextField
                                label="Filter by License Plate"
                                name="licence_plate"
                                value={filter.licence_plate}
                                onChange={handleFilterChange}
                                fullWidth
                            />
                        </Box>
                        <Button variant="contained" onClick={() => setOpenVehicleDialog(true)}>
                            Add Vehicle
                        </Button>
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>VIN</TableCell>
                                    <TableCell>Make</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell>Year</TableCell>
                                    <TableCell>License Plate</TableCell>
                                    <TableCell>Mileage</TableCell>
                                    <TableCell>Last Service Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell>{vehicle.vin}</TableCell>
                                        <TableCell>{vehicle.make}</TableCell>
                                        <TableCell>{vehicle.model}</TableCell>
                                        <TableCell>{vehicle.year}</TableCell>
                                        <TableCell>{vehicle.licence_plate}</TableCell>
                                        <TableCell>{vehicle.mileage}</TableCell>
                                        <TableCell>{vehicle.last_service_date}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditVehicle(vehicle)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteVehicle(vehicle.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Dialog open={openVehicleDialog} onClose={() => { setOpenVehicleDialog(false); setEditVehicle(null); }}>
                            <DialogTitle>{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                            <DialogContent>
                                <TextField
                                    label="VIN"
                                    value={editVehicle ? editVehicle.vin : newVehicle.vin}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, vin: e.target.value })
                                            : setNewVehicle({ ...newVehicle, vin: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Make"
                                    value={editVehicle ? editVehicle.make : newVehicle.make}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, make: e.target.value })
                                            : setNewVehicle({ ...newVehicle, make: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Model"
                                    value={editVehicle ? editVehicle.model : newVehicle.model}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, model: e.target.value })
                                            : setNewVehicle({ ...newVehicle, model: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Year"
                                    type="number"
                                    value={editVehicle ? editVehicle.year : newVehicle.year}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, year: parseInt(e.target.value) })
                                            : setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="License Plate"
                                    value={editVehicle ? editVehicle.licence_plate : newVehicle.licence_plate}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, licence_plate: e.target.value })
                                            : setNewVehicle({ ...newVehicle, licence_plate: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    select
                                    label="Fuel Type"
                                    value={editVehicle ? editVehicle.fuel_type : newVehicle.fuel_type}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, fuel_type: e.target.value })
                                            : setNewVehicle({ ...newVehicle, fuel_type: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                >
                                    <MenuItem value="Petrol">Petrol</MenuItem>
                                    <MenuItem value="Diesel">Diesel</MenuItem>
                                </TextField>
                                <TextField
                                    label="Mileage"
                                    type="number"
                                    value={editVehicle ? editVehicle.mileage : newVehicle.mileage}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, mileage: parseInt(e.target.value) })
                                            : setNewVehicle({ ...newVehicle, mileage: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Last Service Date"
                                    type="date"
                                    value={editVehicle ? editVehicle.last_service_date : newVehicle.last_service_date}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, last_service_date: e.target.value })
                                            : setNewVehicle({ ...newVehicle, last_service_date: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Last Service KM"
                                    type="number"
                                    value={editVehicle ? editVehicle.last_service_km : newVehicle.last_service_km}
                                    onChange={(e) =>
                                        editVehicle
                                            ? setEditVehicle({ ...editVehicle, last_service_km: parseInt(e.target.value) })
                                            : setNewVehicle({ ...newVehicle, last_service_km: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => { setOpenVehicleDialog(false); setEditVehicle(null); }}>Cancel</Button>
                                <Button onClick={editVehicle ? handleUpdateVehicle : handleAddVehicle} variant="contained">
                                    {editVehicle ? 'Update' : 'Add'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 1 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">View All Users</Typography>
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Vehicle ID</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.user_id}>
                                        <TableCell>{user.user_id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.vehicle_id || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                onClick={() => { setSelectedUserId(user.user_id); fetchUser(user.user_id); }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {selectedUserId && selectedUser && (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6">User Details (ID: {selectedUserId})</Typography>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Name:</strong></TableCell>
                                            <TableCell>{selectedUser.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Email:</strong></TableCell>
                                            <TableCell>{selectedUser.email}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Role:</strong></TableCell>
                                            <TableCell>{selectedUser.role}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Vehicle ID:</strong></TableCell>
                                            <TableCell>{selectedUser.vehicle_id || 'N/A'}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Vehicle ID to Assign"
                                        type="number"
                                        value={assignVehicleId}
                                        onChange={(e) => setAssignVehicleId(parseInt(e.target.value) || 0)}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => handleAssignVehicle(selectedUser.email)}
                                    >
                                        Assign Vehicle
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => { setSelectedUserId(null); setSelectedUser(null); setAssignVehicleId(0); }}
                                    >
                                        Back
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
                {tab === 2 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">Manage Trips</Typography>
                        <Button variant="contained" onClick={() => setOpenTripDialog(true)} sx={{ mb: 2 }}>
                            Add Trip
                        </Button>
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Trip ID</TableCell>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Vehicle ID</TableCell>
                                    <TableCell>Start Location</TableCell>
                                    <TableCell>Destination</TableCell>
                                    <TableCell>Purpose</TableCell>
                                    <TableCell>Trip Date</TableCell>
                                    <TableCell>Distance (km)</TableCell>
                                    <TableCell>Fuel Consumed (liters)</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {trips.map((trip) => (
                                    <TableRow key={trip.trip_id}>
                                        <TableCell>{trip.trip_id}</TableCell>
                                        <TableCell>{trip.user_id}</TableCell>
                                        <TableCell>{trip.vehicle_id}</TableCell>
                                        <TableCell>{trip.start_location}</TableCell>
                                        <TableCell>{trip.destination}</TableCell>
                                        <TableCell>{trip.purpose || 'N/A'}</TableCell>
                                        <TableCell>{trip.trip_date}</TableCell>
                                        <TableCell>{trip.distance ?? 'N/A'}</TableCell>
                                        <TableCell>{trip.fuel_consumed ?? 'N/A'}</TableCell>
                                        <TableCell>{trip.trip_status ?? 'N/A'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditTrip(trip)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteTrip(trip.trip_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Dialog open={openTripDialog} onClose={() => { setOpenTripDialog(false); setEditTrip(null); }}>
                            <DialogTitle>{editTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
                            <DialogContent>
                                <TextField
                                    label="User ID"
                                    type="number"
                                    value={editTrip ? editTrip.user_id : newTrip.user_id}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, user_id: parseInt(e.target.value) })
                                            : setNewTrip({ ...newTrip, user_id: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Vehicle ID"
                                    type="number"
                                    value={editTrip ? editTrip.vehicle_id : newTrip.vehicle_id}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, vehicle_id: parseInt(e.target.value) })
                                            : setNewTrip({ ...newTrip, vehicle_id: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Start Location"
                                    value={editTrip ? editTrip.start_location : newTrip.start_location}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, start_location: e.target.value })
                                            : setNewTrip({ ...newTrip, start_location: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Destination"
                                    value={editTrip ? editTrip.destination : newTrip.destination}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, destination: e.target.value })
                                            : setNewTrip({ ...newTrip, destination: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Purpose"
                                    value={editTrip ? editTrip.purpose ?? '' : newTrip.purpose}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, purpose: e.target.value || null })
                                            : setNewTrip({ ...newTrip, purpose: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Trip Date"
                                    type="date"
                                    value={editTrip ? editTrip.trip_date : newTrip.trip_date}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, trip_date: e.target.value })
                                            : setNewTrip({ ...newTrip, trip_date: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Distance (km)"
                                    type="number"
                                    value={editTrip ? editTrip.distance ?? '' : newTrip.distance}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        editTrip
                                            ? setEditTrip({ ...editTrip, distance: value })
                                            : setNewTrip({ ...newTrip, distance: value ?? 0 });
                                    }}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Fuel Consumed (liters)"
                                    type="number"
                                    value={editTrip ? editTrip.fuel_consumed ?? '' : newTrip.fuel_consumed}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        editTrip
                                            ? setEditTrip({ ...editTrip, fuel_consumed: value })
                                            : setNewTrip({ ...newTrip, fuel_consumed: value ?? 0 });
                                    }}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    select
                                    label="Status"
                                    value={editTrip ? editTrip.trip_status ?? '' : newTrip.trip_status}
                                    onChange={(e) =>
                                        editTrip
                                            ? setEditTrip({ ...editTrip, trip_status: e.target.value || null })
                                            : setNewTrip({ ...newTrip, trip_status: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                >
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="">None</MenuItem>
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => { setOpenTripDialog(false); setEditTrip(null); }}>Cancel</Button>
                                <Button onClick={editTrip ? handleUpdateTrip : handleAddTrip} variant="contained">
                                    {editTrip ? 'Update' : 'Add'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 3 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">Manage Inspections</Typography>
                        <Button variant="contained" onClick={() => setOpenInspectionDialog(true)} sx={{ mb: 2 }}>
                            Add Inspection
                        </Button>
                        <Table sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Inspection ID</TableCell>
                                    <TableCell>Vehicle ID</TableCell>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Signed By</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inspections.map((inspection) => (
                                    <TableRow key={inspection.inspection_id}>
                                        <TableCell>{inspection.inspection_id}</TableCell>
                                        <TableCell>{inspection.vehicle_id}</TableCell>
                                        <TableCell>{inspection.user_id}</TableCell>
                                        <TableCell>{inspection.type}</TableCell>
                                        <TableCell>{inspection.date}</TableCell>
                                        <TableCell>{inspection.signed_by}</TableCell>
                                        <TableCell>{inspection.status}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditInspection(inspection)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteInspection(inspection.inspection_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                            <IconButton onClick={() => fetchInspection(inspection.inspection_id)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Dialog open={openInspectionDialog} onClose={() => { setOpenInspectionDialog(false); setEditInspection(null); }}>
                            <DialogTitle>{editInspection ? 'Edit Inspection' : 'Add New Inspection'}</DialogTitle>
                            <DialogContent>
                                <TextField
                                    label="Vehicle ID"
                                    type="number"
                                    value={editInspection ? editInspection.vehicle_id : newInspection.vehicle_id}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, vehicle_id: parseInt(e.target.value) })
                                            : setNewInspection({ ...newInspection, vehicle_id: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    label="User ID"
                                    type="number"
                                    value={editInspection ? editInspection.user_id : newInspection.user_id}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, user_id: parseInt(e.target.value) })
                                            : setNewInspection({ ...newInspection, user_id: parseInt(e.target.value) })
                                    }
                                    fullWidth
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    select
                                    label="Type"
                                    value={editInspection ? editInspection.type : newInspection.type}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, type: e.target.value })
                                            : setNewInspection({ ...newInspection, type: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    required
                                >
                                    <MenuItem value="pre_trip">Pre-Trip</MenuItem>
                                    <MenuItem value="post_trip">Post-Trip</MenuItem>
                                </TextField>
                                <TextField
                                    label="Date"
                                    type="date"
                                    value={editInspection ? editInspection.date : newInspection.date}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, date: e.target.value })
                                            : setNewInspection({ ...newInspection, date: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                                <TextField
                                    label="Signed By"
                                    value={editInspection ? editInspection.signed_by : newInspection.signed_by}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, signed_by: e.target.value })
                                            : setNewInspection({ ...newInspection, signed_by: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    select
                                    label="Status"
                                    value={editInspection ? editInspection.status : newInspection.status}
                                    onChange={(e) =>
                                        editInspection
                                            ? setEditInspection({ ...editInspection, status: e.target.value })
                                            : setNewInspection({ ...newInspection, status: e.target.value })
                                    }
                                    fullWidth
                                    margin="normal"
                                    required
                                >
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => { setOpenInspectionDialog(false); setEditInspection(null); }}>Cancel</Button>
                                <Button onClick={editInspection ? handleUpdateInspection : handleAddInspection} variant="contained">
                                    {editInspection ? 'Update' : 'Add'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Dialog open={openViewInspectionDialog} onClose={() => { setOpenViewInspectionDialog(false); setSelectedInspection(null); }}>
                            <DialogTitle>Inspection Details (ID: {selectedInspection?.inspection_id})</DialogTitle>
                            <DialogContent>
                                {selectedInspection && (
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><strong>Vehicle ID:</strong></TableCell>
                                                <TableCell>{selectedInspection.vehicle_id}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>User ID:</strong></TableCell>
                                                <TableCell>{selectedInspection.user_id}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Type:</strong></TableCell>
                                                <TableCell>{selectedInspection.type}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Date:</strong></TableCell>
                                                <TableCell>{selectedInspection.date}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Signed By:</strong></TableCell>
                                                <TableCell>{selectedInspection.signed_by}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Status:</strong></TableCell>
                                                <TableCell>{selectedInspection.status}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => { setOpenViewInspectionDialog(false); setSelectedInspection(null); }}>Close</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 4 && <div>Service Notifications Placeholder</div>}
            </Container>
        </>
    );
};

export default AdminDashboard;