'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickMarker({ position, onPositionChange }) {
    useMapEvents({
        click(e) {
            onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    if (!position) return null;

    return (
        <Marker
            position={[position.lat, position.lng]}
            draggable
            eventHandlers={{
                dragend(e) {
                    const { lat, lng } = e.target.getLatLng();
                    onPositionChange({ lat, lng });
                },
            }}
        />
    );
}

const FALLBACK_CENTER = [13.0827, 80.2707]; // Chennai

export default function LocationPickerMap({
    onLocationSelect,
    height = '250px',
    defaultCenter,
}) {
    const [center, setCenter] = useState(defaultCenter ?? FALLBACK_CENTER);
    const [position, setPosition] = useState(null);
    const centerSet = useRef(false);

    useEffect(() => {
        if (centerSet.current) return;
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!centerSet.current) {
                    setCenter([pos.coords.latitude, pos.coords.longitude]);
                    centerSet.current = true;
                }
            },
            () => { },
            { timeout: 5000 }
        );
    }, []);

    const handlePositionChange = (coords) => {
        setPosition(coords);
        onLocationSelect?.(coords);
    };

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height, width: '100%', borderRadius: '8px', zIndex: 0 }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
    );
}
