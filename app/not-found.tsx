import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container section">
      <div className="error-screen">
        <span className="error-emoji">🔍</span>
        <h1>404 — Page Nahi Mili</h1>
        <p>
          Maaf karein, ye sahfa maujood nahi hai ya hata di gayi hai.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary btn-lg">
            🏠 Home
          </Link>
          <Link href="/category/electronics" className="btn btn-outline btn-lg">
            🛒 Shopping
          </Link>
          <Link href="/track" className="btn btn-outline btn-lg">
            📦 Track Order
          </Link>
          <Link href="/contact" className="btn btn-outline btn-lg">
            📞 Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
