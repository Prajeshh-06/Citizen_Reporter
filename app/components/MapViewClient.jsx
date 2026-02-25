'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Paper, Typography, Chip, Stack, Fade, useTheme } from '@mui/material';
import { LocationOn, Info } from '@mui/icons-material';
import PageHeader from '@/app/components/PageHeader.jsx';
import IssueHistoryModal from '@/app/components/IssueHistoryModal';
import { Button } from '@mui/material';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api';

const DynamicMapDisplay = dynamic(() => import('@/app/components/MapDisplay'), { ssr: false });

export default function MapView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pageBackground = isDark
    ? 'linear-gradient(180deg, #0f172a 0%, #111827 40%, #0f172a 100%)'
    : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 35%, #f8fafc 100%)';
  const [geojson, setGeojson] = useState(null);
  const [wardZones, setWardZones] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const statusLabels = {
    open: { label: 'Open', color: '#ef4444', bg: '#fee2e2' },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
    resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5' },
    assigned: { label: 'Assigned', color: '#3b82f6', bg: '#dbeafe' },
  };

  const handleOpenModal = (issue) => {
    setSelectedIssue(issue);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedIssue(null);
    setModalOpen(false);
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/geo/divisions').then(res => res.json()),
      apiFetch('/api/geo/ward-zones').then(res => res.json()),
      apiFetch('/api/issues?limit=100').then(res => res.json())
    ])
    .then(([geoData, wardData, issuesData]) => {
      console.log('Loaded GeoJSON:', geoData?.type, 'features:', geoData?.features?.length);
      if (geoData && geoData.type && geoData.features) {
        setGeojson(geoData);
      } else {
        console.error('Invalid GeoJSON structure:', geoData);
      }
      setWardZones(wardData);
      setIssues(Array.isArray(issuesData.items) ? issuesData.items : (Array.isArray(issuesData) ? issuesData : []));
      setLoading(false);
    })
    .catch(err => {
      console.error('Error loading map data:', err);
      setLoading(false);
    });
  }, []);

  const getWardName = (id) => {
    if (!wardZones || typeof wardZones !== 'object') return 'Unknown Ward';
    const idx = String(id).trim();
    return wardZones[idx] || 'Unknown Ward';
  };

  const issuesByStatus = Array.isArray(issues) ? issues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {}) : {};
  
  console.log('Issues by status:', issuesByStatus);
  console.log('Total issues:', issues.length);

  const transparentStyle = { fillColor: 'transparent', weight: 0, opacity: 0, fillOpacity: 0 };
  const highlightStyle = { fillColor: '#667eea', weight: 3, color: '#667eea', fillOpacity: 0.2 };

  const onEachWard = (feature, layer) => {
    const rawName = feature.properties?.Name;
    const wardName = rawName ? getWardName(rawName) : 'Unknown Ward';
    const wardId = rawName ? rawName.trim() : 'N/A';

    layer.bindPopup(`
      <div style="font-family: system-ui; padding: 6px;">
        <strong style="font-size: 14px; color: #1f2937;">${wardName}</strong><br/>
        <span style="font-size: 12px; color: #6b7280;">Ward ID: ${wardId}</span>
      </div>
    `);

    layer.on({
      mouseover: e => {
        e.target.setStyle(highlightStyle);
        e.target.openPopup();
      },
      mouseout: e => {
        e.target.setStyle(transparentStyle);
        e.target.closePopup();
      },
      click: () => {
        const wardSlug = wardName.toLowerCase().replace(/\s+/g, '-');
        router.push(`/wards/${wardSlug}`);
      }
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', background: pageBackground }}>
      <PageHeader
        title="CIVIC MAP"
        summary={{
          titleText: 'Explore Chennai',
          subText: 'Interactive map showing civic issues across wards'
        }}
      />

      <Container maxWidth="xl" sx={{ mt: 4, pb: 4, px: { xs: 2, sm: 3 } }}>
        <Fade in={!loading}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 4,
              borderRadius: 3,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              bgcolor: '#fff',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info sx={{ fontSize: 18, color: '#6b7280' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Legend:</Typography>
            </Box>
            {Object.entries(statusLabels).map(([key, { label, color, bg }]) => (
              <Chip
                key={key}
                label={`${label} (${issuesByStatus[key] || 0})`}
                size="small"
                sx={{
                  bgcolor: bg,
                  color: color,
                  fontWeight: 600,
                  border: `1px solid ${color}30`
                }}
              />
            ))}
            <Chip
              icon={<LocationOn />}
              label="Click ward to view issues"
              size="small"
              variant="outlined"
              sx={{ ml: 'auto', fontWeight: 500 }}
            />
          </Paper>
        </Fade>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}
        >
          <DynamicMapDisplay
            geojson={geojson}
            issues={issues}
            onEachWard={onEachWard}
            transparentStyle={transparentStyle}
            handleOpenModal={handleOpenModal}
          />
        </Paper>
        {selectedIssue && (
          <IssueHistoryModal
            open={modalOpen}
            handleClose={handleCloseModal}
            history={selectedIssue.history}
          />
        )}
      </Container>
    </Box>
  );
}