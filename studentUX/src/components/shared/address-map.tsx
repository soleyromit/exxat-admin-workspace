"use client";

import * as React from "react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";

const DEFAULT_HEIGHT = 112;

export interface AddressMapProps {
  /** Full address string (for directions link) */
  address: string;
  /** Latitude for map center */
  lat?: number;
  /** Longitude for map center */
  lng?: number;
  /** Map container height in pixels */
  height?: number;
  /** Optional MapTiler API key — when set, uses MapTiler static image; otherwise uses OSM embed */
  maptilerKey?: string;
  /** Show "Get directions" overlay on the map */
  showDirectionsOverlay?: boolean;
  /** Show OSM attribution link */
  showAttribution?: boolean;
}

export function AddressMap({
  address,
  lat,
  lng,
  height = DEFAULT_HEIGHT,
  maptilerKey,
  showDirectionsOverlay = true,
  showAttribution = true,
}: AddressMapProps) {
  const hasCoords = lat != null && lng != null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  if (!hasCoords) {
    return (
      <div
        className="w-full bg-muted flex items-center justify-center rounded-lg overflow-hidden"
        style={{ height }}
      >
        <FontAwesomeIcon name="mapPin" className="h-10 w-10 text-muted-foreground/50" weight="light" />
      </div>
    );
  }

  const zoom = 16;
  const mapHref = maptilerKey
    ? `https://api.maptiler.com/maps/streets/?key=${maptilerKey}#${zoom}/${lat}/${lng}`
    : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;

  if (maptilerKey) {
    const mapSrc = `https://api.maptiler.com/maps/streets/static/${lng},${lat},${zoom}/400x${height}.png?key=${maptilerKey}`;
    return (
      <div className="relative rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset">
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative"
          aria-label="View address on map"
        >
          <img
            src={mapSrc}
            alt="Address map preview"
            className="w-full object-cover block map-preview-filter"
            style={{ height }}
          />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-primary drop-shadow-md"
            style={{ fontSize: 28 }}
            aria-hidden
          >
            <FontAwesomeIcon name="mapPin" weight="solid" />
          </span>
        </a>
        {showDirectionsOverlay && (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/95 text-foreground text-xs font-medium shadow-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Get directions"
          >
            <FontAwesomeIcon name="route" className="h-3.5 w-3.5" weight="solid" />
            Get directions
          </a>
        )}
      </div>
    );
  }

  /* OSM tiles — reliable fallback when embed iframe is blocked */
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const tileX = Math.floor((lng + 180) / 360 * n);
  const tileY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  const tiles = [
    [tileX - 1, tileY - 1],
    [tileX, tileY - 1],
    [tileX - 1, tileY],
    [tileX, tileY],
  ];

  return (
    <div className="relative rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset bg-muted">
      <a
        href={mapHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label="View address on map"
      >
        <div
          className="w-full grid grid-cols-2 grid-rows-2 map-preview-filter overflow-hidden relative"
          style={{ height }}
        >
          {tiles.map(([x, y], i) => (
            <img
              key={i}
              src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ))}
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-primary drop-shadow-md"
            style={{ fontSize: 28 }}
            aria-hidden
          >
            <FontAwesomeIcon name="mapPin" weight="solid" />
          </span>
        </div>
      </a>
      {showDirectionsOverlay && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/95 text-foreground text-xs font-medium shadow-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Get directions"
        >
          <FontAwesomeIcon name="route" className="h-3.5 w-3.5" weight="solid" />
          Get directions
        </a>
      )}
      {showAttribution && (
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/80 hover:text-foreground bg-background/80 px-1.5 py-0.5 rounded"
        >
          © OpenStreetMap
        </a>
      )}
    </div>
  );
}
