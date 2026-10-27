import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "CVBuilder — Format Terbaca ATS, Disesuaikan dengan Lowongan";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F7F4EE",
          padding: "64px 80px",
          fontFamily: "system-ui, sans-serif",
          border: "16px solid #E5DFD5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#C24B27",
              color: "#FFFFFF",
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            CV
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#14130F",
              letterSpacing: "-0.03em",
            }}
          >
            CVBuilder
          </span>
          <span
            style={{
              marginLeft: "16px",
              backgroundColor: "#FBF0EB",
              border: "1px solid #F3C4B3",
              color: "#C24B27",
              padding: "6px 14px",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Standar Harvard
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#14130F",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Format Terbaca ATS,
            <br />
            <span style={{ color: "#C24B27" }}>Disesuaikan dengan Lowongan.</span>
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#5D5950",
              lineHeight: 1.4,
              margin: 0,
              maxWidth: "900px",
            }}
          >
            Tulis pengalaman apa adanya. AI merapikan poin dan kata kunci tanpa mengarang data.
            Hasil PDF dan Word terbaca sempurna oleh mesin ATS.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #E5DFD5",
            paddingTop: "24px",
          }}
        >
          <span style={{ fontSize: "20px", color: "#14130F", fontWeight: 700 }}>
            Rp5.000 per CV • Tanpa Langganan • 3x Revisi
          </span>
          <span style={{ fontSize: "18px", color: "#8E8A81" }}>
            cvbuilder.id
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
