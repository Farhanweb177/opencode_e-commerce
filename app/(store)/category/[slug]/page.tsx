import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategory, getCategoryProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, applyFilters } from "@/components/ProductFilters";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category ? `${category.name} – All in One` : "All in One",
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const allProducts = await getCategoryProducts(slug);
  const products = applyFilters(allProducts, sp);
  const base = `/category/${slug}`;

  return (
    <>
      <section className="page-hero" style={{ background: category.gradient }}>
        <div className="container page-hero-inner">
          <span className="page-hero-emoji">{category.emoji}</span>
          <h1 className="page-hero-title">{category.name}</h1>
          <p className="page-hero-desc">{category.description}</p>
        </div>
      </section>

      <section className="container section">
        <ProductFilters base={base} params={sp} />
        <div className="results-bar">
          <span>
            {products.length} product{products.length !== 1 ? "s" : ""} found
            {allProducts.length > products.length
              ? ` (${allProducts.length} total)`
              : ""}
          </span>
        </div>
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Koi product nahi mila. Filters hata kar dobara dekhein!
          </p>
        )}
      </section>
    </>
  );
}