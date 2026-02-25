'use client';

import { useState, useCallback } from 'react';
import {
    Box, Button, TextField, MenuItem, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Chip, useTheme,
} from '@mui/material';
import { authFetch } from '@/lib/client-auth';

const STATUSES = ['open', 'in_progress', 'resolved'];
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const STATUS_COLORS = { open: '#f97316', in_progress: '#f59e0b', resolved: '#22c55e' };


export default function StatusUpdateModal({ open, issueId, currentStatus, onClose, onSuccess }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [status, setStatus] = useState(currentStatus || 'open');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async () => {
        if (!reason.trim() || reason.trim().length < 5) {
            setError('Please provide a reason (min 5 characters)');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await authFetch(`/api/issues/${issueId}/status`, {
                method: 'POST',
                body: JSON.stringify({ status, statusChangeReason: reason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            onSuccess?.(data);
            setReason('');
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [issueId, status, reason, onClose, onSuccess]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: isDark
                        ? 'linear-gradient(140deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 100%)'
                        : 'rgba(255,255,255,0.98)',
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(99,102,241,0.16)'}`,
                    boxShadow: isDark ? '0 24px 56px rgba(0,0,0,0.6)' : '0 24px 56px rgba(99,102,241,0.14)',
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>Update Issue Status</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <TextField
                    id="status-select"
                    select
                    label="New Status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                >
                    {STATUSES.map(s => (
                        <MenuItem key={s} value={s}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[s] }} />
                                {STATUS_LABELS[s]}
                            </Box>
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    id="status-reason"
                    label="Reason / Notes"
                    multiline
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    fullWidth
                    placeholder="Describe the action taken or reason for this status change…"
                    helperText={`${reason.length}/1000`}
                    inputProps={{ maxLength: 1000 }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    id="status-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        borderRadius: 2, textTransform: 'none', fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
