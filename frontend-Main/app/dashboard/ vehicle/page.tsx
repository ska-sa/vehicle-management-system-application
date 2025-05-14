import { Card, CardContent, Typography, Chip } from '@mui/material';

export default function VehiclePage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Assigned Vehicle
        </Typography>
        <Typography>Make: Toyota</Typography>
        <Typography>Model: Hilux</Typography>
        <Typography>
          Status: <Chip label="Active" color="success" />
        </Typography>
      </CardContent>
    </Card>
  );
}