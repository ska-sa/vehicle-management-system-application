import type { Metadata } from 'next';
import { Box } from '@mui/material';
import DashboardNavLinks from './components/nav-links';

export const metadata: Metadata = {
  title: 'Employee Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <DashboardNavLinks />
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

