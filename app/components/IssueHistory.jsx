'use client';
import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  PendingActions,
  HelpOutline,
  ArrowDownward,
} from '@mui/icons-material';

const statusConfig = {
  open: { icon: <HelpOutline />, color: '#ef4444' },
  in_progress: { icon: <PendingActions />, color: '#f59e0b' },
  resolved: { icon: <CheckCircle />, color: '#10b981' },
  closed: { icon: <CheckCircle />, color: '#6b7280' },
};

export default function IssueHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Typography variant="h6">No History</Typography>
        <Typography variant="body2" color="text.secondary">
          This issue has no status changes recorded.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        Issue History
      </Typography>
      <Box>
        {history.slice().reverse().map((item, index) => {
          const config = statusConfig[item.status] || { icon: <HelpOutline />, color: '#9e9e9e' };
          const isLast = index === history.length - 1;

          return (
            <Box key={index} sx={{ display: 'flex', position: 'relative', mb: isLast ? 0 : 3 }}>
              {!isLast && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '24px',
                    left: '11px',
                    width: '2px',
                    height: 'calc(100% + 16px)',
                    bgcolor: '#e0e0e0',
                  }}
                />
              )}

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  pr: 2,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: config.color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {React.cloneElement(config.icon, { sx: { fontSize: 16 } })}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {item.status.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(item.timestamp).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Typography>
                {item.assignedTo && (
                  <Typography variant="caption" color="text.secondary">
                    Assigned to: {item.assignedTo}
                  </Typography>
                )}
                {item.reason && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Reason: {item.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
