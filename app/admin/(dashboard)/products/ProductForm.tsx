"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import type { ProductFormState } from "./actions";

const TAG_OPTIONS = ["", "New", "Sale", "Best Seller"];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
];

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: Category[];
  product?: Product;
  action: (
    state: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  } as ProductFormState);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [gradient, setGradient] = useState(
    product?.gradient ?? GRADIENT_PRESETS[0]
  );
  const [emoji, setEmoji] = useState(product?.emoji ?? "📦");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileChosen, setFileChosen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Sirf image files choose karein.");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("File 8MB se kam honi chahiye.");
      e.target.value = "";
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(URL.createObjectURL(file));
    setFileChosen(true);
    setImageUrl("");
  }

  function handleUrlChange(value: string) {
    setImageUrl(value);
    setFileChosen(false);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  }

  function handleRemovePhoto() {
    setImageUrl("");
    setFileChosen(false);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const showImage = filePreview ?? imageUrl;

  return (
    <form className="admin-form" action={formAction}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="gradient" value={gradient} />

      <div className="admin-form-grid">
        <div className="admin-form-fields">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              defaultValue={product?.name}
              placeholder="e.g. Wireless Bluetooth Earbuds"
              required
            />
          </div>

          <div className="admin-form-row">
            <div className="form-group">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                name="slug"
                defaultValue={product?.slug}
                placeholder="khali chhorein to naam se auto ban jayega"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                defaultValue={product?.category}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="form-group">
              <label htmlFor="price">Price (Rs.) *</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.price}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="originalPrice">Original Price (Rs.)</label>
              <input
                id="originalPrice"
                name="originalPrice"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.originalPrice ?? ""}
                placeholder="Discount ke liye"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description}
              placeholder="Product ki tafseel..."
            />
          </div>

          <div className="admin-form-row admin-form-row-3">
            <div className="form-group">
              <label htmlFor="emoji">Emoji</label>
              <input
                id="emoji"
                name="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                defaultValue={product?.rating ?? 4.5}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reviews">Reviews Count</label>
              <input
                id="reviews"
                name="reviews"
                type="number"
                min="0"
                defaultValue={product?.reviews ?? 0}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="form-group">
              <label htmlFor="tag">Tag</label>
              <select id="tag" name="tag" defaultValue={product?.tag ?? ""}>
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t || "No tag"}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="stock">Stock (quantity)</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.stock ?? 100}
                placeholder="0 = Out of stock"
              />
              <small className="admin-field-hint">
                Order hone par stock automatically kam hota hai. 0 set karo to
                product out of stock ho jata hai.
              </small>
            </div>
          </div>
        </div>

        <aside className="admin-form-preview">
          <h3>Preview</h3>
          <div
            className="product-image product-image-large product-image-photo"
            style={{ background: gradient }}
          >
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={showImage} alt="preview" />
            ) : (
              <span className="product-image-emoji">{emoji}</span>
            )}
          </div>

          <div className="form-group">
            <label>Card Background Gradient</label>
            <div className="gradient-picker">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={
                    g === gradient
                      ? "gradient-swatch selected"
                      : "gradient-swatch"
                  }
                  style={{ background: g }}
                  onClick={() => setGradient(g)}
                  aria-label="Select gradient"
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Product Photo</label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 File Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                name="image"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {showImage && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleRemovePhoto}
                >
                  🗑 Remove Photo
                </button>
              )}
            </div>
            <input
              type="url"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Ya photo ka URL yahan paste karein"
            />
            {fileChosen ? (
              <p className="upload-status ok">
                ✓ Naya file choose ho chuka — Save par upload ho jayega
              </p>
            ) : imageUrl ? (
              <p className="upload-status ok">✓ Photo URL set</p>
            ) : null}
            <small className="admin-field-hint">
              Photo Supabase Storage mein save hoti hai aur website par turant
              dikhai deti hai.
            </small>
          </div>
        </aside>
      </div>

      {state.error && (
        <p className="admin-alert admin-alert-error">{state.error}</p>
      )}

      <div className="admin-form-actions">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={pending}
        >
          {pending
            ? "Saving..."
            : product
              ? "Save Changes"
              : "Create Product"}
        </button>
        <Link href="/admin/products" className="btn btn-outline btn-lg">
          Cancel
        </Link>
      </div>
    </form>
  );
}