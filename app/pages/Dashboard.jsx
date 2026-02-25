import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, List, Grid, Card, CardContent, Chip, LinearProgress, useTheme } from '@mui/material';
import { TrendingUp, CheckCircle, Warning, PendingActions } from '@mui/icons-material';
import IssueCard from '../components/IssueCard';
import PageHeader from '../components/PageHeader';
import FiltersPanel from '../components/FiltersPanel';
import { apiFetch } from '../../lib/api';

const StatCard = ({ title, value, icon, color, gradient }) => (
  <Card
    elevation={2}
    sx={{
      borderRadius: 3,
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 16px 32px rgba(0,0,0,0.1)',
      },
    }}
  >
    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: gradient,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          ml: 2,
        }}
      >
        {icon}
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pageBackground = isDark
    ? 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 35%, #f8fafc 100%)';
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('latest');

  useEffect(() => {
    apiFetch('/api/issues?limit=100&sort=createdAt:desc')
      .then(res => res.json())
      .then(data => {
        setIssues(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIssues([]);
        setLoading(false);
      });
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const statusMatch = statusFilter === 'all' || issue.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || issue.priority === priorityFilter;
      return statusMatch && priorityMatch;
    }).sort((a, b) => {
      if (sortOrder === 'latest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOrder === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return 0;
    });
  }, [issues, statusFilter, priorityFilter, sortOrder]);

  const stats = {
    total: filteredIssues.length,
    open: filteredIssues.filter(i => i.status === 'open').length,
    inProgress: filteredIssues.filter(i => i.status === 'in_progress').length,
    resolved: filteredIssues.filter(i => i.status === 'resolved').length,
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 6, bgcolor: 'transparent', background: pageBackground }}>
      <PageHeader
        title="Dashboard"
        summary={{
          titleText: 'Overview of civic issues',
          subText: 'Monitor and track issues in real-time',
        }}
      />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Issues"
              value={stats.total}
              icon={<TrendingUp sx={{ color: '#fff', fontSize: 28 }} />}
              color="#667eea"
              gradient="linear-gradient(135deg,#667eea 0%,#5a67d8 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Open Issues"
              value={stats.open}
              icon={<Warning sx={{ color: '#fff', fontSize: 28 }} />}
              color="#ef4444"
              gradient="linear-gradient(135deg,#f87171 0%,#ef4444 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={<PendingActions sx={{ color: '#fff', fontSize: 28 }} />}
              color="#f59e0b"
              gradient="linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={<CheckCircle sx={{ color: '#fff', fontSize: 28 }} />}
              color="#10b981"
              gradient="linear-gradient(135deg,#34d399 0%,#10b981 100%)"
            />
          </Grid>
        </Grid>

        <FiltersPanel
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          setStatusFilter={setStatusFilter}
          setPriorityFilter={setPriorityFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <Box
          sx={{
            p: 4,
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Recent Issues
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest reported civic issues
              </Typography>
            </Box>
            {loading && <Chip label="Loading..." size="small" color="primary" variant="outlined" />}
          </Box>

          {loading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

          <List sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
            {issues.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No issues reported yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Issues will appear here once they are reported
                </Typography>
              </Box>
            ) : (
              filteredIssues.map(issue => <IssueCard key={issue._id} issue={issue} />)
            )}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
