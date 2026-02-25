'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Grid, Chip, LinearProgress, CircularProgress,
    Stack, Button, Divider, Alert, useTheme,
} from '@mui/material';
import {
    TrendingUp, CheckCircle, Warning, PendingActions,
    AddCircleOutline, History,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext.jsx';
import IssueSubmitForm from '@/app/components/dashboards/IssueSubmitForm';
import { authFetch } from '@/lib/client-auth';
import { usePolling } from '@/app/hooks/usePolling';
import Link from 'next/link';

const STATUS_COLORS = { open: '#f97316', in_progress: '#f59e0b', resolved: '#22c55e' };
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' };

function StatPill({ label, value, color }) {
    return (
        <Box
            sx={{
                flex: 1, minWidth: 100, p: 2, borderRadius: 3, textAlign: 'center',
                border: `1px solid ${alpha(color, 0.3)}`,
                background: alpha(color, 0.08),
            }}
        >
            <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
        </Box>
    );
}

function IssueRow({ issue }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const statusColor = STATUS_COLORS[issue.status] || '#6366f1';

    // Fallback to title case for prior data
    const priorityWord = issue.priorityLabel || (issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : '');
    const priorityColor = PRIORITY_COLORS[priorityWord] || '#6366f1';

    return (
        <Box
            sx={{
                p: 2, borderRadius: 2.5,
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(99,102,241,0.12)'}`,
                background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(249,250,251,0.8)',
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' }, justifyContent: 'space-between',
                gap: 1.5,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: `0 4px 16px ${alpha(statusColor, 0.15)}` },
            }}
        >
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                    {issue.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {issue.category} · {issue.wardName || 'No ward data'} ·{' '}
                    {new Date(issue.createdAt).toLocaleDateString()}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                    label={STATUS_LABELS[issue.status] || issue.status}
                    size="small"
                    sx={{
                        fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
                        bgcolor: alpha(statusColor, 0.15), color: statusColor,
                        border: `1px solid ${alpha(statusColor, 0.3)}`,
                    }}
                />
                {priorityWord && (
                    <Chip
                        label={priorityWord}
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
                            bgcolor: alpha(priorityColor, 0.15), color: priorityColor,
                            border: `1px solid ${alpha(priorityColor, 0.3)}`,
                        }}
                    />
                )}
            </Box>
        </Box>
    );
}

export default function CitizenDashboard() {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    const fetchMyIssues = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        setError('');
        try {
            const res = await authFetch('/api/issues?limit=100');
            const data = await res.json();
            const all = Array.isArray(data.items) ? data.items : [];
            setIssues(all.filter(i => String(i.userId) === String(user?.id)));
        } catch {
            setError('Failed to load your issues');
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchMyIssues(); }, [fetchMyIssues]);
    usePolling(fetchMyIssues, 15000);

    const stats = useMemo(() => ({
        total: issues.length,
        open: issues.filter(i => i.status === 'open').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
    }), [issues]);

    const handleNewIssue = useCallback((newIssue) => {
        fetchMyIssues(true);
        setShowForm(false);
    }, [fetchMyIssues]);

    return (
        <Box
            sx={{
                minHeight: '100vh', pt: 10, pb: 8, px: { xs: 2, sm: 3, md: 5 },
                background: isDark
                    ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
            }}
        >
            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>

                <Box sx={{ mb: 4 }}>
                    <Chip
                        label="Citizen"
                        size="small"
                        sx={{
                            mb: 1.5, fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
                            bgcolor: alpha('#6366f1', 0.12), color: '#6366f1',
                            border: `1px solid ${alpha('#6366f1', 0.3)}`,
                        }}
                    />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Welcome, {user?.name?.split(' ')[0] || 'Citizen'} 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Track and manage your civic issue reports
                    </Typography>
                </Box>


                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                    <StatPill label="Total Reported" value={stats.total} color="#6366f1" />
                    <StatPill label="Open" value={stats.open} color="#f97316" />
                    <StatPill label="In Progress" value={stats.inProgress} color="#f59e0b" />
                    <StatPill label="Resolved" value={stats.resolved} color="#22c55e" />
                </Box>


                <Box sx={{ mb: 4 }}>
                    <Button
                        id="citizen-toggle-form"
                        startIcon={<AddCircleOutline />}
                        onClick={() => setShowForm(f => !f)}
                        variant={showForm ? 'outlined' : 'contained'}
                        sx={{
                            borderRadius: 2, textTransform: 'none', fontWeight: 700,
                            background: showForm ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: showForm ? 'none' : '0 4px 16px rgba(102,126,234,0.3)',
                        }}
                    >
                        {showForm ? 'Cancel' : '+ Report New Issue'}
                    </Button>
                </Box>

                {showForm && (
                    <Box sx={{ mb: 4 }}>
                        <IssueSubmitForm onSuccess={handleNewIssue} />
                    </Box>
                )}


                <Box
                    sx={{
                        p: { xs: 2.5, sm: 3 }, borderRadius: 3,
                        background: isDark
                            ? 'linear-gradient(140deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)'
                            : 'rgba(255,255,255,0.97)',
                        border: `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(99,102,241,0.14)'}`,
                        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 16px 40px rgba(99,102,241,0.1)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <History sx={{ color: '#6366f1', fontSize: 22 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>My Issues</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Issues you have reported
                            </Typography>
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                    {loading && <LinearProgress sx={{ borderRadius: 999, mb: 2 }} />}

                    {!loading && issues.length === 0 && (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                You haven&apos;t reported any issues yet.
                            </Typography>
                            <Button
                                onClick={() => setShowForm(true)}
                                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, color: '#6366f1' }}
                            >
                                Report your first issue →
                            </Button>
                        </Box>
                    )}

                    <Stack spacing={1.5}>
                        {issues.map(issue => (
                            <IssueRow key={issue._id || issue.id} issue={issue} />
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}
