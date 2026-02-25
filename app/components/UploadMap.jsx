'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicMapContainer = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.MapContainer), { ssr: false });
const DynamicTileLayer = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.TileLayer), { ssr: false });
const DynamicLocationSelector = dynamic(() => import('@/app/components/ClientMap').then(mod => mod.LocationSelector), { ssr: false });

export default function UploadMap({ mapCenter, markerPosition, setMarkerPosition, setMap }) {
  return (
    <DynamicMapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={setMap}>
      <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
      <DynamicLocationSelector position={markerPosition} setPosition={setMarkerPosition}/>
    </DynamicMapContainer>
  );
}