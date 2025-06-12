import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    CircularProgress, Alert, IconButton, Select, FormControl, InputLabel, Tab
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Edit } from '@mui/icons-material';
import {
    UserProfile, Vehicle, Trip, Inspection, InspectionStatus, InspectionType
} from '../types/types';

interface EmployeeDashboardProps {
    user: UserProfile | null;
    token: string | null;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, token }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('trips');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
    const [openTripDialog, setOpenTripDialog] = useState(false);
    const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
    const [openProfileDialog, setOpenProfileDialog] = useState(false);
    const [editTrip, setEditTrip] = useState<Trip | null>(null);
    const [editInspection, setEditInspection] = useState<Inspection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [loadingInspections, setLoadingInspections] = useState(true);
    const [loadingVehicle, setLoadingVehicle] = useState(true);

    const [newTrip, setNewTrip] = useState({
        user_id: user?.user_id || 0,
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
        user_id: user?.user_id || 0,
        employee_id: user?.user_id || 0,
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
        signed_by: user?.name || '',
        type: InspectionType.pre_trip as InspectionType,
    });

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
    });

    useEffect(() => {
        if (!user?.user_id || !token || user.role !== 'employee') {
            navigate('/');
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            try {
                const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

                const endpoints = [
                    {
                        name: 'Trips',
                        url: `/api/get_user_trips/${user.user_id}`,
                        setter: setTrips,
                        loadingSetter: setLoadingTrips
                    },
                    {
                        name: 'Inspections',
                        url: `/api/inspections/user/${user.user_id}`,
                        setter: setInspections,
                        loadingSetter: setLoadingInspections
                    },
                    {
                        name: 'Assigned vehicle',
                        url: `/api/vehicles/assigned?email=${user.email}`,
                        setter: setAssignedVehicle,
                        loadingSetter: setLoadingVehicle
                    }
                ];

                // Define the expected type for fulfilled results
                type FetchResult = { data: any }; // Adjust based on actual API response types

                const results = await Promise.allSettled(
                    endpoints.map(async ({ url }) => {
                        const res = await axios.get(`${baseUrl}${url}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log(`${url} response:`, res.data);
                        return { data: res.data };
                    })
                );

                if (!isMounted) return;

                // Process results and collect errors
                const errors: string[] = [];
                results.forEach((result, index) => {
                    const { setter, loadingSetter, name } = endpoints[index];
                    if (result.status === 'fulfilled') {
                        if (index === 2) {
                            (setter as typeof setAssignedVehicle)(result.value.data || null);
                        } else if (index === 0) {
                            (setter as typeof setTrips)(result.value.data || []);
                        } else if (index === 1) {
                            (setter as typeof setInspections)(result.value.data || []);
                        }
                    } else {
                        if (index === 2) {
                            (setter as typeof setAssignedVehicle)(null);
                        } else if (index === 0) {
                            (setter as typeof setTrips)([]);
                        } else if (index === 1) {
                            (setter as typeof setInspections)([]);
                        }
                        errors.push(`${name} fetch failed: ${result.reason.message}`);
                        console.error(`${name} fetch error:`, result.reason.response?.data || result.reason.message);
                    }
                    loadingSetter(false);
                });

                // Update form defaults after vehicle fetch
                const vehicleResult = results[2];
                if (vehicleResult.status === 'fulfilled' && vehicleResult.value.data && isMounted) {
                    setNewTrip(prev => ({ ...prev, vehicle_id: vehicleResult.value.data.id }));
                    setNewInspection(prev => ({ ...prev, vehicle_id: vehicleResult.value.data.id, employee_id: user.user_id }));
                }

                if (errors.length > 0) {
                    setError(errors.join(', '));
                }

            } catch (err: any) {
                if (isMounted) {
                    setError(`Unexpected error: ${err.message}`);
                    console.error('Unexpected fetch error:', err.response?.data || err.message);
                    setLoadingTrips(false);
                    setLoadingInspections(false);
                    setLoadingVehicle(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [user, token, navigate]);

    const handleTripDialogOpen = (trip?: Trip) => {
        if (!assignedVehicle) {
            setError('No vehicle assigned. Please contact an admin.');
            return;
        }
        if (trip) {
            setEditTrip(trip);
            setNewTrip({
                user_id: user?.user_id || 0,
                vehicle_id: assignedVehicle.id,
                trip_date: trip.trip_date,
                distance: trip.distance || null,
                trip_status: trip.trip_status || 'pending',
                fuel_consumed: trip.fuel_consumed || null,
                purpose: trip.purpose || '',
                start_location: trip.start_location || '',
                destination: trip.destination || '',
            });
        } else {
            setEditTrip(null);
            setNewTrip({
                user_id: user?.user_id || 0,
                vehicle_id: assignedVehicle.id,
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

    const handleInspectionDialogOpen = (inspection?: Inspection) => {
        if (!assignedVehicle) {
            setError('No vehicle assigned. Please contact an admin.');
            return;
        }
        if (inspection) {
            setEditInspection(inspection);
            setNewInspection({
                vehicle_id: assignedVehicle.id,
                user_id: user?.user_id || 0,
                employee_id: user?.user_id || 0,
                tires: inspection.tires || InspectionStatus.good,
                brakes: inspection.brakes || InspectionStatus.good,
                lights: inspection.lights || InspectionStatus.good,
                fluids: inspection.fluids || InspectionStatus.good,
                mirrors: inspection.mirrors || InspectionStatus.good,
                wipers: inspection.wipers || InspectionStatus.good,
                battery: inspection.battery || InspectionStatus.good,
                body: inspection.body || InspectionStatus.good,
                interior: inspection.interior || InspectionStatus.good,
                engine: inspection.engine || InspectionStatus.good,
                transmission: inspection.transmission || InspectionStatus.good,
                suspension: inspection.suspension || InspectionStatus.good,
                date: inspection.date,
                signed_by: inspection.signed_by || user?.name || '',
                type: inspection.type || InspectionType.pre_trip,
            });
        } else {
            setEditInspection(null);
            setNewInspection({
                vehicle_id: assignedVehicle.id,
                user_id: user?.user_id || 0,
                employee_id: user?.user_id || 0,
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
                signed_by: user?.name || '',
                type: InspectionType.pre_trip,
            });
        }
        setOpenInspectionDialog(true);
    };

    const handleProfileDialogOpen = () => {
        setProfileData({
            name: user?.name || '',
            email: user?.email || '',
            password: '',
        });
        setOpenProfileDialog(true);
    };

    const handleTripSubmit = async () => {
        try {
            if (newTrip.trip_status === 'completed' && !newTrip.distance) {
                setError('Distance is required when marking a trip as completed');
                return;
            }

            const payload = {
                ...newTrip,
                distance: newTrip.distance || null,
                fuel_consumed: newTrip.fuel_consumed || null,
                purpose: newTrip.purpose || null,
                start_location: newTrip.start_location || null,
                destination: newTrip.destination || null,
            };

            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            if (editTrip) {
                await axios.put(
                    `${baseUrl}/api/update_trip/${editTrip.trip_id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${baseUrl}/api/add_trip/`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            const tripsRes = await axios.get(
                `${baseUrl}/api/get_user_trips/${user?.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTrips(tripsRes.data);
            setOpenTripDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save trip');
            console.error('Trip submit error:', err.response?.data || err.message);
        }
    };

    const handleInspectionSubmit = async () => {
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            if (editInspection) {
                await axios.put(
                    `${baseUrl}/api/inspections/${editInspection.inspection_id}`,
                    newInspection,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${baseUrl}/api/add_inspection/`,
                    newInspection,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            const inspectionsRes = await axios.get(
                `${baseUrl}/api/inspections/user/${user?.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInspections(inspectionsRes.data);
            setOpenInspectionDialog(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save inspection');
            console.error('Inspection submit error:', err.response?.data || err.message);
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            await axios.put(
                `${baseUrl}/api/update_user/${user?.user_id}`,
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOpenProfileDialog(false);
            const updatedUser = { ...user, name: profileData.name, email: profileData.email };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update profile');
            console.error('Profile update error:', err.response?.data || err.message);
        }
    };

    if (loadingTrips || loadingInspections || loadingVehicle) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Employee Dashboard</Typography>
                <Box>
                    <Button onClick={handleProfileDialogOpen} sx={{ mr: 2 }}>My Profile</Button>
                    <Button variant="contained" color="secondary" onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/');
                    }}>
                        Logout
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 2 }}>
                Assigned Vehicle: {assignedVehicle
                    ? `${assignedVehicle.make} ${assignedVehicle.model} (${assignedVehicle.licence_plate})`
                    : 'None (Contact admin to assign a vehicle)'}
            </Typography>

            <TabContext value={activeTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="Log Trip" value="trips" />
                        <Tab label="Inspections" value="inspections" />
                    </TabList>
                </Box>

                <TabPanel value="trips">
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">My Trips</Typography>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => handleTripDialogOpen()}
                                disabled={!assignedVehicle}
                            >
                                Add Trip
                            </Button>
                        </Box>
                        {loadingTrips ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Trip ID</TableCell>
                                        <TableCell>Vehicle</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Destination</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {trips.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No trips found. {assignedVehicle ? 'Add a trip to get started.' : 'Assign a vehicle to log trips.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        trips.map((trip) => (
                                            <TableRow key={trip.trip_id}>
                                                <TableCell>{trip.trip_id}</TableCell>
                                                <TableCell>{assignedVehicle?.make} {assignedVehicle?.model}</TableCell>
                                                <TableCell>{trip.trip_date}</TableCell>
                                                <TableCell>{trip.destination || 'N/A'}</TableCell>
                                                <TableCell>{trip.trip_status}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleTripDialogOpen(trip)}>
                                                        <Edit />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Box>
                </TabPanel>

                <TabPanel value="inspections">
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">My Inspections</Typography>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => handleInspectionDialogOpen()}
                                disabled={!assignedVehicle}
                            >
                                Add Inspection
                            </Button>
                        </Box>
                        {loadingInspections ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Vehicle</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inspections.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No inspections found. {assignedVehicle ? 'Add an inspection to get started.' : 'Assign a vehicle to log inspections.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inspections.map((inspection) => (
                                            <TableRow key={inspection.inspection_id}>
                                                <TableCell>{inspection.inspection_id}</TableCell>
                                                <TableCell>{assignedVehicle?.make} {assignedVehicle?.model}</TableCell>
                                                <TableCell>{inspection.date}</TableCell>
                                                <TableCell>{inspection.type}</TableCell>
                                                <TableCell>{inspection.signed_by || 'Not signed'}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleInspectionDialogOpen(inspection)}>
                                                        <Edit />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Box>
                </TabPanel>
            </TabContext>

            {/* Trip Dialog */}
            <Dialog open={openTripDialog} onClose={() => setOpenTripDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Trip Date"
                        name="trip_date"
                        type="date"
                        value={newTrip.trip_date}
                        onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        required
                        disabled
                    />
                    <TextField
                        label="Start Location"
                        name="start_location"
                        value={newTrip.start_location}
                        onChange={(e) => setNewTrip({ ...newTrip, start_location: e.target.value })}
                        fullWidth
                        margin="normal"
                        disabled
                    />
                    <TextField
                        label="Destination"
                        name="destination"
                        value={newTrip.destination}
                        onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                        fullWidth
                        margin="normal"
                        disabled
                    />
                    <TextField
                        label="Purpose"
                        name="purpose"
                        value={newTrip.purpose}
                        onChange={(e) => setNewTrip({ ...newTrip, purpose: e.target.value })}
                        fullWidth
                        margin="normal"
                        disabled
                    />
                    <TextField
                        label="Distance (km)"
                        name="distance"
                        type="number"
                        value={newTrip.distance ?? ''}
                        onChange={(e) => setNewTrip({ ...newTrip, distance: e.target.value ? Number(e.target.value) : null })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Fuel Consumed (L)"
                        name="fuel_consumed"
                        type="number"
                        inputProps={{ step: "0.1" }}
                        value={newTrip.fuel_consumed ?? ''}
                        onChange={(e) => setNewTrip({ ...newTrip, fuel_consumed: e.target.value ? Number(e.target.value) : null })}
                        fullWidth
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="trip_status"
                            value={newTrip.trip_status}
                            onChange={(e) => setNewTrip({ ...newTrip, trip_status: e.target.value as 'pending' | 'completed' | 'cancelled' })}
                            label="Status"
                        >
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
                    <TextField
                        label="Inspection Date"
                        name="date"
                        type="date"
                        value={newInspection.date}
                        onChange={(e) => setNewInspection({ ...newInspection, date: e.target.value })}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                    {['tires', 'brakes', 'lights', 'fluids', 'mirrors', 'wipers', 'battery', 'body', 'interior', 'engine', 'transmission', 'suspension'].map((item) => (
                        <FormControl fullWidth margin="normal" key={item}>
                            <InputLabel>{item.charAt(0).toUpperCase() + item.slice(1)}</InputLabel>
                            <Select
                                name={item}
                                value={newInspection[item as keyof typeof newInspection] || InspectionStatus.good}
                                onChange={(e) => setNewInspection({ ...newInspection, [item]: e.target.value as InspectionStatus })}
                                label={item.charAt(0).toUpperCase() + item.slice(1)}
                            >
                                {Object.values(InspectionStatus).map(status => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ))}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Type</InputLabel>
                        <Select
                            name="type"
                            value={newInspection.type}
                            onChange={(e) => setNewInspection({ ...newInspection, type: e.target.value as InspectionType })}
                            label="Type"
                            required
                        >
                            {Object.values(InspectionType).map(type => (
                                <MenuItem key={type} value={type}>
                                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Signed By"
                        name="signed_by"
                        value={newInspection.signed_by}
                        onChange={(e) => setNewInspection({ ...newInspection, signed_by: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInspectionDialog(false)}>Cancel</Button>
                    <Button onClick={handleInspectionSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Profile Dialog */}
            <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)}>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        fullWidth
                        margin="normal"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="normal"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={profileData.password}
                        onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
                    <Button onClick={handleProfileUpdate} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeDashboard;