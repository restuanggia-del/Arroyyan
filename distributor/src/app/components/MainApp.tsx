import { useState } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Inventory,
  People,
  Person,
} from '@mui/icons-material';
import DashboardPage from './DashboardPage';
import TransactionPage from './TransactionPage';
import StockPage from './StockPage';
import CustomerPage from './CustomerPage';
import ProfilePage from './ProfilePage';

interface MainAppProps {
  user: any;
  onLogout: () => void;
}

export default function MainApp({ user, onLogout }: MainAppProps) {
  const [currentTab, setCurrentTab] = useState(0);

  const renderPage = () => {
    switch (currentTab) {
      case 0:
        return <DashboardPage user={user} />;
      case 1:
        return <TransactionPage user={user} />;
      case 2:
        return <StockPage user={user} />;
      case 3:
        return <CustomerPage user={user} />;
      case 4:
        return <ProfilePage user={user} onLogout={onLogout} />;
      default:
        return <DashboardPage user={user} />;
    }
  };

  return (
    <Box className="size-full flex flex-col">
      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          pb: 7, // Space for bottom navigation
        }}
      >
        {renderPage()}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          value={currentTab}
          onChange={(event, newValue) => {
            setCurrentTab(newValue);
          }}
          showLabels
        >
          <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          <BottomNavigationAction label="Transaksi" icon={<ShoppingCart />} />
          <BottomNavigationAction label="Stok" icon={<Inventory />} />
          <BottomNavigationAction label="Pelanggan" icon={<People />} />
          <BottomNavigationAction label="Profil" icon={<Person />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
