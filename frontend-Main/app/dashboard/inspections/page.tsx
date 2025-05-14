import { Button, Typography } from '@mui/material';
import Link from 'next/link';

export default function InspectionsPage() {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Inspections</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Link href="/dashboard/inspections/pre-trip" passHref>
            <Button variant="outlined">Pre-trip</Button>
          </Link>
          <Link href="/dashboard/inspections/post-trip" passHref>
            <Button variant="outlined">Post-trip</Button>
          </Link>
        </Box>
      </Box>
      
      {/* Inspection list would go here */}
    </>
  );
}
