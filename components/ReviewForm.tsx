"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/lib/store-actions";

export function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    rating: 5,
    comment: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const result = await submitReview({
        productId,
        productSlug,
        authorName: form.name,
        rating: Number(form.rating),
        comment: form.comment,
      });

      if (result.ok) {
        setMessage({
          ok: true,
          text: "Shukriya! Aapka review publish ho gaya.",
        });
        setForm({ name: "", rating: 5, comment: "" });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error ?? "Review fail hua." });
      }
    } catch (error) {
      console.error("[review] request failed:", error);
      setMessage({
        ok: false,
        text: "Server se connect nahi ho paya. Dobara koshish karein.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Apna review likhein</h3>
      <div className="review-form-row">
        <div className="form-group">
          <label htmlFor="review-name">Aapka naam *</label>
          <input
            id="review-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Naam likhein"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="review-rating">Rating *</label>
          <select
            id="review-rating"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {"★".repeat(r)}{" "}
                {r === 5 ? "— Excellent" : r === 4 ? "— Good" : r === 3 ? "— Average" : r === 2 ? "— Poor" : "— Bad"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="review-comment">Comment</label>
        <textarea
          id="review-comment"
          rows={3}
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="Product ka experience share karein..."
        />
      </div>
      {message && (
        <p className={message.ok ? "review-msg ok" : "review-msg error"}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending}
        style={{ width: "auto" }}
      >
        {pending ? "Publishing..." : "Submit Review"}
      </button>
    </form>
  );
}