'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Chip, LinearProgress, Stack, Alert,
    ToggleButtonGroup, ToggleButton, Button, useTheme, CircularProgress,
} from '@mui/material';
import { LocationOn, FilterList } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext.jsx';
import StatusUpdateModal from '@/app/components/dashboards/StatusUpdateModal';
import { authFetch } from '@/lib/client-auth';
import { usePolling } from '@/app/hooks/usePolling';

const STATUS_COLORS = { open: '#f97316', in_progress: '#f59e0b', resolved: '#22c55e' };
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' };

function IssueCard({ issue, onUpdateClick }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const statusColor = STATUS_COLORS[issue.status] || '#6366f1';

    const priorityWord = issue.priorityLabel || (issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : '');
    const priorityColor = PRIORITY_COLORS[priorityWord] || '#6366f1';

    return (
        <Box
            sx={{
                p: 2.5, borderRadius: 2.5,
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(99,102,241,0.12)'}`,
                background: isDark ? 'rgba(30,41,59,0.55)' : 'rgba(249,250,251,0.9)',
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'flex-start' }, gap: 2,
                transition: 'all 0.2s',
                '&:hover': { boxShadow: `0 4px 20px ${alpha(statusColor, 0.18)}` },
            }}
        >
            <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {issue.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <span>{issue.category}</span>
                    <span>·</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label={STATUS_LABELS[issue.status] || issue.status}
                        size="small"
                        sx={{
                            fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
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
                                bgcolor: alpha(priorityColor, 0.12), color: priorityColor,
                                border: `1px solid ${alpha(priorityColor, 0.3)}`,
                            }}
                        />
                    )}
                </Box>
            </Box>
            <Button
                id={`update-status-${issue._id}`}
                size="small"
                variant="outlined"
                onClick={() => onUpdateClick(issue)}
                sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 700,
                    fontSize: '0.75rem', flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' },
                    borderColor: alpha('#667eea', 0.5), color: '#667eea',
                    '&:hover': { borderColor: '#667eea', bgcolor: alpha('#667eea', 0.06) },
                }}
            >
                Update Status
            </Button>
        </Box>
    );
}

export default function MunicipalityDashboard() {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryFilter, setFilter] = useState('all');
    const [modalIssue, setModalIssue] = useState(null);

    const fetchWardIssues = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        setError('');
        try {
            const res = await authFetch('/api/issues?limit=200');
            const data = await res.json();
            const all = Array.isArray(data.items) ? data.items : [];
            const wardNum = user?.wardNumber;
            const filtered = wardNum != null
                ? all.filter(i => i.wardNumber === wardNum)
                : all;
            setIssues(filtered);
        } catch {
            setError('Failed to load ward issues');
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [user?.wardNumber]);

    useEffect(() => { fetchWardIssues(); }, [fetchWardIssues]);
    usePolling(fetchWardIssues, 15000);

    const categories = useMemo(() => {
        const cats = [...new Set(issues.map(i => i.category).filter(Boolean))];
        return ['all', ...cats];
    }, [issues]);

    const filtered = useMemo(() =>
        categoryFilter === 'all' ? issues : issues.filter(i => i.category === categoryFilter),
        [issues, categoryFilter]
    );

    const stats = useMemo(() => ({
        total: issues.length,
        open: issues.filter(i => i.status === 'open').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
    }), [issues]);

    const handleStatusUpdated = useCallback((updated) => {
        fetchWardIssues(true);
    }, [fetchWardIssues]);

    return (
        <Box
            sx={{
                minHeight: '100vh', pt: 10, pb: 8, px: { xs: 2, sm: 3, md: 5 },
                background: isDark
                    ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
            }}
        >
            <Box sx={{ maxWidth: 1100, mx: 'auto' }}>

                <Box sx={{ mb: 4 }}>
                    <Chip
                        label="Municipality"
                        size="small"
                        sx={{
                            mb: 1.5, fontWeight: 700, fontSize: '0.7rem', borderRadius: 999,
                            bgcolor: alpha('#0ea5e9', 0.12), color: '#0ea5e9',
                            border: `1px solid ${alpha('#0ea5e9', 0.3)}`,
                        }}
                    />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Ward Dashboard
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            {user?.wardNumber != null
                                ? `Ward ${user.wardNumber} — ${issues[0]?.wardName || 'Your assigned ward'}`
                                : 'All wards (no ward restriction)'
                            }
                        </Typography>
                    </Box>
                </Box>


                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: 2, mb: 4,
                    }}
                >
                    {[
                        { label: 'Total', value: stats.total, color: '#6366f1' },
                        { label: 'Open', value: stats.open, color: '#f97316' },
                        { label: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
                        { label: 'Resolved', value: stats.resolved, color: '#22c55e' },
                    ].map(s => (
                        <Box
                            key={s.label}
                            sx={{
                                p: 2, borderRadius: 2.5, textAlign: 'center',
                                border: `1px solid ${alpha(s.color, 0.25)}`,
                                background: alpha(s.color, 0.08),
                            }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                        </Box>
                    ))}
                </Box>


                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <FilterList sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Filter:</Typography>
                    <ToggleButtonGroup
                        value={categoryFilter}
                        exclusive
                        onChange={(_, v) => v && setFilter(v)}
                        size="small"
                        sx={{ flexWrap: 'wrap' }}
                    >
                        {categories.map(cat => (
                            <ToggleButton
                                key={cat}
                                value={cat}
                                id={`filter-${cat}`}
                                sx={{
                                    textTransform: 'none', fontWeight: 600, borderRadius: '20px !important',
                                    border: '1px solid rgba(99,102,241,0.25) !important',
                                    mx: 0.25, px: 1.5, py: 0.4, fontSize: '0.75rem',
                                    '&.Mui-selected': {
                                        bgcolor: alpha('#6366f1', 0.15),
                                        color: '#6366f1',
                                        border: '1px solid rgba(99,102,241,0.5) !important',
                                    },
                                }}
                            >
                                {cat === 'all' ? 'All Categories' : cat}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
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
                        Issues in Ward{' '}
                        <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                            ({filtered.length})
                        </Typography>
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                    {loading && <LinearProgress sx={{ borderRadius: 999, mb: 2 }} />}

                    {!loading && filtered.length === 0 && (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">No issues found for the selected filter.</Typography>
                        </Box>
                    )}

                    <Stack spacing={1.5}>
                        {filtered.map(issue => (
                            <IssueCard
                                key={issue._id || issue.id}
                                issue={issue}
                                onUpdateClick={setModalIssue}
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>


            {modalIssue && (
                <StatusUpdateModal
                    open={Boolean(modalIssue)}
                    issueId={modalIssue._id}
                    currentStatus={modalIssue.status}
                    onClose={() => setModalIssue(null)}
                    onSuccess={handleStatusUpdated}
                />
            )}
        </Box>
    );
}
