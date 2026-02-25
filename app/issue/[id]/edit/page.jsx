
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  Stack,
  Chip,
  Skeleton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PageHeader from '../../../components/PageHeader';
import IssueHistory from '../../../components/IssueHistory';

import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function EditIssue() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pageBackground = isDark
    ? 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 35%, #f8fafc 100%)';
  const { id } = useParams();
  const router = useRouter();
  const { user, login } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setAssignedTo(user.email);
    } else {
      setAssignedTo('');
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/issues/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Issue not found');
        }
        return res.json();
      })
      .then((data) => {
        setIssue(data);
        setStatus(data.status);
        setAssignedTo(user?.email || '');
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message);
        setLoading(false);
      });
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!user || !user.token) {
      setFormError('You must be logged in to update an issue.');
      return;
    }

    if (!statusChangeReason) {
      setFormError('Status change reason is required.');
      return;
    }
    if (statusChangeReason.length < 5) {
      setFormError('Status change reason must be at least 5 characters long.');
      return;
    }
    try {
      const body = { status, assignedTo: user.email, statusChangeReason };
      const res = await apiFetch(`/api/issues/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map(d => d.message).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || 'Failed to update issue');
      }
      router.push('/dashboard');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const statusStyles = useMemo(
    () => ({
      open: {
        label: 'Open',
        color: theme.palette.warning.main,
        bg: alpha(theme.palette.warning.main, isDark ? 0.25 : 0.14),
      },
      in_progress: {
        label: 'In Progress',
        color: theme.palette.info.main,
        bg: alpha(theme.palette.info.main, isDark ? 0.25 : 0.14),
      },
      resolved: {
        label: 'Resolved',
        color: theme.palette.success.main,
        bg: alpha(theme.palette.success.main, isDark ? 0.25 : 0.14),
      },
    }),
    [isDark, theme],
  );

  const statusKey = (status || issue?.status || 'open').toLowerCase();
  const statusInfo = statusStyles[statusKey] || statusStyles.open;

  function formatValue(value) {
    if (!value || typeof value !== 'string') return 'Not specified';
    return value
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  const priorityChip = useMemo(() => {
    const key = (issue?.priority || 'medium').toLowerCase();
    const colorMap = {
      high: theme.palette.error.main,
      medium: theme.palette.warning.main,
      low: theme.palette.success.main,
    };
    const color = colorMap[key] || theme.palette.primary.main;
    return {
      label: `${formatValue(key)} Priority`,
      color,
      bg: alpha(color, isDark ? 0.22 : 0.12),
    };
  }, [issue?.priority, isDark, theme]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'transparent', background: pageBackground }}>
        <PageHeader
          title="Manage Issue"
          summary={{ titleText: 'Loading issue details', subText: 'Fetching the latest information…' }}
        />
        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, mt: 4, maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 4 }} alignItems="stretch">
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12)}`,
                  background: isDark
                    ? 'linear-gradient(140deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)'
                    : 'linear-gradient(140deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.94) 100%)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12)}`,
                  background: isDark
                    ? 'linear-gradient(150deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.86) 100%)'
                    : 'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
                  <Stack spacing={2.5}>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Skeleton key={idx} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                    ))}
                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (fetchError || !issue) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'transparent', background: pageBackground }}>
        <PageHeader
          title="Issue unavailable"
          summary={{
            titleText: 'We couldn’t load this issue',
            subText: fetchError || 'Please try again later or return to the dashboard.',
          }}
        />
        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, mt: 4, maxWidth: 720, mx: 'auto', width: '100%' }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.3 : 0.18)}`,
              background: isDark
                ? 'linear-gradient(150deg, rgba(30, 41, 59, 0.92) 0%, rgba(30, 41, 59, 0.85) 100%)'
                : 'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 242, 0.92) 100%)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {fetchError || 'The requested issue could not be found.'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/dashboard')}
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1.25,
                  backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 12px 30px rgba(99, 102, 241, 0.28)',
                }}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'transparent', background: pageBackground }}>
        <PageHeader
          title="Manage Issue"
          summary={{
            titleText: 'Sign in required',
            subText: 'Log in to make changes to this issue.',
          }}
        />
        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, mt: 4, maxWidth: 720, mx: 'auto', width: '100%' }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.14)}`,
              background: isDark
                ? 'linear-gradient(150deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.85) 100%)'
                : 'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%)',
              textAlign: 'center',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Authentication required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Please sign in with your Google account to update this issue.
              </Typography>
              <Button
                variant="contained"
                onClick={login}
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1.25,
                  backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 18px 38px rgba(99, 102, 241, 0.28)',
                  color: '#fff',
                  '&:hover': {
                    backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 22px 44px rgba(99, 102, 241, 0.32)',
                  },
                }}
              >
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'transparent', background: pageBackground }}>
      <PageHeader
        title="Manage Issue"
        summary={{
          titleText: issue.title || 'Manage status updates',
          subText: issue._id ? `Reference ID • ${issue._id}` : 'Review the latest activity and keep residents informed.',
        }}
      />
        <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, mt: 4, maxWidth: 1280, mx: 'auto', width: '100%' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, lg: 4 }} alignItems="stretch">
          <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex' }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.24 : 0.14)}`,
                background: isDark
                  ? 'linear-gradient(160deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 33, 54, 0.88) 100%)'
                  : 'linear-gradient(160deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.94) 100%)',
                boxShadow: isDark
                  ? '0 24px 52px rgba(8, 15, 25, 0.45)'
                  : '0 24px 52px rgba(15, 23, 42, 0.12)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Update status
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Communicate progress with residents by updating the status and providing a short explanation.
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        value={status}
                        label="Status"
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Status change reason"
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      required
                      helperText="Provide a short explanation (minimum 5 characters)."
                      error={statusChangeReason.length > 0 && statusChangeReason.length < 5}
                    />

                    <TextField
                      label="Assigned to"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      fullWidth
                      disabled
                    />

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip
                        label={statusInfo.label}
                        sx={{
                          borderRadius: '999px',
                          fontWeight: 600,
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bg,
                          border: `1px solid ${alpha(statusInfo.color, 0.35)}`,
                        }}
                      />
                      <Chip
                        label={priorityChip.label}
                        sx={{
                          borderRadius: '999px',
                          fontWeight: 600,
                          color: priorityChip.color,
                          backgroundColor: priorityChip.bg,
                          border: `1px solid ${alpha(priorityChip.color, 0.35)}`,
                        }}
                      />
                    </Stack>

                    {formError && (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                        {formError}
                      </Typography>
                    )}

                    <Button
                      type="submit"
                      size="large"
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        py: 1.25,
                        backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        boxShadow: '0 18px 38px rgba(99, 102, 241, 0.28)',
                        color: '#fff',
                        '&:hover': {
                          backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          boxShadow: '0 22px 44px rgba(99, 102, 241, 0.32)',
                        },
                      }}
                    >
                      Save changes
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex' }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12)}`,
                background: isDark
                  ? 'linear-gradient(150deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.85) 100%)'
                  : 'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Update history
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  A chronological record of actions taken on this issue for transparency and accountability.
                </Typography>
                <Box sx={{ flexGrow: 1, minHeight: 220 }}>
                  <IssueHistory history={issue.history || []} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
