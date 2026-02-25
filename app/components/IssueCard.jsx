'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
  useTheme
} from '@mui/material';
import {
  ThumbUp,
  LocationOn,
  AccessTime,
  Warning,
  CheckCircle,
  PendingActions,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  open: {
    color: '#ef4444',
    label: 'Open',
    bg: '#fee2e2',
    icon: Warning
  },
  in_progress: {
    color: '#f59e0b',
    label: 'In Progress',
    bg: '#fef3c7',
    icon: PendingActions
  },
  assigned: {
    color: '#3b82f6',
    label: 'Assigned',
    bg: '#dbeafe',
    icon: PendingActions
  },
  resolved: {
    color: '#10b981',
    label: 'Resolved',
    bg: '#d1fae5',
    icon: CheckCircle
  },
};

const priorityConfig = {
  low: { color: '#10b981', bg: '#d1fae5' },
  medium: { color: '#f59e0b', bg: '#fef3c7' },
  high: { color: '#ef4444', bg: '#fee2e2' },
};

export default function IssueCard({ issue }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const statusInfo = statusConfig[issue.status] || statusConfig.open;
  const priorityInfo = priorityConfig[issue.priority] || priorityConfig.medium;
  const StatusIcon = statusInfo.icon;

  const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const upvotedByArray = Array.isArray(issue.upvotedBy) ? issue.upvotedBy : [];
  const uid = user?.id ?? user?.sub ?? user?.userId ?? null;
  const isInitiallyUpvoted = Boolean(uid && upvotedByArray.some(u => String(u) === String(uid)));
  const [isUpvoted, setIsUpvoted] = useState(isInitiallyUpvoted);

  useEffect(() => {
    setUpvotes(issue.upvotes || 0);
  }, [issue.upvotes]);

  useEffect(() => {
    const arr = Array.isArray(issue.upvotedBy) ? issue.upvotedBy : [];
    setIsUpvoted(Boolean(uid && arr.some(u => String(u) === String(uid))));
  }, [user, issue.upvotedBy, uid]);

  const handleUpvote = async () => {
    if (!user) {
      alert('Please login to upvote.');
      return;
    }
    setIsUpvoting(true);
    try {
      try { console.debug('Upvote token snippet:', String(user.token).slice(0, 40), '...'); } catch (_) { }

      const res = await fetch(`/api/issues/${issue._id}/upvote`, {
        method: 'POST',
        headers: {
          'x-api-key': 'dev-key',
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.warn('Upvote failed', res.status, bodyText);
        let parsed = null;
        try { parsed = JSON.parse(bodyText); } catch (_) { }
        const message = parsed?.error || bodyText || `HTTP ${res.status}`;
        throw new Error(message);
      }
      const data = await res.json();
      setUpvotes(data.upvotes || 0);
      try {
        const arr = Array.isArray(data.upvotedBy) ? data.upvotedBy : [];
        const upvotedNow = uid && arr.some(u => String(u) === String(uid));
        setIsUpvoted(Boolean(upvotedNow));
      } catch (_) { }
    } catch (err) {
      console.error('Upvote error:', err.message || err);
      if (String(err.message).toLowerCase().includes('invalid token') || String(err.message).toLowerCase().includes('authorization')) {
        alert(`Upvote failed: ${err.message}\n\nCheck DevTools Network -> request headers to confirm Authorization header is present and correct.`);
      } else {
        alert(err.message || 'Error upvoting issue');
      }
    } finally {
      setIsUpvoting(false);
    }
  };

  const getImageSource = () => {
    const imageData = issue.photo || issue.photoUrl || issue.image;
    if (!imageData) return null;

    const raw = String(imageData).trim();

    if (raw.match(/^[A-Za-z0-9+/=]+$/)) {
      return `data:image/jpeg;base64,${raw}`;
    }

    if (raw.startsWith('data:image/')) {
      return raw;
    }

    if (raw.match(/^https?:\/\//)) {
      return raw;
    }

    return null;
  };

  const [imageSource, setImageSource] = useState(() => getImageSource());
  const [imageError, setImageError] = useState(false);

  console.log('Issue data:', {
    _id: issue._id,
    photoUrl: issue.photoUrl,
    photo: issue.photo,
    image: issue.image,
    calculatedUrl: imageSource
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/issue/${issue._id}/edit`} style={{ textDecoration: 'none' }}>
      <Card
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          bgcolor: 'background.paper',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            background: statusInfo.color,
            opacity: 0.7,
          },
          '&:hover': {
            boxShadow: isDark
              ? '0 20px 48px rgba(0, 0, 0, 0.5)'
              : '0 20px 48px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-6px)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
            '&::before': {
              opacity: 1,
              width: 5,
            },
          },
        }}
      >
        {imageSource && !imageError ? (
          <CardMedia
            component="img"
            sx={{
              width: { xs: '100%', sm: 220 },
              height: { xs: 200, sm: 'auto' },
              minHeight: { sm: 200 },
              objectFit: 'cover',
              flexShrink: 0,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
            image={imageSource}
            alt={issue.title}
            onError={(e) => {
              console.error('Failed to load image:', imageSource);
              setImageError(true);
            }}
          />
        ) : imageError ? (
          <Box
            sx={{
              width: { xs: '100%', sm: 220 },
              height: { xs: 200, sm: 'auto' },
              minHeight: { sm: 200 },
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              flexShrink: 0,
            }}
          >
            <Typography variant="body2" color="inherit">
              Image Not Available
            </Typography>
          </Box>
        ) : null}

        <CardContent sx={{ flex: 1, p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, gap: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: 'text.primary',
                    flex: 1,
                  }}
                >
                  {issue.title}
                </Typography>
                <Chip
                  icon={<StatusIcon sx={{ fontSize: 14 }} />}
                  label={statusInfo.label}
                  size="small"
                  sx={{
                    bgcolor: statusInfo.bg,
                    color: statusInfo.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26,
                    border: `1.5px solid ${statusInfo.color}50`,
                    '& .MuiChip-icon': {
                      color: statusInfo.color,
                      marginLeft: '6px',
                    },
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.6,
                  mb: 2,
                }}
              >
                {issue.description}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={2}
              sx={{
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Chip
                label={issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1) || 'Medium'}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: priorityInfo.bg,
                  color: priorityInfo.color,
                  border: `1px solid ${priorityInfo.color}50`,
                  borderRadius: 1.5,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />

              {(issue.ward || issue.wardName || (issue.lat && issue.lng)) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {issue.ward || issue.wardName || `${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}`}
                  </Typography>
                </Box>
              )}

              {issue.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(issue.createdAt)}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1 }}>
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  if (user && !isUpvoting) handleUpvote();
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: isUpvoted
                    ? isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)'
                    : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isUpvoted
                    ? isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)'
                    : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                  transition: 'all 0.2s ease',
                  cursor: user ? 'pointer' : 'not-allowed',
                  opacity: !user || isUpvoting ? 0.6 : 1,
                  '&:hover': user && !isUpvoting ? {
                    bgcolor: isUpvoted
                      ? isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.12)'
                      : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    transform: 'translateY(-2px)',
                    boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                  } : {},
                }}
              >
                <ThumbUp sx={{
                  fontSize: 16,
                  color: isUpvoted ? '#2563eb' : 'text.secondary',
                  transition: 'all 0.2s ease',
                }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: isUpvoted ? '#2563eb' : 'text.primary',
                  }}
                >
                  {upvotes}
                </Typography>
              </Box>
              {!user && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Login to upvote
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Link>
  );
}