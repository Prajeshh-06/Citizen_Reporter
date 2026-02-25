'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Box, Container, Paper, Typography, Chip, Stack, Fade, useTheme } from '@mui/material';
import { LocationOn, Info } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import IssueHistoryModal from '../components/IssueHistoryModal';
import { Button } from '@mui/material';
import { apiFetch } from '../../lib/api';

const iconUrls = {
  red: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  blue: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  yellow: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  green: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadow: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
};

function createColoredIcon(color) {
  return new L.Icon({
    iconUrl: iconUrls[color] || iconUrls.red,
    shadowUrl: iconUrls.shadow,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const statusColors = {
  open: 'red',
  assigned: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
};

const statusLabels = {
  open: { label: 'Open', color: '#ef4444', bg: '#fee2e2' },
  assigned: { label: 'Assigned', color: '#3b82f6', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5' },
};

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
      setGeojson(geoData);
      setWardZones(wardData);
      setIssues(issuesData.items || issuesData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getWardName = (id) => {
    if (!wardZones || typeof wardZones !== 'object') return 'Unknown Ward';
    const idx = String(id).trim();
    return wardZones[idx] || 'Unknown Ward';
  };

  const issuesByStatus = issues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {});

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
    <Box sx={{ bgcolor: 'transparent', minHeight: '100vh', background: pageBackground }}>
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
              bgcolor: 'background.paper',
              boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Legend:</Typography>
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
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e5e7eb'}`,
            boxShadow: isDark 
              ? '0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.3)' 
              : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            bgcolor: 'background.paper'
          }}
        >
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={12}
            style={{ height: '75vh', minHeight: 500, width: '100%' }}
          >
            <TileLayer
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              attribution='&copy; OpenStreetMap contributors'
            />
            {geojson && <GeoJSON data={geojson} style={transparentStyle} onEachFeature={onEachWard} />}
            {issues.map(issue => issue.lat && issue.lng && (
              <Marker
                key={issue._id}
                position={[issue.lat, issue.lng]}
                icon={createColoredIcon(statusColors[issue.status] || 'red')}
              >
                <Popup>
                  <Box sx={{ minWidth: 200, fontFamily: 'system-ui' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                      {issue.title}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Status:</Typography>
                        <Chip
                          label={statusLabels[issue.status]?.label || issue.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: statusLabels[issue.status]?.bg,
                            color: statusLabels[issue.status]?.color
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Priority:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {issue.priority}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button size="small" onClick={() => handleOpenModal(issue)} sx={{ mt: 1 }}>View History</Button>
                  </Box>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
