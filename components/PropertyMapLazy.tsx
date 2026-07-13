"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-ink-100 text-sm text-ink-500">Loading map…</div>
  ),
});

export default PropertyMap;
