'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import { Box, CircularProgress, Typography } from '@mui/material';

const ROLE_ROUTES = {
  citizen: '/dashboard/citizen',
  municipality: '/dashboard/municipality',
  admin: '/dashboard/admin',
};

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const dest = ROLE_ROUTES[user.role] || '/dashboard/citizen';
    router.replace(dest);
  }, [user, loading, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#667eea' }} />
      <Typography variant="body2" color="text.secondary">
        Redirecting to your dashboard…
      </Typography>
    </Box>
  );
}
