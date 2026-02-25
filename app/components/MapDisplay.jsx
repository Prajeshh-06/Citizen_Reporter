'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, Chip, Stack, Button } from '@mui/material';
import L from 'leaflet';

const DynamicMapContainer = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.MapContainer), { ssr: false });
const DynamicTileLayer = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.TileLayer), { ssr: false });
const DynamicGeoJSON = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.GeoJSON), { ssr: false });
const DynamicMarker = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.Marker), { ssr: false });
const DynamicPopup = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.Popup), { ssr: false });

const iconUrls = {
  red: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  blue: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  yellow: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  green: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadow: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
};

function createColoredIcon(color) {
  if (typeof window === 'undefined') return null;
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

export default function MapDisplay({ geojson, issues, onEachWard, transparentStyle, handleOpenModal }) {
  const isValidGeoJSON = geojson && geojson.type && (geojson.features || geojson.coordinates);
  
  return (
    <DynamicMapContainer
      center={[13.0827, 80.2707]}
      zoom={12}
      style={{ height: '75vh', minHeight: 500, width: '100%' }}
    >
      <DynamicTileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; OpenStreetMap contributors'
      />
      {isValidGeoJSON && <DynamicGeoJSON data={geojson} style={transparentStyle} onEachFeature={onEachWard} />}
      {issues.map(issue => issue.lat && issue.lng && (
        <DynamicMarker
          key={issue._id}
          position={[issue.lat, issue.lng]}
          icon={createColoredIcon(statusColors[issue.status] || 'red')}
        >
          <DynamicPopup>
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
          </DynamicPopup>
        </DynamicMarker>
      ))}
    </DynamicMapContainer>
  );
}