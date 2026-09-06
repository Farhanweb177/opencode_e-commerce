import Link from "next/link";
import { getCategories, getFeaturedProducts, getNewProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";

export default async function Home() {
  const [categories, featured, newProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getNewProducts(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-badge">🏷️ Big Summer Sale — Up to 40% Off</span>
            <h1 className="hero-title">
              Sab Kuch, <span>Ek</span> Jagah.
            </h1>
            <p className="hero-subtitle">
              Electronics se lekar fashion, cosmetics aur laptop accessories —
              All in One par har zaroorat ka saman best price par.
            </p>
            <div className="hero-actions">
              <Link href="/category/electronics" className="btn btn-primary btn-lg">
                Shop Now
              </Link>
              <Link href="#featured" className="btn btn-outline btn-lg">
                Explore Deals
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>10k+</strong>
                <span>Happy Customers</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>24h</strong>
                <span>Fast Delivery</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Original</span>
              </div>
            </div>
          </div>
          <div className="hero-emoji" aria-hidden="true">
            🛍️
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Apni pasand ki category chunein</p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="category-card"
              style={{ background: cat.gradient }}
            >
              <span className="category-emoji">{cat.emoji}</span>
              <span className="category-name">{cat.name}</span>
              <span className="category-desc">{cat.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" id="featured">
        <div className="section-head">
          <h2 className="section-title">Featured Deals</h2>
          <Link href="/category/electronics" className="view-all">
            View All →
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">New Arrivals</h2>
          <Link href="/category/laptop-accessories" className="view-all">
            View All →
          </Link>
        </div>
        <div className="product-grid">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-icon">🚚</span>
            <h3>Free Delivery</h3>
            <p>Rs. 2,000+ orders par free shipping</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🔄</span>
            <h3>Easy Returns</h3>
            <p>7 din mein easy return policy</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">💰</span>
            <h3>Cash on Delivery</h3>
            <p>COD, JazzCash aur Easypaisa</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🤝</span>
            <h3>24/7 Support</h3>
            <p>Hum hamesha madad ke liye hazir</p>
          </div>
        </div>
      </section>
    </>
  );
}
