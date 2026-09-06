import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProduct,
  getCategoryProducts,
  getCategory,
  getReviews,
} from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ProductImage";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { ReviewForm } from "@/components/ReviewForm";
import { SITE_URL } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product ? `${product.name} – All in One` : "All in One",
    description: product?.description,
    openGraph: {
      title: product?.name,
      description: product?.description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const [category, reviews] = await Promise.all([
    getCategory(product.category),
    getReviews(product.id),
  ]);
  const related = (await getCategoryProducts(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const lowStock =
    typeof product.stock === "number" && product.stock > 0 && product.stock <= 5;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.imageUrl ? [product.imageUrl] : undefined,
            sku: product.id,
            brand: { "@type": "Brand", name: "All in One" },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviews,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "PKR",
              price: product.price,
              availability:
                product.stock && product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: `${SITE_URL}/product/${product.slug}`,
            },
          }),
        }}
      />
      <div className="container breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/category/${product.category}`}>{category?.name}</Link>
        <span>/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <section className="container product-detail">
        <ProductImage product={product} size="large" />
        <div className="product-detail-info">
          <span className="product-category-label">{category?.name}</span>
          <h1 className="product-detail-title">{product.name}</h1>
          <div className="product-rating">
            <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
            <span className="rating-value">
              {product.rating} rating · {product.reviews} reviews
            </span>
          </div>

          <div className="product-detail-price">
            <span className="product-price">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="product-original-price">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="product-discount-inline">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="product-detail-desc">{product.description}</p>

          <div className="product-meta">
            <span className={product.inStock ? "in-stock" : "out-of-stock"}>
              {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
            </span>
            {lowStock && (
              <span className="low-stock-hint">
                Sirf {product.stock} left — jaldi order karein
              </span>
            )}
            <span>✅ Cash on Delivery</span>
            <span>🚚 Delivery in 2-4 days</span>
          </div>

          {product.inStock ? (
            <div className="buy-actions buy-actions-lg">
              <AddToCartButton product={product} label="Add to Cart" large />
              <WishlistButton product={product} position="page" />
            </div>
          ) : (
            <button className="btn btn-disabled" disabled>
              Out of Stock
            </button>
          )}

          <div className="delivery-note">
            <strong>Order karne par:</strong>
            <ul>
              <li>✓ Authentic product ki guarantee</li>
              <li>✓ 7 din ki return policy</li>
              <li>✓ COD, JazzCash, Easypaisa payment</li>
            </ul>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2 className="section-title">Related Products</h2>
            <Link href={`/category/${product.category}`} className="view-all">
              View All →
            </Link>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container section reviews-section">
        <div className="section-head">
          <h2 className="section-title">Customer Reviews</h2>
          <span className="rating-value">
            {product.rating} average from {product.reviews} reviews
          </span>
        </div>

        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-head">
                  <strong className="review-author">
                    {review.author_name}
                  </strong>
                  <span className="stars">
                    {"★".repeat(review.rating)}
                    <span className="stars-muted">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </span>
                  <small className="review-date">
                    {new Date(review.created_at).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state reviews-empty">
            Abhi koi review nahi hai. Pehla review aap likhein!
          </p>
        )}

        <div className="review-form-wrap">
          <ReviewForm productId={product.id} productSlug={product.slug} />
        </div>
      </section>
    </>
  );
}