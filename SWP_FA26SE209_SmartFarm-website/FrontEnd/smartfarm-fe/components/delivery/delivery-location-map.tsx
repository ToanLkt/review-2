"use client";

import { createLeafletContext, LeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  divIcon,
  map as createMap,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
  type TileLayer as LeafletTileLayer,
} from "leaflet";
import { Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { DeliveryAddressValue } from "@/lib/delivery-address";

// Country-level view shown until the customer chooses a delivery point.
const vietnamCenter: [number, number] = [16.2, 107.8];
const transparentTile = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

function StableMapRoot({ center, zoom, children }: {
  center: [number, number];
  zoom: number;
  children: ReactNode;
}) {
  const [context, setContext] = useState<LeafletContextInterface | null>(null);
  const liveMapRef = useRef<LeafletMap | null>(null);

  const attachMap = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const map = createMap(node, {
      center,
      zoom,
      minZoom: 5,
      maxZoom: 19,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    liveMapRef.current = map;
    setContext(createLeafletContext(map));

    // React 19 development mode replays callback refs. Cleaning the Leaflet
    // instance in the ref cleanup keeps the same DOM node from being reused by
    // a removed map, which is the source of the MapContainer/appendChild crash.
    return () => {
      if (liveMapRef.current === map) liveMapRef.current = null;
      map.remove();
      setContext((current) => current?.map === map ? null : current);
    };
  }, [center, zoom]);

  return <div ref={attachMap} className="h-full w-full" aria-label="Bản đồ chọn vị trí giao hàng">
    {context ? <LeafletContext value={context}>{children}</LeafletContext> : null}
  </div>;
}

function MapViewport({ value, onSelect }: {
  value: DeliveryAddressValue;
  onSelect: (latitude: number, longitude: number) => void;
}) {
  const onSelectRef = useRef(onSelect);
  const map = useMapEvents({
    click: (event) => onSelectRef.current(event.latlng.lat, event.latlng.lng),
  });

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const updateSize = () => map.invalidateSize({ animate: false });
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(updateSize);
    });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateSize);
    observer?.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (value.latitude === null || value.longitude === null) return;
    map.flyTo([value.latitude, value.longitude], 16, { duration: 0.5 });
  }, [map, value.latitude, value.longitude]);

  return null;
}

function MapTiles({ tileRetryKey, onTileError, onTileReady }: {
  tileRetryKey: number;
  onTileError: () => void;
  onTileReady: () => void;
}) {
  const layerRef = useRef<LeafletTileLayer | null>(null);
  const consecutiveErrors = useRef(0);
  const callbacks = useRef({ onTileError, onTileReady });

  useEffect(() => {
    callbacks.current = { onTileError, onTileReady };
  }, [onTileError, onTileReady]);

  useEffect(() => {
    if (tileRetryKey <= 0) return;
    consecutiveErrors.current = 0;
    layerRef.current?.redraw();
  }, [tileRetryKey]);

  const eventHandlers = useMemo(() => ({
    tileload: () => {
      consecutiveErrors.current = 0;
      callbacks.current.onTileReady();
    },
    tileerror: () => {
      consecutiveErrors.current += 1;
      if (consecutiveErrors.current >= 4) callbacks.current.onTileError();
    },
  }), []);

  return <TileLayer
    ref={layerRef}
    attribution='Maps &copy; <a href="https://www.geoapify.com/">Geoapify</a>, data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="/api/map-tiles/{z}/{x}/{y}"
    errorTileUrl={transparentTile}
    maxZoom={19}
    crossOrigin
    eventHandlers={eventHandlers}
  />;
}

export default function DeliveryLocationMap({ value, onSelect, tileRetryKey, onTileError, onTileReady }: {
  value: DeliveryAddressValue;
  onSelect: (latitude: number, longitude: number) => void;
  tileRetryKey: number;
  onTileError: () => void;
  onTileReady: () => void;
}) {
  const hasPosition = value.latitude !== null && value.longitude !== null;
  const [initialView] = useState(() => ({
    center: (hasPosition ? [value.latitude!, value.longitude!] : vietnamCenter) as [number, number],
    zoom: hasPosition ? 16 : 5,
  })); // Initial view only; MapViewport owns subsequent movement.
  const markerRef = useRef<LeafletMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const markerIcon = useMemo(() => divIcon({
    className: "smartfarm-map-marker",
    html: '<span aria-hidden="true"></span>',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  }), []);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const markerEvents = useMemo(() => ({
    dragend: () => {
      const point = markerRef.current?.getLatLng();
      if (point) onSelectRef.current(point.lat, point.lng);
    },
  }), []);

  return <StableMapRoot center={initialView.center} zoom={initialView.zoom}>
    <MapTiles tileRetryKey={tileRetryKey} onTileError={onTileError} onTileReady={onTileReady} />
    <MapViewport value={value} onSelect={onSelect} />
    {hasPosition && <Marker
      ref={markerRef}
      position={[value.latitude!, value.longitude!]}
      draggable
      icon={markerIcon}
      eventHandlers={markerEvents}
    />}
  </StableMapRoot>;
}
