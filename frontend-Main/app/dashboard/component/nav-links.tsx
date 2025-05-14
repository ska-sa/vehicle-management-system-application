import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DirectionsCar, Assignment, ListAlt } from '@mui/icons-material';

const links = [
  { href: '/dashboard/trips', icon: <ListAlt />, text: 'My Trips' },
  { href: '/dashboard/inspections', icon: <Assignment />, text: 'Inspections' },
  { href: '/dashboard/vehicle', icon: <DirectionsCar />, text: 'Vehicle Info' },
];

export default function DashboardNavLinks() {
  const pathname = usePathname();
  
  return (
    <List sx={{ width: 250, borderRight: '1px solid #eee' }}>
      {links.map((link) => (
        <ListItem key={link.href} disablePadding>
          <ListItemButton
            component={Link}
            href={link.href}
            selected={pathname === link.href}
          >
            <ListItemIcon>{link.icon}</ListItemIcon>
            <ListItemText primary={link.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

