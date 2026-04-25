import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function WorldMap({ logs }) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // 1. Get Unique IPs from logs
    const uniqueIps = [...new Set(logs.map(log => log.ip).filter(ip => ip))];
    
    // 2. Resolve Locations for each IP
    resolveLocations(uniqueIps);
  }, [logs]);

  const resolveLocations = async (ips) => {
    const newLocations = [];

    for (const ip of ips) {
      // CHECK: Is it a Private/Local IP? (Docker, LAN, Localhost)
      if (ip.startsWith('192.') || ip.startsWith('172.') || ip.startsWith('10.') || ip.startsWith('127.')) {
        // Mock Location for Local Traffic (e.g., Placed in Mumbai for demo)
        // Add some random jitter so they don't all stack on top of each other
        const lat = 19.0760 + (Math.random() * 0.1 - 0.05);
        const lon = 72.8777 + (Math.random() * 0.1 - 0.05);
        
        newLocations.push({ ip, lat, lon, country: 'Local Network (Docker)', city: 'Honeynet' });
        continue;
      }

      // EXTERNAL IP: Fetch real location from free API
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        if (data.status === 'success') {
          newLocations.push({ ip, lat: data.lat, lon: data.lon, country: data.country, city: data.city });
        }
      } catch (e) {
        // Ignore fetch errors
      }
    }
    setLocations(newLocations);
  };

  return (
    <div style={styles.mapContainer}>
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        {/* Dark Mode Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render a pulsing red dot for each attacker */}
        {locations.map((loc, idx) => (
          <CircleMarker 
            key={idx} 
            center={[loc.lat, loc.lon]} 
            pathOptions={{ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.5 }} 
            radius={8}
          >
            <Popup>
              <strong>{loc.ip}</strong><br />
              {loc.city}, {loc.country}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

const styles = {
  mapContainer: {
    height: '350px',
    width: '100%',
    marginBottom: '20px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #444',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  }
};