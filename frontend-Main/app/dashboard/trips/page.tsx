import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import Link from 'next/link';
import TripForm from './form';

export default function TripsPage() {
  // In a real app, you'd fetch data here
  const trips = [
    { id: '1', date: '2023-10-15', destination: 'Johannesburg', status: 'Completed' }
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">My Trips</Typography>
        <Link href="/dashboard/trips/new" passHref>
          <Button variant="contained">Log New Trip</Button>
        </Link>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>{trip.date}</TableCell>
                <TableCell>{trip.destination}</TableCell>
                <TableCell>
                  <Chip label={trip.status} color="primary" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

