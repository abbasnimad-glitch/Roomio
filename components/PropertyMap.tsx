"use client";

import { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { Locate, Navigation, Loader2 } from "lucide-react";
import { haversineDistanceKm } from "@/lib/utils";

export default function PropertyMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  if (!apiKey) {
    return (
      <div className="flex h-64 items-center justify-center bg-ink-100 text-sm text-ink-500">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display the map.
      </div>
    );
  }

  const distanceKm = userLocation ? haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng) : null;

  const directionsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <APIProvider apiKey={apiKey}>
        <div className="h-64 w-full">
          <Map defaultCenter={{ lat, lng }} defaultZoom={15} gestureHandling="greedy" disableDefaultUI={false}>
            <Marker position={{ lat, lng }} title={label} />
            {userLocation && (
              <Marker
                position={userLocation}
                title="ตำแหน่งของคุณ"
                icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              />
            )}
          </Map>
        </div>
      </APIProvider>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 bg-white p-3">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 disabled:opacity-60 focus-ring"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Locate className="h-3.5 w-3.5" />}
          {locating ? "กำลังค้นหาตำแหน่ง…" : "ใช้ตำแหน่งของฉัน"}
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          <Navigation className="h-3.5 w-3.5" /> นำทาง
        </a>

        {distanceKm !== null && (
          <span className="text-xs text-ink-500">
            ห่างจากคุณประมาณ {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} ม.` : `${distanceKm.toFixed(1)} กม.`}
          </span>
        )}
      </div>

      {locationError && <p className="border-t border-ink-100 p-3 text-xs text-red-600">{locationError}</p>}
    </div>
  );
}
