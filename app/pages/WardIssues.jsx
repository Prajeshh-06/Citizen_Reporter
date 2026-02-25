'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Stack, 
  Typography, 
  Card, 
  CardContent,
  Paper,
  Chip,
  Grid,
  Skeleton,
  useTheme
} from '@mui/material';
import { TrendingUp, FilterList } from '@mui/icons-material';
import InfiniteScroll from 'react-infinite-scroll-component';
import IssueCard from '../components/IssueCard';
import FiltersPanel from '../components/FiltersPanel';
import PageHeader from '../components/PageHeader';

export default function WardIssues() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pageBackground = isDark
    ? 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 35%, #f8fafc 100%)';
  const { wardSlug } = useParams();
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const limit = 10;

  const fetchIssues = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/issues?ward=${encodeURIComponent(wardSlug)}&page=${reset ? 1 : page}&limit=${limit}`
      );
      const data = await res.json();
      const newIssues = Array.isArray(data) ? data : data.items || [];
      if (reset) {
        setIssues(newIssues);
        setPage(2);
      } else {
        setIssues(prev => [...prev, ...newIssues]);
        setPage(p => p + 1);
      }
      setHasMore(newIssues.length === limit);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [wardSlug, page]);

  useEffect(() => {
    setIssues([]);
    setPage(1);
    setHasMore(true);
    setError('');
    fetchIssues(true);
  }, [wardSlug, statusFilter, priorityFilter]);

  const filteredIssues = issues.filter(issue => {
    const statusMatch = statusFilter === 'all' || issue.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || issue.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const stats = {
    total: filteredIssues.length,
    open: filteredIssues.filter(i => i.status === 'open').length,
    inProgress: filteredIssues.filter(i => i.status === 'in_progress').length,
    resolved: filteredIssues.filter(i => i.status === 'resolved').length,
    high: filteredIssues.filter(i => i.priority === 'high').length,
  };

  if (loading && page === 1) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          pt: 4,
          pb: 8,
          px: 4
        }}>
          <Container maxWidth="lg">
            <Skeleton variant="rectangular" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
          </Container>
        </Box>
        <Container maxWidth="lg" sx={{ mt: 4, pb: 6, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={3}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
        <Container maxWidth="lg">
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Issues
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </Card>
        </Container>
      </Box>
    );
  }

  const wardName = wardSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Box sx={{ bgcolor: 'transparent', minHeight: '100vh', background: pageBackground }}>
      <PageHeader
        title="CIVIC ISSUES"
        summary={{
          titleText: wardName,
          subText: `${filteredIssues.length} ${filteredIssues.length === 1 ? 'issue' : 'issues'} reported`
        }}
      />

      <Container maxWidth="lg" sx={{ mt: 4, pb: 6, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 0.5 }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Total Issues
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444', mb: 0.5 }}>
                {stats.open}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Open
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                {stats.inProgress}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                In Progress
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5 }}>
                {stats.resolved}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Resolved
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList sx={{ color: '#667eea' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Filter Issues
            </Typography>
          </Box>
          <FiltersPanel
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            setStatusFilter={setStatusFilter}
            setPriorityFilter={setPriorityFilter}
          />
        </Box>

        {filteredIssues.length === 0 ? (
          <Card 
            elevation={0}
            sx={{ 
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`, 
              borderRadius: 3,
              bgcolor: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <TrendingUp sx={{ fontSize: 40, color: '#9ca3af' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No Issues Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No issues match the selected filters. Try adjusting your filter criteria.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <InfiniteScroll
            dataLength={filteredIssues.length}
            next={fetchIssues}
            hasMore={hasMore}
            loader={
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <Chip label="Loading more issues..." color="primary" variant="outlined" />
              </Box>
            }
            endMessage={
              <Paper 
                elevation={0}
                sx={{ 
                  textAlign: 'center', 
                  my: 3, 
                  p: 2,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  You've reached the end of the list
                </Typography>
              </Paper>
            }
          >
            <Stack spacing={3}>
              {filteredIssues.map(issue => (
                <IssueCard key={issue._id} issue={issue} />
              ))}
            </Stack>
          </InfiniteScroll>
        )}
      </Container>
    </Box>
  );
}