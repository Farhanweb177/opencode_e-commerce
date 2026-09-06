import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy – All in One",
};

export default function ReturnsPage() {
  return (
    <section className="container section static-page">
      <h1 className="page-title">Return & Refund Policy</h1>
      <div className="static-content">
        <h2>7 Din ki Return Policy</h2>
        <p>
          Agar aapko product <strong>defective</strong>, <strong>galat</strong>{" "}
          ya <strong>damaged</strong> mila ho to delivery ke 7 din ke andar
          return kar sakte hain.
        </p>
        <h2>Kaisay return karein?</h2>
        <ol>
          <li>Contact page par apni order number ke saath complaint bhejein</li>
          <li>Photo ya video (agar defect ho) attach karein</li>
          <li>Hamari team pickup arrange karegi (major cities mein)</li>
          <li>Check ke baad refund ya replacement milega</li>
        </ol>
        <h2>Refund kaise milta hai?</h2>
        <p>
          - COD orders: refund bank account ya JazzCash/Easypaisa mein 3-5
          working days mein
          <br />- Online payment: usi payment method par wapsi 5-7 working days
          mein
        </p>
        <h2>Kya return nahi hota?</h2>
        <ul>
          <li>Used/open products (sealed items jab tak seal na tooti ho)</li>
          <li>Sale/customized items</li>
          <li>Ghusal ke baad ki wash items (lingerie, swimming suits)</li>
          <li>7 din ke baad ki request</li>
        </ul>
        <p>
          Agar product ka order code koi issue ho to pehle{" "}
          <strong>Track Order</strong> se apna status check karein.
        </p>
      </div>
    </section>
  );
}