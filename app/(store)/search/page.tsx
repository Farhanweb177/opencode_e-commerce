import type { Metadata } from "next";
import { searchProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, applyFilters } from "@/components/ProductFilters";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Search – All in One",
};

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = sp.q ?? "";
  const matched = await searchProducts(q);
  const products = applyFilters(matched, sp);

  return (
    <>
      <section className="page-hero search-hero">
        <div className="container page-hero-inner">
          <span className="page-hero-emoji">🔍</span>
          <h1 className="page-hero-title">Search</h1>
          <p className="page-hero-desc">
            {q
              ? `"${q}" ke liye ${products.length} result mile`
              : "Products search karein"}
          </p>
        </div>
      </section>

      <section className="container section">
        <ProductFilters base="/search" params={sp} showSearch />
        {!q ? (
          <p className="empty-state">
            Upar search box mein kuch likhein — naami, category ya description
            ke hisaab se results milenge.
          </p>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            &ldquo;{q}&rdquo; ke liye koi product nahi mila. Kuch aur try karein.
          </p>
        )}
      </section>
    </>
  );
}