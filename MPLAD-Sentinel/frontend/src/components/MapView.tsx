import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import type { Project, ProjectWithDistance, UserLocation, RiskLevel } from '../types';

interface Props {
  projects: (Project | ProjectWithDistance)[];
  userLocation?: UserLocation | null;
  height?: string;
  selectedProjectId?: string;
}

const RISK_PIN_COLORS: Record<RiskLevel, { bg: string; border: string; text: string }> = {
  Low:      { bg: '#22c55e', border: '#16a34a', text: '#15803d' },
  Medium:   { bg: '#eab308', border: '#ca8a04', text: '#a16207' },
  High:     { bg: '#f97316', border: '#ea580c', text: '#c2410c' },
  Critical: { bg: '#ef4444', border: '#dc2626', text: '#b91c1c' },
};

export default function MapView({ projects, userLocation, height = '460px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: User location or first project or India center
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : projects.length > 0 && projects[0].latitude && projects[0].longitude
        ? [projects[0].latitude, projects[0].longitude]
        : [22.9734, 78.6569]; // India center

      const defaultZoom = userLocation ? 12 : projects.length > 0 ? 9 : 5;

      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const boundsGroup = L.featureGroup();

      // 1. Render User Marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-loc-marker',
          html: `
            <div style="
              position: relative;
              width: 22px;
              height: 22px;
              background-color: #2563eb;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 2px 6px rgba(0,0,0,0.3);
            ">
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px solid #3b82f6;
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                opacity: 0.75;
              "></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        userMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 2px;">
            <div style="font-weight: 700; color: #1d4ed8; font-size: 13px; margin-bottom: 2px;">📍 Your Current Location</div>
            <div style="font-size: 11px; color: #64748b;">Accuracy: ±${Math.round(userLocation.accuracy)} meters</div>
          </div>
        `);

        boundsGroup.addLayer(userMarker);
      }

      // 2. Render Project Markers
      projects.forEach((proj) => {
        if (!proj.latitude || !proj.longitude) return;

        const colors = RISK_PIN_COLORS[proj.riskLevel] || RISK_PIN_COLORS.Low;
        const distKm = 'distance' in proj ? (proj as ProjectWithDistance).distance : undefined;
        const distBadge = distKm !== undefined
          ? `<span style="display:inline-block; font-size:10px; font-weight:600; color:#2563eb; background:#eff6ff; padding:2px 6px; border-radius:999px; margin-top:4px;">${distKm < 1 ? Math.round(distKm * 1000) + ' m away' : distKm.toFixed(1) + ' km away'}</span>`
          : '';

        const pinIcon = L.divIcon({
          className: 'custom-proj-pin',
          html: `
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 50% 50% 50% 0;
              background: ${colors.bg};
              border: 2px solid #ffffff;
              transform: rotate(-45deg);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ffffff;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        const projMarker = L.marker([proj.latitude, proj.longitude], { icon: pinIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: ${colors.text}; background: ${colors.bg}20; padding: 2px 6px; border-radius: 4px;">
                ${proj.riskLevel} Risk
              </span>
              <span style="font-size: 10px; color: #64748b; font-weight: 500;">
                ${proj.status}
              </span>
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
              ${proj.name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
              📍 ${proj.district}, ${proj.state}
            </div>
            ${distBadge ? `<div style="margin-bottom: 6px;">${distBadge}</div>` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 8px; background: #f8fafc; padding: 4px 6px; border-radius: 6px;">
              <span>Sanctioned: <strong>₹${proj.sanctionedAmount}L</strong></span>
              <span>Progress: <strong>${proj.physicalProgress}%</strong></span>
            </div>
            <a href="/projects/${proj.projectId}" style="
              display: block;
              text-align: center;
              background: #1d4ed8;
              color: #ffffff;
              font-size: 11px;
              font-weight: 600;
              padding: 6px 10px;
              border-radius: 6px;
              text-decoration: none;
            ">
              View Project Details &rarr;
            </a>
          </div>
        `;

        projMarker.bindPopup(popupContent);
        boundsGroup.addLayer(projMarker);
      });

      // Fit map bounds if there are markers
      if (boundsGroup.getLayers().length > 0) {
        map.fitBounds(boundsGroup.getBounds().pad(0.15), {
          maxZoom: 15,
        });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [projects, userLocation]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
    />
  );
}
