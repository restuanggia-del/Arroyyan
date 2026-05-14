import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.user.approved) {
        setError('Akun Anda belum di-approve oleh admin. Silakan hubungi administrator.');
        setLoading(false);
        return;
      }

      onLogin(response.user, response.accessToken);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
      toast.error('Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="size-full flex items-center justify-center p-4"
      sx={{ bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Box className="flex flex-col items-center mb-6">
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              borderRadius: '50%',
              mb: 2,
            }}
          >
            <LockOutlined sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Distributor AMDK
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Arroyyan99 - Bogatama
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block', textAlign: 'center' }}
        >
          Tidak punya akun? Hubungi administrator
        </Typography>
      </Paper>
    </Box>
  );
}
