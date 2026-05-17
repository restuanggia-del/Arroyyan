import { useState } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ShoppingCart as TransactionIcon,
  LocalShipping as DistributionIcon,
  Inventory as StockIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { DistributorUser } from "../../utils/supabaseClient";
import DashboardPage from "./DashboardPage";
import TransactionPage from "./TransactionPage";
import StockPage from "./StockPage";
import DistributionPage from "./DistributionPage";
import ProfilePage from "./ProfilePage";

interface MainAppProps {
  user: DistributorUser;
  distributorId: string;
  onLogout: () => void;
}

type TabKey =
  | "dashboard"
  | "transaction"
  | "stock"
  | "distribution"
  | "profile";

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { key: "transaction", label: "Transaksi", icon: <TransactionIcon /> },
  { key: "stock", label: "Stok", icon: <StockIcon /> },
  { key: "distribution", label: "Distribusi", icon: <DistributionIcon /> },
  { key: "profile", label: "Profil", icon: <ProfileIcon /> },
];

export default function MainApp({
  user,
  distributorId,
  onLogout,
}: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage user={user} distributorId={distributorId} />;
      case "transaction":
        return <TransactionPage distributorId={distributorId} />;
      case "stock":
        return <StockPage distributorId={distributorId} />;
      case "distribution":
        return <DistributionPage distributorId={distributorId} />;
      case "profile":
        return <ProfilePage user={user} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  const initials = user.distributor_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "#f5f7fa",
      }}
    >
      {/* ── Top AppBar ── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DashboardIcon sx={{ fontSize: 18, color: "white" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="white"
                lineHeight={1.2}
              >
                {TABS.find((t) => t.key === activeTab)?.label ?? "Dashboard"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem" }}
              >
                {user.distributor_name}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "rgba(255,255,255,0.25)",
                fontSize: "0.8rem",
                fontWeight: "bold",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              {initials}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { borderRadius: 2, minWidth: 200, mt: 1 } }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user.distributor_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setActiveTab("profile");
              }}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profil Saya
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.2, color: "error.main" }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              Keluar
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ── Page Content ── */}
      <Box sx={{ flex: 1, overflow: "auto" }}>{renderPage()}</Box>

      {/* ── Bottom Navigation ── */}
      <Paper
        elevation={8}
        sx={{
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: "divider",
          borderRadius: 0,
        }}
      >
        <BottomNavigation
          value={tabIndex}
          onChange={(_, newIndex) => setActiveTab(TABS[newIndex].key)}
          sx={{ height: 60 }}
        >
          {TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              sx={{
                minWidth: 0,
                fontSize: "0.65rem",
                "&.Mui-selected": { color: "#0891b2" },
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.65rem",
                  "&.Mui-selected": { fontSize: "0.7rem" },
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
