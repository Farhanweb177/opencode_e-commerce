"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-screen">
      <span className="error-emoji">⚠️</span>
      <h2>Kuch gadbad ho gayi!</h2>
      <p>{error.message || "Server mein error aa gaya hai. Thori der mein try karein."}</p>
      <button className="btn btn-primary" onClick={() => reset()}>
        Dobara Try Karein
      </button>
    </div>
  );
}
