import { ImageResponse } from "next/og";

export const alt = "autocurl - CLI tool for discovering routes and running API requests";
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
          background: "linear-gradient(160deg, #2a2140 0%, #15131b 60%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f1ebdf",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              display: "flex",
            }}
          >
            <span>auto</span>
            <span style={{ color: "#f2c14e" }}>curl</span>
          </div>
          <span
            style={{
              background: "rgba(242, 193, 78, 0.15)",
              color: "#f2c14e",
              border: "1px solid rgba(242, 193, 78, 0.35)",
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            CLI Tool
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              color: "#f1ebdf",
              margin: 0,
            }}
          >
            API requests in one file you can read and run.
          </h1>
          <p
            style={{
              fontSize: 26,
              color: "#b9b2c3",
              lineHeight: 1.4,
              maxWidth: 900,
              margin: 0,
            }}
          >
            Discover routes in supported projects → Generate clean .autocurl files → Select a request by number.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "1px solid rgba(241, 235, 223, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "monospace",
              fontSize: 20,
              background: "rgba(21, 19, 27, 0.8)",
              border: "1px solid rgba(241, 235, 223, 0.2)",
              padding: "12px 24px",
              borderRadius: "10px",
              color: "#f2c14e",
            }}
          >
            <span>$ autocurl ./your-api</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: 18,
              color: "#b9b2c3",
            }}
          >
            <span>Git-friendly</span>
            <span>•</span>
            <span>Built-in HTTP client</span>
            <span>•</span>
            <span>Zero GUI</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
