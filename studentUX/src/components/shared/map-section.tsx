"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Search, Users, Building2 } from "lucide-react";
import { cn } from "../ui/utils";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const ALERT_COLOR_CLASSES: Record<string, string> = {
  "chart-1": "text-chart-1",
  "chart-2": "text-chart-2",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
};

export interface MapLocation {
  id: number;
  name: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
  type: string;
  isNew?: boolean;
  /** Optional reference to source entity (e.g. option id for preference flow) */
  optionId?: string;
}

export interface SearchFieldConfig {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export interface MapAlert {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  message: string;
  subtext: string;
}

export interface MapSectionProps {
  /** Map locations to display as markers */
  locations: MapLocation[];
  /** Optional greeting (title + userName). When provided, shows greeting above map */
  greeting?: {
    title?: string;
    userName?: string;
  };
  /** Search bar fields. When provided, shows search overlay */
  searchFields?: SearchFieldConfig[];
  /** Called when search button is clicked */
  onSearch?: (values: Record<string, string>) => void;
  /** Activity alerts to cycle through at bottom of map */
  alerts?: MapAlert[];
  /** Interval in ms to cycle alerts (default: 8000) */
  alertInterval?: number;
  /** Map height in pixels, or "fill" for flex-1 min-h-0 (default: 240) */
  mapHeight?: number | "fill";
  /** Map center [lat, lng] (default: US center) */
  defaultCenter?: [number, number];
  /** Map zoom level (default: 4) */
  defaultZoom?: number;
  /** Called when a location marker is clicked */
  onLocationSelect?: (location: MapLocation) => void;
  /** Called when hovering over a location marker (null when mouse leaves) */
  onLocationHover?: (location: MapLocation | null) => void;
  /** Option id of the selected location — highlights the corresponding marker */
  selectedOptionId?: string | null;
  /** Option id of the hovered location — highlights the corresponding marker */
  hoveredOptionId?: string | null;
  /** Custom card to render when a location is selected. Receives location and onClose. When provided, replaces default selected location card. */
  renderSelectedCard?: (location: MapLocation, onClose: () => void) => React.ReactNode;
  /** When true, removes horizontal padding from map container for full-width layout */
  fullWidth?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * MapSection - Reusable map section with Leaflet, search bar overlay, and activity alerts.
 */
export function MapSection({
  locations,
  greeting,
  searchFields = [],
  onSearch,
  alerts = [],
  alertInterval = 8000,
  mapHeight = 240,
  defaultCenter = [39.8283, -98.5795],
  defaultZoom = 4,
  onLocationSelect,
  onLocationHover,
  selectedOptionId,
  hoveredOptionId,
  renderSelectedCard,
  fullWidth = false,
  className,
}: MapSectionProps) {
  const [selectedLocation, setSelectedLocation] = React.useState<MapLocation | null>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [currentAlertIndex, setCurrentAlertIndex] = React.useState(0);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<unknown>(null);
  const markersRef = React.useRef<unknown[]>([]);
  const onLocationHoverRef = React.useRef(onLocationHover);
  onLocationHoverRef.current = onLocationHover;

  const searchValues = React.useMemo(
    () =>
      searchFields.reduce(
        (acc, f) => {
          acc[f.label] = f.value;
          return acc;
        },
        {} as Record<string, string>
      ),
    [searchFields]
  );

  const handleSearch = () => {
    onSearch?.(searchValues);
  };

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);
  };

  // Cycle through alerts
  React.useEffect(() => {
    if (alerts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, alertInterval);
    return () => clearInterval(interval);
  }, [alerts.length, alertInterval]);

  const currentAlert = alerts[currentAlertIndex];
  const alertColorClass = currentAlert
    ? (ALERT_COLOR_CLASSES[currentAlert.color] ?? "text-chart-1")
    : "text-chart-1";

  // Load Leaflet
  React.useEffect(() => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    if (typeof window !== "undefined" && !(window as unknown as { L?: unknown }).L) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map
  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as unknown as { L: typeof import("leaflet") }).L;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    }).setView(defaultCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { invalidateSize: () => void }).invalidateSize();
      }
    }, 100);

    locations.forEach((location) => {
      const size = Math.min(location.count / 5 + 20, 50);
      const isPulse = location.count > 30;
      const totalSize = location.isNew ? size + 24 : size + (isPulse ? 20 : 0);
      const isSelected = selectedOptionId != null && location.optionId === selectedOptionId;
      const isHovered = hoveredOptionId != null && location.optionId === hoveredOptionId;
      const highlightBorder =
        isSelected
          ? "border: 3px solid var(--chart-1); box-shadow: 0 0 0 2px var(--background), 0 4px 12px color-mix(in oklch, var(--foreground) 28%, transparent);"
          : isHovered
            ? "border: 3px solid var(--chart-1); opacity: 0.9; box-shadow: 0 0 0 1px var(--background), 0 4px 12px color-mix(in oklch, var(--foreground) 32%, transparent);"
            : "";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div class="marker-wrapper" style="position: relative; width: ${size}px; height: ${size}px;">
            ${isPulse ? `<div class="marker-pulse" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${size + 20}px; height: ${size + 20}px; background: color-mix(in oklch, var(--chart-1) 35%, transparent); border-radius: 50%; opacity: 0.45; animation: pulse 2s infinite;"></div>` : ""}
            <div class="marker-pin" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${size}px; height: ${size}px; background: var(--primary); border: 3px solid var(--background); border-radius: 50%; box-shadow: 0 4px 12px color-mix(in oklch, var(--foreground) 28%, transparent); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; ${highlightBorder}">
              <span style="color: var(--primary-foreground); font-weight: 600; font-size: ${Math.max(10, size / 3)}px;">${location.count}</span>
            </div>
            ${location.isNew ? `<div class="new-badge" style="position: absolute; top: -10px; right: -16px; background: var(--brand-color); color: var(--primary-foreground); font-size: var(--font-size-xs); font-weight: 700; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 8px; line-height: 1.2; white-space: nowrap; box-shadow: 0 2px 6px color-mix(in oklch, var(--brand-color) 45%, transparent); z-index: 10; animation: newBadgeBounce 2s ease-in-out 1; animation-fill-mode: forwards; border: 1.5px solid var(--background);">NEW</div>` : ""}
          </div>
        `,
        iconSize: [totalSize, totalSize],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([location.lat, location.lng], { icon })
        .addTo(map)
        .on("click", () => handleLocationClick(location))
        .on("mouseover", () => onLocationHoverRef.current?.(location))
        .on("mouseout", () => onLocationHoverRef.current?.(null));

      markersRef.current.push(marker);
    });

    if (!document.querySelector("#marker-pulse-animation")) {
      const style = document.createElement("style");
      style.id = "marker-pulse-animation";
      style.textContent = `
        @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; } }
        .marker-pin:hover { transform: translate(-50%, -50%) scale(1.15) !important; box-shadow: 0 6px 16px color-mix(in oklch, var(--foreground) 38%, transparent) !important; }
        .custom-marker { overflow: visible !important; background: transparent !important; border: none !important; }
        @keyframes newBadgeBounce { 0% { transform: translateY(0); } 20% { transform: translateY(-10px); } 40% { transform: translateY(0); } 60% { transform: translateY(-5px); } 80% { transform: translateY(0); } 100% { transform: translateY(0); } }
      `;
      document.head.appendChild(style);
    }

    return () => {
      markersRef.current = [];
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, locations, defaultCenter, defaultZoom, selectedOptionId, hoveredOptionId]);

  return (
    <div
      className={cn(
        "space-y-6",
        mapHeight === "fill" && "flex flex-1 min-h-0 flex-col",
        className
      )}
    >
      {/* Greeting Section */}
      {greeting && (
        <div className="px-4 lg:px-6">
          <div className="text-center space-y-2">
            <h1 className="page-title pt-4 pb-4">
              Hi, {greeting.userName ?? "User"}
            </h1>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div
        className={cn(
          !fullWidth && "px-4 lg:px-6",
          mapHeight === "fill" && "flex-1 min-h-0 flex flex-col"
        )}
      >
        <Card className={cn("overflow-hidden gap-0 relative z-0", mapHeight === "fill" && "flex-1 min-h-0 flex flex-col")}>
          <CardContent
            className={cn("!p-0 !pb-0", mapHeight === "fill" && "flex-1 min-h-0 min-h-[400px]")}
            style={mapHeight !== "fill" ? { height: mapHeight } : undefined}
          >
            <div className={cn("relative", mapHeight === "fill" ? "min-h-[400px] h-full" : "h-full")}>
              <div
                ref={mapRef}
                className="absolute inset-0 w-full h-full z-0"
                style={{ borderRadius: 0 }}
              />

              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              {searchFields.length > 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] max-w-6xl">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0 bg-card backdrop-blur-sm rounded-xl shadow-xl border border-border overflow-visible">
                    {searchFields.map((field) => (
                      <div
                        key={field.label}
                        className={cn(
                          "flex flex-col px-4 md:px-6 py-3 hover:bg-sidebar/50 transition-colors cursor-pointer border-b md:border-b-0 md:border-r border-border flex-1"
                        )}
                      >
                        <label className="text-xs font-semibold mb-1">{field.label}</label>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground w-full"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={handleSearch}
                      className="flex items-center justify-center gap-2 px-4 md:px-6 h-auto self-stretch m-2 rounded-lg font-semibold whitespace-nowrap"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">Search</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Activity Alerts */}
              {currentAlert && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                  <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 w-fit max-w-[90vw]">
                    <div className="flex items-center justify-center flex-shrink-0">
                      <currentAlert.icon className={cn("h-5 w-5", alertColorClass)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {currentAlert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {currentAlert.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Location Info */}
              {selectedLocation &&
                (renderSelectedCard ? (
                  renderSelectedCard(selectedLocation, () => setSelectedLocation(null))
                ) : (
                  <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-border max-w-xs z-[1000]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{selectedLocation.name}</h3>
                          {selectedLocation.isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold text-primary-foreground bg-brand">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{selectedLocation.city}</p>
                        {selectedLocation.isNew && (
                          <p className="text-xs text-chart-2 font-medium mt-1.5">
                            New placements just posted
                          </p>
                        )}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-chart-2" />
                            <span className="text-xs">
                              <span className="font-semibold">{selectedLocation.count}</span> active
                              placements
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-chart-3" />
                            <span className="text-xs capitalize">{selectedLocation.type}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                        aria-label="Close location details"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
