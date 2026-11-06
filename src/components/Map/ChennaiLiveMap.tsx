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

// Global cache for turn-by-turn road geometry snapped strictly to Chennai streets
const roadGeometryCache = new Map<string, [number, number][]>();

async function fetchRoadSnappedCoordinates(stops: any[]): Promise<[number, number][]> {
  if (!stops || stops.length < 2) {
    return stops.map((s: any) => [Number(s.latitude), Number(s.longitude)]);
  }

  const cacheKey = stops
    .map((s: any) => `${Number(s.latitude).toFixed(4)},${Number(s.longitude).toFixed(4)}`)
    .join(';');

  if (roadGeometryCache.has(cacheKey)) {
    return roadGeometryCache.get(cacheKey)!;
  }

  try {
    // Format lon,lat coordinates list for OSRM driving engine
    const coordsStr = stops
      .map((s: any) => `${Number(s.longitude).toFixed(6)},${Number(s.latitude).toFixed(6)}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]?.geometry?.coordinates) {
        // GeoJSON gives [lon, lat], Leaflet polyline expects [lat, lon]
        const roadPoints: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );
        roadGeometryCache.set(cacheKey, roadPoints);
        return roadPoints;
      }
    }
  } catch (err) {
    console.warn('OSRM road routing fallback to direct stop coords:', err);
  }

  // Fallback to direct stop coordinates if OSRM is unreachable
  return stops.map((s: any) => [Number(s.latitude), Number(s.longitude)]);
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
  const routeLayerRef = useRef<any>(null);
  const routeCacheRef = useRef<Map<string, any[]>>(new Map());
  const prevSelectedBusIdRef = useRef<string | null>(null);
  const lastDrawnRouteBusIdRef = useRef<string | null>(null);
  const lastDrawnStopIdRef = useRef<string | null>(null);
  const [activeBus, setActiveBus] = useState<Bus | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<{
    busNumber: string;
    routeNumber: string;
    routeName: string;
    currentStopName: string;
    nextStopName: string;
    remainingStopsCount: number;
    totalStopsCount: number;
    routeCoords: [number, number][];
  } | null>(null);

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

        // Dedicated layer group for Google Maps-style route paths and station pins
        const routeLayer = L.layerGroup().addTo(map);
        routeLayerRef.current = routeLayer;

        mapInstanceRef.current = map;

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ pan: false });
          }
        }, 200);

        // ResizeObserver to ensure map tiles immediately adapt to layout changes
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
          const ro = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize({ pan: false });
            }
          });
          ro.observe(mapContainerRef.current);
          (map as any)._ro = ro;
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        if ((mapInstanceRef.current as any)._ro) {
          (mapInstanceRef.current as any)._ro.disconnect();
        }
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Highlight Route Path for Selected Bus (Google Maps Transit Style)
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient) return;

    let isCancelled = false;

    async function drawSelectedRoute() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const routeLayer = routeLayerRef.current;

      if (!routeLayer) return;

      if (!selectedBusId) {
        routeLayer.clearLayers();
        setSelectedRouteInfo(null);
        lastDrawnRouteBusIdRef.current = null;
        lastDrawnStopIdRef.current = null;
        prevSelectedBusIdRef.current = null;
        return;
      }

      const selectedBus = buses.find(b => b.id === selectedBusId);
      if (!selectedBus || !selectedBus.route_id) {
        routeLayer.clearLayers();
        setSelectedRouteInfo(null);
        lastDrawnRouteBusIdRef.current = null;
        lastDrawnStopIdRef.current = null;
        return;
      }

      // Check cache first or fetch route stops
      let stops = routeCacheRef.current.get(selectedBus.route_id);
      if (!stops) {
        try {
          const res = await fetch(`/api/routes?routeId=${selectedBus.route_id}`);
          const data = await res.json();
          if (data.stops) {
            stops = data.stops;
            routeCacheRef.current.set(selectedBus.route_id, data.stops);
          }
        } catch (e) {
          console.error('Failed to load route stops:', e);
        }
      }

      if (isCancelled || !stops || stops.length === 0) return;

      const validStops = stops
        .filter((s: any) => s.latitude && s.longitude)
        .sort((a: any, b: any) => a.stop_sequence - b.stop_sequence);

      if (validStops.length === 0) return;

      const allCoords: [number, number][] = validStops.map((s: any) => [
        Number(s.latitude),
        Number(s.longitude)
      ]);

      // Determine current bus stop index in route sequence
      let currentIdx = 0;
      if (selectedBus.current_trip?.current_stop_id) {
        const found = validStops.findIndex((s: any) => s.stop_id === selectedBus.current_trip?.current_stop_id);
        if (found >= 0) currentIdx = found;
      } else if (selectedBus.current_location) {
        const busLat = selectedBus.current_location.latitude;
        const busLon = selectedBus.current_location.longitude;
        let minDist = Infinity;
        validStops.forEach((s: any, idx: number) => {
          const dist = Math.hypot(s.latitude - busLat, s.longitude - busLon);
          if (dist < minDist) {
            minDist = dist;
            currentIdx = idx;
          }
        });
      }

      const currentStopId = selectedBus.current_trip?.current_stop_id || validStops[currentIdx]?.stop_id || null;
      const isAlreadyDrawn = lastDrawnRouteBusIdRef.current === selectedBusId && lastDrawnStopIdRef.current === currentStopId;

      // Update selected route info HUD
      const nextStop = validStops[currentIdx + 1];
      setSelectedRouteInfo({
        busNumber: selectedBus.bus_number,
        routeNumber: selectedBus.route_number,
        routeName: selectedBus.route_name,
        currentStopName: validStops[currentIdx]?.stop_name || 'Origin',
        nextStopName: nextStop ? nextStop.stop_name : 'Final Terminus',
        remainingStopsCount: Math.max(0, validStops.length - 1 - currentIdx),
        totalStopsCount: validStops.length,
        routeCoords: allCoords
      });

      // If route & stop sequence are already drawn on map, do not wipe layers or re-trigger fitBounds
      if (isAlreadyDrawn) {
        return;
      }

      // Re-draw route path strictly through roads
      routeLayer.clearLayers();
      lastDrawnRouteBusIdRef.current = selectedBusId;
      lastDrawnStopIdRef.current = currentStopId;

      const pastStops = validStops.slice(0, currentIdx + 1);
      const forwardStops = validStops.slice(currentIdx);

      // Fetch turn-by-turn road geometries snapped strictly to Chennai streets
      const [pastRoadCoords, forwardRoadCoords] = await Promise.all([
        pastStops.length > 1 ? fetchRoadSnappedCoordinates(pastStops) : Promise.resolve([]),
        forwardStops.length > 1 ? fetchRoadSnappedCoordinates(forwardStops) : Promise.resolve([])
      ]);

      if (isCancelled) return;

      // 1. Draw Past Route Path (subtle / dotted) strictly along roads
      if (pastRoadCoords.length > 1) {
        L.polyline(pastRoadCoords, {
          color: '#64748b',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayer);
      }

      // 2. Draw Forward Route Path (Google Maps Glowing Transit Style) strictly along roads
      if (forwardRoadCoords.length > 1) {
        // Outer road glow
        L.polyline(forwardRoadCoords, {
          color: '#0284c7',
          weight: 8,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayer);

        // Core bright road path
        L.polyline(forwardRoadCoords, {
          color: '#0284c7',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayer);

        // Animated flow dashes along the roads indicating forward transit motion
        L.polyline(forwardRoadCoords, {
          color: '#ffffff',
          weight: 2.5,
          opacity: 0.95,
          dashArray: '8, 14',
          className: 'gmap-flow-dashes',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayer);
      }

      // 3. Draw Station / Stop Nodes along the route
      validStops.forEach((s: any, idx: number) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === validStops.length - 1;

        if (isCurrent) return; // Bus marker is already anchored here

        const latLng: [number, number] = [Number(s.latitude), Number(s.longitude)];

        let stopMarker: any;
        if (isLast) {
          // Final Terminus Destination Pin
          stopMarker = L.circleMarker(latLng, {
            radius: 8,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 2.5,
            fillOpacity: 1
          }).addTo(routeLayer);
        } else if (isPast) {
          // Visited Stop
          stopMarker = L.circleMarker(latLng, {
            radius: 4,
            fillColor: '#64748b',
            color: '#334155',
            weight: 1.5,
            fillOpacity: 0.8
          }).addTo(routeLayer);
        } else {
          // Upcoming Stop (Google Maps transit dot)
          stopMarker = L.circleMarker(latLng, {
            radius: 6,
            fillColor: '#ffffff',
            color: '#0284c7',
            weight: 3,
            fillOpacity: 1
          }).addTo(routeLayer);
        }

        stopMarker.bindTooltip(`
          <div style="font-family: system-ui, sans-serif; text-align: left;">
            <div style="font-size: 10px; color: ${isLast ? '#f87171' : isPast ? '#94a3b8' : '#38bdf8'}; font-weight: 800; text-transform: uppercase;">
              ${isLast ? '🏁 Final Terminus' : isPast ? '✓ Visited Stop' : '➔ Upcoming Stop'}
            </div>
            <div style="font-size: 12px; font-weight: 800; color: #ffffff;">
              #${s.stop_sequence}: ${s.stop_name}
            </div>
          </div>
        `, {
          className: 'gmap-stop-tooltip',
          direction: 'top',
          offset: [0, -8]
        });
      });

      // Fit map bounds ONCE when a new bus selection is made
      const isNewSelection = prevSelectedBusIdRef.current !== selectedBusId;
      if (isNewSelection) {
        prevSelectedBusIdRef.current = selectedBusId;
        if (allCoords.length > 1) {
          map.fitBounds(L.latLngBounds(allCoords), {
            padding: [70, 70],
            maxZoom: 15,
            animate: false
          });
          map.invalidateSize({ pan: false });
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize({ pan: false });
            }
          }, 350);
        } else if (selectedBus.current_location) {
          map.panTo([selectedBus.current_location.latitude, selectedBus.current_location.longitude], {
            animate: true,
            duration: 0.6
          });
        }
      }
    }

    drawSelectedRoute();

    return () => {
      isCancelled = true;
    };
  }, [selectedBusId, buses, isClient]);

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

        const markerKey = `${markerBg}-${isSelected ? '1' : '0'}`;

        if (currentMarkers.has(bus.id)) {
          const marker = currentMarkers.get(bus.id);
          marker.setLatLng([latitude, longitude]);
          // Only replace DOM icon if crowd color or selection state changed (avoids DOM churn & hover flicker)
          if ((marker as any)._customKey !== markerKey) {
            marker.setIcon(customIcon);
            (marker as any)._customKey = markerKey;
          }
          marker.setPopupContent(popupContent);
        } else {
          const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
          (marker as any)._customKey = markerKey;
          marker.bindPopup(popupContent, { offset: [0, -44], autoPan: false });
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
    <div className={`relative ${className} bg-slate-100 border border-slate-200`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-lg text-xs text-slate-800 pointer-events-auto">
        <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <BusIcon className="w-3.5 h-3.5 text-blue-700" />
          <span>Chennai Live Bus Legend</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-semibold text-emerald-800">Empty (0 - 30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="font-semibold text-amber-800">Normal Crowd (31 - 70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="font-semibold text-rose-800">Overcrowded (71 - 100%)</span>
          </div>
        </div>
      </div>

      {/* Floating Google Maps-Style Route Info HUD */}
      {selectedRouteInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-lg w-[92%] sm:w-auto bg-white/95 backdrop-blur-md border border-blue-200 rounded-2xl p-3.5 shadow-xl text-xs text-slate-800 flex items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-slate-900">
                  Bus {selectedRouteInfo.busNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Route {selectedRouteInfo.routeNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate max-w-[280px]">
                <span className="text-slate-500">Next:</span> <strong className="text-blue-700 font-bold">{selectedRouteInfo.nextStopName}</strong>
                <span className="text-slate-500 ml-1.5 font-medium">({selectedRouteInfo.remainingStopsCount} stops remaining)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (mapInstanceRef.current && selectedRouteInfo.routeCoords.length > 0) {
                  import('leaflet').then(L => {
                    mapInstanceRef.current.fitBounds(L.default.latLngBounds(selectedRouteInfo.routeCoords), {
                      padding: [60, 60],
                      animate: true
                    });
                  });
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
              title="Fit entire route on map"
            >
              Fit Route
            </button>
            <button
              onClick={() => {
                if (onBusSelect) onBusSelect(null as any);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Close route highlight"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Recenter Button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(APP_CONFIG.map.defaultCenter, APP_CONFIG.map.defaultZoom);
          }
        }}
        className="absolute bottom-4 left-4 z-[500] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 p-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
      >
        <Navigation className="w-4 h-4 text-blue-600" />
        Center Chennai
      </button>
    </div>
  );
};

export default ChennaiLiveMap;
