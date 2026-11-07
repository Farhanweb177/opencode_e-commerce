import Link from "next/link";
import { getCategories } from "@/lib/queries";

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="logo footer-logo">
            <span className="logo-badge">A</span>
            <span className="logo-text">
              All <span>in</span> One
            </span>
          </Link>
          <p className="footer-desc">
            Sab kuch ek hi jagah. Electronics, fashion, cosmetics aur laptop
            accessories — sab premium quality ke saath.
          </p>
        </div>

        <div>
          <h4>Categories</h4>
          <ul className="footer-links">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li>
              <Link href="/track">Track Order</Link>
            </li>
            <li>
              <Link href="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link href="/account">My Account</Link>
            </li>
            <li>
              <Link href="/returns">Return Policy</Link>
            </li>
            <li>
              <Link href="/faq">FAQs</Link>
            </li>
            <li>
              <Link href="/contact">Contact Us</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Company</h4>
          <ul className="footer-links">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/admin/login">Admin Panel</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul className="footer-links">
            <li>📞 +92 300 1234567</li>
            <li>✉️ support@allinone.pk</li>
            <li>📍 Karachi, Pakistan</li>
            <li>🕐 Mon – Sat: 9am – 9pm</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} All in One. All rights reserved.</p>
        <div className="payment-icons">
          <span>COD</span>
          <span>JazzCash</span>
          <span>Easypaisa</span>
          <span>Bank Transfer</span>
        </div>
      </div>
    </footer>
  );
}
