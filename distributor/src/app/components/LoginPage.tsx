import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Droplet } from "lucide-react";
import { loginDistributor, DistributorUser } from "../../utils/supabaseClient";

interface LoginPageProps {
  onLogin: (user: DistributorUser, distributorId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { user, distributorId } = await loginDistributor(email, password);
      onLogin(user, distributorId);
    } catch (err: any) {
      setError(err.message ?? "Login gagal. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #0891b2 50%, #06b6d4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          top: -80,
          right: -80,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          bottom: -50,
          left: -50,
        },
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 420,
          width: "100%",
          borderRadius: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              boxShadow: "0 8px 24px rgba(8,145,178,0.4)",
            }}
          >
            <Droplet size={38} color="white" fill="white" />
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ARROYYAN99
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Portal Distributor
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Bogatama, Tulang Bawang, Lampung
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mb: 2.5, borderRadius: 2, fontSize: "0.8rem" }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            autoFocus
            sx={{ mb: 2 }}
            size="medium"
          />

          <TextField
            fullWidth
            label="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPass(!showPass)}
                    edge="end"
                    disabled={loading}
                    size="small"
                  >
                    {showPass ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              py: 1.6,
              borderRadius: 2.5,
              fontWeight: "bold",
              fontSize: "1rem",
              background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
              boxShadow: "0 4px 16px rgba(8,145,178,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1e40af, #0e7490)",
                boxShadow: "0 6px 20px rgba(8,145,178,0.45)",
              },
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Memverifikasi...</span>
              </Box>
            ) : (
              "Masuk"
            )}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 3, display: "block", textAlign: "center", lineHeight: 1.6 }}
        >
          Belum punya akun distributor?
          <br />
          Hubungi administrator pabrik untuk pendaftaran.
        </Typography>
      </Paper>
    </Box>
  );
}
