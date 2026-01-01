import { ImageResponse } from "next/og";
import * as React from "react";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: "8px",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="40" cy="40" r="38" fill="#1a1a1a" stroke="#d61f1f" strokeWidth="2" />
          <polygon points="30,25 30,55 55,40" fill="#d61f1f" />
          <circle cx="60" cy="20" r="8" fill="#d61f1f" />
          <rect x="56" y="24" width="8" height="4" fill="#d61f1f" rx="1" />
          <rect x="58" y="28" width="4" height="2" fill="#d61f1f" rx="1" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
