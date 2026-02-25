'use client'

import dynamic from 'next/dynamic';

const MapViewClient = dynamic(() => import('@/app/components/MapViewClient'), { ssr: false });

export default function DynamicMapView() {
  return <MapViewClient />;
}
