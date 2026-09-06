import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us – All in One",
};

export default function AboutPage() {
  return (
    <section className="container section static-page">
      <h1 className="page-title">About Us</h1>
      <div className="static-content">
        <p>
          <strong>All in One</strong> ek online shopping store hai jo ek hi
          jagah par saari zarooratein cover karta hai — Electronics, Ladies
          Boutique, Winter & Summer Clothing, Cosmetics aur Laptop Accessories
          sab kuch.
        </p>
        <p>
          Humara maqsad Pakistani customers ko best prices par original
          products, fast delivery aur hamesha-bharosa-mand service dena hai.
        </p>
        <h2>Hum kyun choose karein?</h2>
        <ul>
          <li>✅ 100% original products ki guarantee</li>
          <li>✅ Cash on Delivery saari Pakistan mein</li>
          <li>✅ 2-4 din mein delivery</li>
          <li>✅ 7 din ki easy return policy</li>
          <li>✅ 24/7 customer support</li>
        </ul>
        <p>
          Koi sawal ho to <Link href="/contact">Contact</Link> page par
          message karein.
        </p>
      </div>
    </section>
  );
}