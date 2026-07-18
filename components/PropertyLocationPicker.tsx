"use client";

import { useEffect, useRef } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, MapPin } from "lucide-react";

export const DEFAULT_LAT = 7.0086;
export const DEFAULT_LNG = 100.4977;

// Handles both vis.gl's wrapped event shape ({ detail: { latLng: {lat, lng} } })
// and the native Google Maps event shape ({ latLng: LatLng instance with .lat()/.lng() }),
// since Marker's onDragEnd and Map's onClick don't necessarily normalize the same way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- event shape varies by source, see comment above.
function extractLatLng(event: any): { lat: number; lng: number } | null {
  const latLng = event?.detail?.latLng ?? event?.latLng;
  if (!latLng) return null;
  const latVal = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
  const lngVal = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;
  if (typeof latVal !== "number" || typeof lngVal !== "number") return null;
  return { lat: latVal, lng: lngVal };
}

function LocationPickerInner({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["geometry", "name"],
      componentRestrictions: { country: "th" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!location) return;
      const newLat = location.lat();
      const newLng = location.lng();
      onChange(newLat, newLng);
      map?.panTo({ lat: newLat, lng: newLng });
      map?.setZoom(17);
    });

    autocompleteRef.current = autocomplete;
  }, [placesLib, map, onChange]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see extractLatLng comment.
  function handleMapClick(event: any) {
    const coords = extractLatLng(event);
    if (coords) onChange(coords.lat, coords.lng);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see extractLatLng comment.
  function handleMarkerDragEnd(event: any) {
    const coords = extractLatLng(event);
    if (coords) onChange(coords.lat, coords.lng);
  }

  return (
    <div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="ค้นหาที่อยู่ เช่น ชื่อถนน, ตำบล, สถานที่ใกล้เคียง"
          className="w-full rounded-lg border border-ink-300 py-2 pl-9 pr-3 text-sm focus-ring"
        />
      </div>

      <div className="h-64 w-full overflow-hidden rounded-xl border border-ink-200">
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
        >
          <Marker position={{ lat, lng }} draggable onDragEnd={handleMarkerDragEnd} />
        </Map>
      </div>

      <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
        <MapPin className="h-3.5 w-3.5" />
        คลิกบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่ง
      </p>
    </div>
  );
}

export default function PropertyLocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-ink-100 text-sm text-ink-500">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map picker.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <LocationPickerInner lat={lat} lng={lng} onChange={onChange} />
    </APIProvider>
  );
}