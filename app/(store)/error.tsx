"use client";

import Link from "next/link";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-screen">
      <span className="error-emoji">😵</span>
      <h2>Page load nahi ho paya</h2>
      <p>{error.message || "Kuch problem aa gayi hai. Dobara try karein ya home page par jayein."}</p>
      <div style={{ display: "flex", gap: "12px" }}>
        <button className="btn btn-primary" onClick={() => reset()}>
          Dobara Try Karein
        </button>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
