'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Chip, LinearProgress, Stack, Alert, MenuItem,
    TextField, Button, CircularProgress, useTheme,
} from '@mui/material';
import {
    TrendingUp, CheckCircle, Warning, PendingActions,
    AdminPanelSettings, BarChart,
} from '@mui/icons-material';

import { alpha } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext.jsx';
import StatusUpdateModal from '@/app/components/dashboards/StatusUpdateModal';
import { authFetch } from '@/lib/client-auth';
import { usePolling } from '@/app/hooks/usePolling';

const STATUS_COLORS = { open: '#f97316', in_progress: '#f59e0b', resolved: '#22c55e' };
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' };

function AnalyticsPanel({ stats }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const bars = [
        { label: 'Open', value: stats.open, color: '#f97316', icon: <Warning sx={{ fontSize: 20 }} /> },
        { label: 'In Progress', value: stats.in_progress, color: '#f59e0b', icon: <PendingActions sx={{ fontSize: 20 }} /> },
        { label: 'Resolved', value: stats.resolved, color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 20 }} /> },
    ];

    const priorityBars = [
        { label: 'Critical', value: stats.priority?.Critical, color: '#ef4444' },
        { label: 'High', value: stats.priority?.High, color: '#f97316' },
        { label: 'Medium', value: stats.priority?.Medium, color: '#f59e0b' },
        { label: 'Low', value: stats.priority?.Low, color: '#22c55e' },
    ];

    const maxVal = Math.max(...bars.map(b => b.value || 0), 1);
    const maxPriorityVal = Math.max(...priorityBars.map(b => b.value || 0), 1);

    return (
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
                <BarChart sx={{ color: '#6366f1', fontSize: 22 }} />
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Analytics</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Total: {stats.total ?? '…'} issues
                    </Typography>
                </Box>
            </Box>


            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 2, mb: 3 }}>
                {[
                    { label: 'Total Issues', value: stats.total, color: '#6366f1', icon: <TrendingUp /> },
                    ...bars,
                ].map(s => (
                    <Box
                        key={s.label}
                        sx={{
                            p: 2, borderRadius: 2.5, textAlign: 'center',
                            border: `1px solid ${alpha(s.color, 0.25)}`,
                            background: alpha(s.color, 0.08),
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value ?? 0}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                    </Box>
                ))}
            </Box>


            <Stack spacing={2} sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: -1 }}>STATUS DISTRIBUTION</Typography>
                {bars.map(bar => {
                    const pct = Math.round(((bar.value || 0) / maxVal) * 100);
                    return (
                        <Box key={bar.label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Box sx={{ color: bar.color }}>{bar.icon}</Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{bar.label}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {bar.value ?? 0} ({stats.total ? Math.round(((bar.value || 0) / stats.total) * 100) : 0}%)
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                    height: 8, borderRadius: 999,
                                    bgcolor: alpha(bar.color, isDark ? 0.2 : 0.12),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 999,
                                        background: `linear-gradient(90deg, ${bar.color} 0%, ${alpha(bar.color, 0.7)} 100%)`,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>

            <Stack spacing={2}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: -1 }}>PRIORITY DISTRIBUTION</Typography>
                {priorityBars.map(bar => {
                    const pct = Math.round(((bar.value || 0) / maxPriorityVal) * 100);
                    return (
                        <Box key={bar.label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{bar.label}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {bar.value ?? 0}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                    height: 8, borderRadius: 999,
                                    bgcolor: alpha(bar.color, isDark ? 0.2 : 0.12),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 999,
                                        background: `linear-gradient(90deg, ${bar.color} 0%, ${alpha(bar.color, 0.7)} 100%)`,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

function UserPromotionPanel() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [email, setEmail] = useState('');
    const [role, setRole] = useState('citizen');
    const [ward, setWard] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [promoteError, setPromoteError] = useState('');
    const [promoteSuccess, setPromoteSuccess] = useState('');

    const handlePromote = useCallback(async (e) => {
        e.preventDefault();
        setPromoteError('');
        setPromoteSuccess('');

        const body = { email: email.trim(), role };
        if (role === 'municipality') {
            const wardNum = parseInt(ward, 10);
            if (!ward || isNaN(wardNum) || wardNum < 1) {
                setPromoteError('Ward number is required for municipality role (must be ≥ 1).');
                return;
            }
            body.wardNumber = wardNum;
        }

        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/promote', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details?.[0]?.message || 'Failed to update role');
            setPromoteSuccess(`Role updated to "${role}" for ${data.user?.email ?? email}. User must log out and log back in to refresh their role.`);
            setEmail(''); setRole('citizen'); setWard('');
        } catch (err) {
            setPromoteError(err.message);
        } finally {
            setSubmitting(false);
        }
    }, [email, role, ward]);

    const panelBg = isDark
        ? 'linear-gradient(140deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)'
        : 'rgba(255,255,255,0.97)';
    const panelBorder = `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(99,102,241,0.14)'}`;

    return (
        <Box
            component="form"
            onSubmit={handlePromote}
            sx={{
                p: { xs: 2.5, sm: 3 }, borderRadius: 3,
                background: panelBg, border: panelBorder,
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 16px 40px rgba(99,102,241,0.1)',
                display: 'flex', flexDirection: 'column', gap: 2,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdminPanelSettings sx={{ color: '#6366f1', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>User Role Management</Typography>
            </Box>

            {promoteError && <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>{promoteError}</Alert>}
            {promoteSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
                    {promoteSuccess}
                </Alert>
            )}

            <TextField
                id="promote-email"
                label="User Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="user@example.com"
            />

            <TextField
                id="promote-role"
                select
                label="Role"
                value={role}
                onChange={e => { setRole(e.target.value); setWard(''); }}
                fullWidth
                size="small"
            >
                {['citizen', 'municipality', 'admin'].map(r => (
                    <MenuItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </MenuItem>
                ))}
            </TextField>

            {role === 'municipality' && (
                <TextField
                    id="promote-ward"
                    label="Ward Number"
                    type="number"
                    value={ward}
                    onChange={e => setWard(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    inputProps={{ min: 1, step: 1 }}
                />
            )}

            <Button
                id="promote-submit"
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                    py: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #5254cc 0%, #7c3aed 100%)' },
                }}
            >
                {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Promote User'}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                ℹ️ The user must log out and log back in for their new role to take effect.
            </Typography>
        </Box>
    );
}

function IssueRow({ issue, onUpdateClick }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const statusColor = STATUS_COLORS[issue.status] || '#6366f1';

    // Fallback to title case for prior data
    const priorityWord = issue.priorityLabel || (issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : '');
    const priorityColor = PRIORITY_COLORS[priorityWord] || '#6366f1';

    return (
        <Box
            sx={{
                p: 2, borderRadius: 2,
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.12)' : 'rgba(99,102,241,0.1)'}`,
                background: isDark ? 'rgba(30,41,59,0.45)' : 'rgba(249,250,251,0.8)',
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' }, gap: 2,
                transition: 'all 0.2s',
                '&:hover': { boxShadow: `0 4px 16px ${alpha(statusColor, 0.15)}` },
            }}
        >
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{issue.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {issue.category} · Ward {issue.wardNumber ?? '–'} · {new Date(issue.createdAt).toLocaleDateString()}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                    label={STATUS_LABELS[issue.status] || issue.status}
                    size="small"
                    sx={{
                        fontWeight: 700, fontSize: '0.68rem', borderRadius: 999,
                        bgcolor: alpha(statusColor, 0.14), color: statusColor,
                        border: `1px solid ${alpha(statusColor, 0.3)}`,
                    }}
                />
                {priorityWord && (
                    <Chip
                        label={priorityWord}
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: '0.68rem', borderRadius: 999,
                            bgcolor: alpha(priorityColor, 0.14), color: priorityColor,
                            border: `1px solid ${alpha(priorityColor, 0.3)}`,
                        }}
                    />
                )}
            </Box>
            <Button
                id={`admin-update-${issue._id}`}
                size="small"
                variant="outlined"
                onClick={() => onUpdateClick(issue)}
                sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 700,
                    fontSize: '0.72rem', flexShrink: 0,
                    borderColor: alpha('#667eea', 0.4), color: '#667eea',
                    '&:hover': { borderColor: '#667eea', bgcolor: alpha('#667eea', 0.06) },
                }}
            >
                Update
            </Button>
        </Box>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [issues, setIssues] = useState([]);
    const [analytics, setAnalytics] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalIssue, setModal] = useState(null);

    const fetchAll = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        setError('');
        try {
            const [issuesRes, analyticsRes] = await Promise.all([
                authFetch('/api/issues?limit=200'),
                authFetch('/api/issues/analytics'),
            ]);
            const issuesData = await issuesRes.json();
            const analyticsData = await analyticsRes.json();
            setIssues(Array.isArray(issuesData.items) ? issuesData.items : []);
            if (!analyticsRes.ok) throw new Error(analyticsData.error || 'Analytics failed');
            setAnalytics(analyticsData);
        } catch (err) {
            setError(err.message || 'Failed to load data');
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    usePolling(fetchAll, 15000);

    const handleStatusUpdated = useCallback((updated) => {
        fetchAll(true);
    }, [fetchAll]);

    return (
        <Box
            sx={{
                minHeight: '100vh', pt: 10, pb: 8, px: { xs: 2, sm: 3, md: 5 },
                background: isDark
                    ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
            }}
        >
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

                <Box sx={{ mb: 4 }}>
                    <Chip
                        label="Admin"
                        size="small"
                        sx={{
                            mb: 1.5, fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
                            bgcolor: alpha('#ef4444', 0.12), color: '#ef4444',
                            border: `1px solid ${alpha('#ef4444', 0.3)}`,
                        }}
                    />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Admin Control Centre
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Full system overview — all wards, all issues
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
                {loading && <LinearProgress sx={{ borderRadius: 999, mb: 3 }} />}


                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' },
                        gap: 3, mb: 3,
                    }}
                >
                    <AnalyticsPanel stats={analytics} />
                    <UserPromotionPanel />
                </Box>


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
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                        All Issues{' '}
                        <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                            ({issues.length})
                        </Typography>
                    </Typography>
                    <Stack spacing={1.5}>
                        {issues.map(issue => (
                            <IssueRow
                                key={issue._id || issue.id}
                                issue={issue}
                                onUpdateClick={setModal}
                            />
                        ))}
                        {!loading && issues.length === 0 && (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography color="text.secondary">No issues found in the system.</Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Box>

            {modalIssue && (
                <StatusUpdateModal
                    open={Boolean(modalIssue)}
                    issueId={modalIssue._id}
                    currentStatus={modalIssue.status}
                    onClose={() => setModal(null)}
                    onSuccess={handleStatusUpdated}
                />
            )}
        </Box>
    );
}
