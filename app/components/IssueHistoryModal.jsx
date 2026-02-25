'use client';
import React from 'react';
import {
  Box,
  Modal,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import IssueHistory from './IssueHistory';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function IssueHistoryModal({ open, handleClose, history }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="issue-history-modal-title"
      aria-describedby="issue-history-modal-description"
    >
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="issue-history-modal-title" variant="h6" component="h2">
            Issue History
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        <IssueHistory history={history} />
      </Box>
    </Modal>
  );
}
