import { ImageResponse } from "next/og";

export const alt = "TradeScore — AI lead matching for Glasgow trades";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(145deg, #09090b 0%, #18181b 100%)",
          color: "#fafafa",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fafafa",
          }}
        >
          TradeScore
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            fontWeight: 500,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          AI Lead Matching for Glasgow Tradespeople
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 28,
            color: "#fb923c",
            fontWeight: 600,
          }}
        >
          £25 per lead · No commission · First lead free
        </div>
      </div>
    ),
    { ...size }
  );
}
