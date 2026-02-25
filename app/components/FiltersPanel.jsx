'use client';
import React from 'react';
import { Box, Stack, Typography, FormControl, InputLabel, Select, MenuItem, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FilterList, Sort } from '@mui/icons-material';

export default function FiltersPanel({ statusFilter, priorityFilter, setStatusFilter, setPriorityFilter, sortOrder, setSortOrder }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = '#6366f1';

  return (
    <Box 
      sx={{ 
        mb: 4, 
        p: 3,
        borderRadius: 3,
        border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.12)'}`,
        background: isDark
          ? 'linear-gradient(140deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)'
          : 'linear-gradient(140deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.92) 100%)',
        boxShadow: isDark
          ? '0 18px 36px rgba(8, 15, 25, 0.45)'
          : '0 18px 36px rgba(99, 102, 241, 0.12)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
      }}
    >
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ fontSize: 20, color: isDark ? alpha('#cbd5f5', 0.95) : accent }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Filter by:
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={e => setStatusFilter(e.target.value)}
            sx={{
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(accent, 0.6),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: accent,
                borderWidth: 1.5,
              },
            }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={e => setPriorityFilter(e.target.value)}
            sx={{ borderRadius: 1.5 }}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { md: 4 } }}>
          <Sort sx={{ fontSize: 20, color: isDark ? alpha('#cbd5f5', 0.95) : accent }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Sort by:
          </Typography>
        </Box>

        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 160,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: 'all 0.3s ease',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)',
              '& fieldset': {
                borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: alpha(accent, 0.6),
              },
              '&.Mui-focused fieldset': {
                borderColor: accent,
                borderWidth: 1.5,
              },
            },
          }}
        >
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            label="Order"
            onChange={e => setSortOrder(e.target.value)}
          >
            <MenuItem value="latest">Latest</MenuItem>
            <MenuItem value="upvotes">Most Upvoted</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
