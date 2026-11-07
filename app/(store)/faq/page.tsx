import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ – All in One",
};

const FAQS = [
  {
    q: "Order kaise karein?",
    a: "Product page par 'Add to Cart' dabayein, phir checkout par delivery details bharein. Ya product par 'Quick Order' se seedha order kar sakte hain.",
  },
  {
    q: "Payment ke konsay tareeqay hain?",
    a: "Cash on Delivery (COD), JazzCash, Easypaisa aur Bank Transfer. Card/online payment gateway jald aa raha hai.",
  },
  {
    q: "Delivery kitne din mein hoti hai?",
    a: "Major cities mein 2-3 din, doosray shahron mein 3-4 din. Rs. 2,000+ orders par delivery free hai.",
  },
  {
    q: "Order track kaise karein?",
    a: "Header mein 'Track Order' page par jayein, apna order number aur phone number daalein — status turant nazar aayegi.",
  },
  {
    q: "Return policy kya hai?",
    a: "7 din ke andar product wapsi kar sakte hain agar wo defective ya wrong deliver hua ho. Detail ke liye Return Policy page dekhein.",
  },
  {
    q: "Original products hain?",
    a: "Haan, hum 100% original products ki guarantee dete hain. Agar koi product original nahi nikla to full refund.",
  },
  {
    q: "Coupon kaise use karein?",
    a: "Checkout par coupon box mein code daalein aur Apply dabayein. WELCOME10 (10% off) ya FLAT150 (Rs. 150 off) try karein.",
  },
  {
    q: "Kya accounts banane zaroori?",
    a: "Nahi, bina account ke bhi order kar sakte hain. Lekin account banane se apne orders ki history ek jagah dekh sakte hain.",
  },
];

export default function FaqPage() {
  return (
    <section className="container section static-page">
      <h1 className="page-title">Frequently Asked Questions</h1>
      <div className="static-content faq-list">
        {FAQS.map((faq, idx) => (
          <details key={idx} className="faq-item">
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}