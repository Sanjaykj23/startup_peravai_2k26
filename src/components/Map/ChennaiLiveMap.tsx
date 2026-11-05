'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bus, getCrowdInfo } from '@/types';
import { APP_CONFIG } from '@/configs';
import { RefreshCw, Navigation, Bus as BusIcon, Layers } from 'lucide-react';

interface ChennaiLiveMapProps {
  buses: Bus[];
  selectedBusId?: string | null;
  onBusSelect?: (bus: Bus) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const ChennaiLiveMap: React.FC<ChennaiLiveMapProps> = ({
  buses,
  selectedBusId,
  onBusSelect,
  className = 'h-[600px] w-full rounded-2xl overflow-hidden',
  userLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const [activeBus, setActiveBus] = useState<Bus | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: APP_CONFIG.map.defaultCenter,
          zoom: APP_CONFIG.map.defaultZoom,
          zoomControl: false
        });

        // OpenStreetMap standard tiles (100% Free, NO API key required)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Update Bus Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient) return;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const currentMarkers = markersRef.current;

      // Keep track of active ids
      const activeIds = new Set<string>();

      buses.forEach((bus) => {
        if (!bus.current_location) return;

        const { latitude, longitude } = bus.current_location;
        activeIds.add(bus.id);

        const crowd = getCrowdInfo(bus.current_occupancy, bus.capacity);

        // Marker color by crowd status: Green (Empty), Yellow (Normal), Red (Crowded)
        const markerBg =
          crowd.status === 0
            ? '#10B981' // Green
            : crowd.status === 1
            ? '#F59E0B' // Yellow
            : '#EF4444'; // Red

        const isSelected = selectedBusId === bus.id;

        // Custom HTML DivIcon with pulsing dot and bus badge
        const customIcon = L.divIcon({
          className: 'custom-bus-marker',
          html: `
            <div style="width: 68px; height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer; user-select: none;">
              <div style="
                background: ${markerBg};
                color: #0f172a;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-weight: 800;
                font-size: 11px;
                padding: 3px 6px;
                border-radius: 8px;
                border: 2px solid #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.45);
                display: inline-flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
                transition: transform 0.2s ease;
                ${isSelected ? 'transform: scale(1.15); box-shadow: 0 0 16px ' + markerBg + ';' : ''}
              ">
                <span style="font-size: 11px;">🚌</span>
                <span>${bus.bus_number}</span>
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid ${markerBg};
                margin-top: -1px;
              "></div>
              <div style="
                width: 8px;
                height: 8px;
                background: ${markerBg};
                border-radius: 50%;
                margin-top: 1px;
                border: 1.5px solid #ffffff;
                box-shadow: 0 0 6px ${markerBg};
              "></div>
            </div>
          `,
          iconSize: [68, 44],
          iconAnchor: [34, 44],
          popupAnchor: [0, -44]
        });

        // Popup Content according to specification:
        // Bus Number, Route Number, Capacity, Current Occupancy, Crowd Status, Last Updated Timestamp
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              <strong style="font-size: 14px; color: #0f172a;">Bus ${bus.bus_number}</strong>
              <span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">Route ${bus.route_number}</span>
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px; font-weight: 500;">
              ${bus.route_name}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 8px; font-size: 11px;">
              <div>
                <span style="color: #64748b;">Capacity:</span><br/>
                <strong style="color: #0f172a; font-size: 13px;">${bus.capacity} seats</strong>
              </div>
              <div>
                <span style="color: #64748b;">Occupancy:</span><br/>
                <strong style="color: #0f172a; font-size: 13px;">${bus.current_occupancy} passengers</strong>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #64748b;">Crowd Status:</span>
              <span style="background: ${markerBg}25; color: ${markerBg}; border: 1px solid ${markerBg}60; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold;">
                ${crowd.label} (${crowd.percentage}%)
              </span>
            </div>
            <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 4px;">
              Updated: ${bus.current_location?.recorded_at ? new Date(bus.current_location.recorded_at).toLocaleTimeString('en-IN') : 'Just now'}
            </div>
          </div>
        `;

        if (currentMarkers.has(bus.id)) {
          const marker = currentMarkers.get(bus.id);
          marker.setLatLng([latitude, longitude]);
          marker.setIcon(customIcon);
          marker.setPopupContent(popupContent);
        } else {
          const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
          marker.bindPopup(popupContent, { offset: [0, -44], autoPan: true });
          marker.on('click', (e: any) => {
            if (e?.originalEvent) e.originalEvent.stopPropagation();
            setActiveBus(bus);
            if (onBusSelect) onBusSelect(bus);
            marker.openPopup();
          });
          currentMarkers.set(bus.id, marker);
        }
      });

      // Remove defunct markers
      currentMarkers.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.remove();
          currentMarkers.delete(id);
        }
      });

      // Pan to selected bus if provided
      if (selectedBusId) {
        const selected = buses.find(b => b.id === selectedBusId);
        if (selected?.current_location) {
          const targetCoords: [number, number] = [
            selected.current_location.latitude,
            selected.current_location.longitude
          ];
          map.flyTo(targetCoords, Math.max(map.getZoom(), 14), {
            duration: 0.8
          });
          const marker = currentMarkers.get(selectedBusId);
          if (marker) {
            setTimeout(() => {
              marker.openPopup();
            }, 300);
          }
        }
      }
    }

    updateMarkers();
  }, [buses, selectedBusId, isClient]);

  // User location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient || !userLocation) return;

    const loc = userLocation;

    async function updateUserLocationMarker() {
      if (!loc) return;
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      const userIcon = L.divIcon({
        className: 'user-pin-marker',
        html: `
          <div style="position: relative; width: 20px; height: 20px;">
            <div style="position: absolute; width: 20px; height: 20px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #2563eb; border: 2px solid #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([loc.latitude, loc.longitude]);
      } else {
        userMarkerRef.current = L.marker([loc.latitude, loc.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Your Current Location</b><br/>Near Chennai Central');
      }
    }

    updateUserLocationMarker();
  }, [userLocation, isClient]);

  return (
    <div className={`relative ${className} bg-slate-950 border border-slate-800`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs text-slate-200">
        <div className="font-bold text-amber-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <BusIcon className="w-3.5 h-3.5" />
          <span>Chennai Live Bus Legend</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-medium text-emerald-300">Empty (0 - 30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="font-medium text-amber-300">Normal Crowd (31 - 70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="font-medium text-rose-300">Overcrowded (71 - 100%)</span>
          </div>
        </div>
      </div>

      {/* Recenter Button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(APP_CONFIG.map.defaultCenter, APP_CONFIG.map.defaultZoom);
          }
        }}
        className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 p-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
      >
        <Navigation className="w-4 h-4 text-amber-400" />
        Center Chennai
      </button>
    </div>
  );
};

export default ChennaiLiveMap;
