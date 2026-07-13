import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Roomio — Dormitories, Rental Houses & Local Services in Songkhla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>Roomio</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 20, opacity: 0.92 }}>
          Dormitories, Rental Houses &amp; Local Services
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 8, opacity: 0.8 }}>in Songkhla, Thailand</div>
      </div>
    ),
    { ...size }
  );
}
