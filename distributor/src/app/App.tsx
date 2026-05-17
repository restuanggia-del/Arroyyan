import { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Toaster, toast } from "sonner";
import LoginPage from "../app/components/LoginPage";
import MainApp from "../app/components/MainApp";
import {
  checkSession,
  logoutDistributor,
  DistributorUser,
} from "../utils/supabaseClient";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0891b2" },
    secondary: { main: "#1e3a8a" },
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
  },
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DistributorUser | null>(null);
  const [distributorId, setDistributorId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Cek session yang sudah ada saat app pertama dibuka
  useEffect(() => {
    const init = async () => {
      try {
        const userData = await checkSession();
        if (userData) {
          setUser(userData);
          setDistributorId(userData.distributor_id);
          setIsAuthenticated(true);
        }
      } catch {
        // Session tidak valid, tampilkan login
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Dipanggil oleh LoginPage setelah login berhasil
  // Konsisten: loginDistributor() → { user, distributorId }
  const handleLogin = (userData: DistributorUser, distId: string) => {
    setUser(userData);
    setDistributorId(distId);
    setIsAuthenticated(true);
    toast.success(`Selamat datang, ${userData.distributor_name}!`);
  };

  const handleLogout = async () => {
    await logoutDistributor();
    setUser(null);
    setDistributorId("");
    setIsAuthenticated(false);
    toast.success("Logout berhasil");
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
            gap: 2,
          }}
        >
          <CircularProgress size={40} sx={{ color: "white" }} />
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
            Memuat sesi...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" richColors closeButton />
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainApp
          user={user!}
          distributorId={distributorId}
          onLogout={handleLogout}
        />
      )}
    </ThemeProvider>
  );
}
