'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import {
    Box, TextField, Button, Typography, Alert, CircularProgress,
    InputAdornment, IconButton, useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Map as MapIcon } from '@mui/icons-material';
import Link from 'next/link';
import { alpha } from '@mui/material/styles';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                p: 2,
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: { xs: 3, sm: 4 },
                    borderRadius: 4,
                    background: isDark
                        ? 'linear-gradient(140deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.92) 100%)'
                        : 'rgba(255,255,255,0.97)',
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(99,102,241,0.18)'}`,
                    boxShadow: isDark
                        ? '0 24px 56px rgba(0,0,0,0.6)'
                        : '0 24px 56px rgba(99,102,241,0.14)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 44, height: 44, borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(102,126,234,0.35)',
                        }}
                    >
                        <MapIcon sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Civic Tracker
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Smart City Reporter
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Welcome back
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to your account to continue
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    id="login-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    fullWidth
                    autoComplete="email"
                    sx={{ mb: 2 }}
                    slotProps={{ input: { sx: { borderRadius: 2 } } }}
                />

                <TextField
                    id="login-password"
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="current-password"
                    sx={{ mb: 3 }}
                    slotProps={{
                        input: {
                            sx: { borderRadius: 2 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        id="login-toggle-password"
                                        onClick={() => setShowPass(p => !p)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Button
                    id="login-submit"
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                        py: 1.25, borderRadius: 2, fontWeight: 700,
                        textTransform: 'none', fontSize: '1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.38)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                            boxShadow: '0 6px 28px rgba(102,126,234,0.46)',
                        },
                    }}
                >
                    {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
                </Button>

                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            style={{
                                color: '#667eea',
                                fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            Create one
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
