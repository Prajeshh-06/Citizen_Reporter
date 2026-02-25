'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Box, TextField, Button, MenuItem, CircularProgress, Alert,
    Typography, useTheme,
} from '@mui/material';
import { AddCircleOutline, PinDrop } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { authFetch } from '@/lib/client-auth';

const LocationPickerMap = dynamic(
    () => import('@/app/components/LocationPickerMap'),
    { ssr: false, loading: () => <Box sx={{ height: 250, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Box> }
);

const CATEGORIES = [
    'Road & Pavement', 'Water & Drainage', 'Sanitation', 'Electricity',
    'Parks & Trees', 'Traffic & Signals', 'Public Property', 'Other',
];


export default function IssueSubmitForm({ onSuccess }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [title, setTitle] = useState('');
    const [description, setDesc] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('medium');
    const [coords, setCoords] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleLocationSelect = useCallback(({ lat, lng }) => {
        setCoords({ lat, lng });
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!coords) {
            setError('Please click on the map to select a location before submitting.');
            return;
        }

        const body = {
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            priority,
            lat: coords.lat,
            lng: coords.lng,
        };

        setLoading(true);
        try {
            const res = await authFetch('/api/issues', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit issue');
            setSuccess(true);
            setTitle(''); setDesc(''); setCategory(''); setPriority('medium');
            setCoords(null);
            onSuccess?.(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [title, description, category, priority, coords, onSuccess]);

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                background: isDark
                    ? 'linear-gradient(140deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)'
                    : 'rgba(255,255,255,0.97)',
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(99,102,241,0.16)'}`,
                boxShadow: isDark
                    ? '0 16px 40px rgba(0,0,0,0.4)'
                    : '0 16px 40px rgba(99,102,241,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <AddCircleOutline sx={{ color: '#667eea', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Report a New Issue
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ borderRadius: 2 }}>Issue submitted successfully!</Alert>}

            <TextField
                id="issue-title"
                label="Issue Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                fullWidth
                placeholder="e.g. Large pothole on Main Street"
                inputProps={{ minLength: 3, maxLength: 100 }}
            />

            <TextField
                id="issue-description"
                label="Description"
                value={description}
                onChange={e => setDesc(e.target.value)}
                required
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the issue in detail…"
                inputProps={{ maxLength: 1000 }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                    id="issue-category"
                    select
                    label="Category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                    fullWidth
                >
                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>

                <TextField
                    id="issue-priority"
                    select
                    label="Priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    fullWidth
                >
                    {['low', 'medium', 'high'].map(p => (
                        <MenuItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PinDrop sx={{ color: '#667eea', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Location{' '}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                            (click the map to pin your location)
                        </Typography>
                    </Typography>
                </Box>

                
                <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(148,163,184,0.18)' : 'rgba(99,102,241,0.18)'}` }}>
                    <LocationPickerMap onLocationSelect={handleLocationSelect} height="250px" />
                </Box>

                
                {coords ? (
                    <Box
                        sx={{
                            mt: 1, px: 1.5, py: 0.75, borderRadius: 1.5,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.07)',
                            border: `1px solid ${alpha('#667eea', 0.2)}`,
                            display: 'flex', alignItems: 'center', gap: 1,
                        }}
                    >
                        <PinDrop sx={{ fontSize: 15, color: '#667eea' }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#667eea', fontWeight: 600 }}>
                            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            — drag the marker to adjust
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        No location selected — a pin is required to submit.
                    </Typography>
                )}
            </Box>

            <Button
                id="issue-submit"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                    py: 1.25, borderRadius: 2, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 18px rgba(102,126,234,0.35)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                        transform: 'translateY(-1px)',
                    },
                    mt: 0.5,
                }}
            >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Submit Issue'}
            </Button>
        </Box>
    );
}
