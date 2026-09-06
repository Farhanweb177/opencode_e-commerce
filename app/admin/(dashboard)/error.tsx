"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-screen">
      <span className="error-emoji">⚠️</span>
      <h2>Admin Panel Error</h2>
      <p>{error.message || "Kuch gadbad ho gayi hai."}</p>
      <button className="btn btn-primary" onClick={() => reset()}>
        Dobara Try Karein
      </button>
    </div>
  );
}
