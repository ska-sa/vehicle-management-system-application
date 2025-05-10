import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trip, Vehicle } from '../types/types';

const EmployeeDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [newTrip, setNewTrip] = useState({
        vehicle_id: 0,
        user_id: user?.user_id || 0,
        start_location: '',
        destination: '',
        purpose: '',
        trip_date: '',
        distance: 0,
        fuel_consumed: 0,
        trip_status: 'completed',
    });
    const [editTrip, setEditTrip] = useState<Trip | null>(null);
    const [openTripDialog, setOpenTripDialog] = useState(false);
    const [openViewVehicleDialog, setOpenViewVehicleDialog] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.user_id) {
            fetchAssignedVehicle();
            fetchTrips();
        }
    }, [user?.user_id, token]);

    const fetchTrips = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_user_trips/${user?.user_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTrips(response.data);
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to fetch trips.');
            console.error('Error fetching trips:', error);
        }
    };

    const fetchAssignedVehicle = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/vehicles/assigned`, {
                params: { email: user?.email },
            });
            setVehicle(response.data);
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to fetch assigned vehicle.');
            console.error('Error fetching vehicle:', error);
        }
    };

    const handleAddTrip = async () => {
        try {
            const payload = {
                ...newTrip,
                distance: newTrip.distance || null,
                fuel_consumed: newTrip.fuel_consumed || null,
                purpose: newTrip.purpose || null,
                trip_status: newTrip.trip_status || null,
            };
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add_trip/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTrips();
            setOpenTripDialog(false);
            setNewTrip({
                vehicle_id: 0,
                user_id: user?.user_id || 0,
                start_location: '',
                destination: '',
                purpose: '',
                trip_date: '',
                distance: 0,
                fuel_consumed: 0,
                trip_status: 'completed',
            });
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to add trip.');
            console.error('Error adding trip:', error);
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

    const handleDeleteTrip = async (id: number) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete_trip/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTrips();
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Failed to delete trip.');
            console.error('Error deleting trip:', error);
        }
    };

    const handleEditTrip = (trip: Trip) => {
        setEditTrip(trip);
        setOpenTripDialog(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editTrip) {
            setEditTrip((prev: Trip | null) => prev ? ({
                ...prev,
                [name]:
                    name === 'vehicle_id' || name === 'distance' || name === 'fuel_consumed'
                        ? value ? parseFloat(value) : 0
                        : name === 'trip_status' || name === 'purpose'
                            ? value || null
                            : value,
            }) : prev);
        } else {
            setNewTrip(prev => ({
                ...prev,
                [name]:
                    name === 'vehicle_id' || name === 'distance' || name === 'fuel_consumed'
                        ? value ? parseFloat(value) : 0
                        : name === 'trip_status' || name === 'purpose'
                            ? value || null
                            : value,
            }));
        }
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Employee Dashboard - {user?.email}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Employee Dashboard
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Button variant="contained" onClick={() => setOpenTripDialog(true)}>
                        Add a Trip
                    </Button>
                    <Button variant="contained" onClick={fetchTrips}>
                        Refresh Trips
                    </Button>
                    <Button variant="contained" onClick={() => setOpenViewVehicleDialog(true)} disabled={!vehicle}>
                        View Assigned Vehicle
                    </Button>
                </Box>

                <Dialog open={openTripDialog} onClose={() => { setOpenTripDialog(false); setEditTrip(null); }}>
                    <DialogTitle>{editTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="User ID"
                            name="user_id"
                            type="number"
                            value={editTrip ? editTrip.user_id : newTrip.user_id}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                            disabled
                        />
                        <TextField
                            label="Vehicle ID"
                            name="vehicle_id"
                            type="number"
                            value={editTrip ? editTrip.vehicle_id : newTrip.vehicle_id}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Start Location"
                            name="start_location"
                            value={editTrip ? editTrip.start_location : newTrip.start_location}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Destination"
                            name="destination"
                            value={editTrip ? editTrip.destination : newTrip.destination}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Purpose"
                            name="purpose"
                            value={editTrip ? editTrip.purpose ?? '' : newTrip.purpose}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Trip Date"
                            name="trip_date"
                            type="date"
                            value={editTrip ? editTrip.trip_date : newTrip.trip_date}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            label="Distance (km)"
                            name="distance"
                            type="number"
                            inputProps={{ step: "0.1" }}
                            value={editTrip ? editTrip.distance ?? '' : newTrip.distance}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Fuel Consumed (liters)"
                            name="fuel_consumed"
                            type="number"
                            inputProps={{ step: "0.1" }}
                            value={editTrip ? editTrip.fuel_consumed ?? '' : newTrip.fuel_consumed}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            select
                            label="Status"
                            name="trip_status"
                            value={editTrip ? editTrip.trip_status ?? '' : newTrip.trip_status}
                            onChange={handleChange}
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

                <Typography variant="h6">Your Trips</Typography>
                <Table sx={{ mt: 2 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Vehicle ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Destination</TableCell>
                            <TableCell>Distance (km)</TableCell>
                            <TableCell>Fuel Consumed (liters)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trips.map((trip) => (
                            <TableRow key={trip.trip_id}>
                                <TableCell>{trip.vehicle_id}</TableCell>
                                <TableCell>{trip.trip_date}</TableCell>
                                <TableCell>{trip.destination}</TableCell>
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

                <Dialog open={openViewVehicleDialog} onClose={() => setOpenViewVehicleDialog(false)}>
                    <DialogTitle>Assigned Vehicle Details</DialogTitle>
                    <DialogContent>
                        {vehicle ? (
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>License Plate:</strong></TableCell>
                                        <TableCell>{vehicle.licence_plate}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Make:</strong></TableCell>
                                        <TableCell>{vehicle.make}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Model:</strong></TableCell>
                                        <TableCell>{vehicle.model}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Year:</strong></TableCell>
                                        <TableCell>{vehicle.year}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Mileage:</strong></TableCell>
                                        <TableCell>{vehicle.mileage} km</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Last Service Date:</strong></TableCell>
                                        <TableCell>{vehicle.last_service_date}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        ) : (
                            <Typography>No vehicle assigned.</Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenViewVehicleDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default EmployeeDashboard;