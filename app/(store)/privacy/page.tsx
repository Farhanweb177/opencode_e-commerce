import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – All in One",
};

export default function PrivacyPage() {
  return (
    <section className="container section static-page">
      <h1 className="page-title">Privacy Policy</h1>
      <div className="static-content">
        <h2>Hum kya data collect karte hain?</h2>
        <p>
          - Order karte waqt: naam, phone number, address aur city
          <br />- Account banate waqt: email aur password
          <br />- Checkout par: payment method (card number collect nahi karte)
        </p>
        <h2>Data kaisay use hota hai?</h2>
        <p>
          Aapka data sirf order confirm karne, delivery karne aur customer
          support ke liye use hota hai. Hum aapka data kisi third party ko bech
          nahi sakte.
        </p>
        <h2>Security</h2>
        <p>
          Aapka data Supabase (encrypted) par stored hai. Passwords hashed
          hain. Hamari website HTTPS se protected hai.
        </p>
        <h2>Cookies</h2>
        <p>
          Hum cart, wishlist aur login session ke liye local storage aur
          cookies use karte hain. Ye browser mein hi rehti hain.
        </p>
        <h2>Contact</h2>
        <p>
          Privacy ke kisi sawal ke liye{" "}
          <a href="mailto:support@allinone.pk">support@allinone.pk</a>{" "}
          par email karein.
        </p>
      </div>
    </section>
  );
}