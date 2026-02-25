'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import { Box, CircularProgress } from '@mui/material';
import MunicipalityDashboard from './MunicipalityDashboard';

export default function MunicipalityPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/login'); return; }
        if (user.role !== 'municipality') { router.replace('/dashboard'); }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'municipality') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
        );
    }

    return <MunicipalityDashboard />;
}
