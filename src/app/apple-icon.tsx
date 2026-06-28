import { ImageResponse } from "next/og";

// Home-screen icon for iOS ("Add to Home Screen"). Generates a 180×180 PNG.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2b7bff, #1450c0)",
          color: "#ffffff",
          fontSize: 116,
          fontWeight: 800,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
