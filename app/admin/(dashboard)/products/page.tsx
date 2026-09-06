import Link from "next/link";
import { getCategories } from "@/lib/queries";
import {
  getAdminProducts,
} from "@/lib/admin-queries";
import { formatPrice } from "@/lib/utils";
import { isAdminConfigured } from "@/lib/admin-auth";
import { DeleteButton } from "../DeleteButton";
import { deleteProduct, toggleStock } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = (sp.q as string | undefined)?.toLowerCase().trim() ?? "";
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);

  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ]);

  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : products;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const queryString = q ? `&q=${encodeURIComponent(q)}` : "";

  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Products</h1>
          <p>
            {isAdminConfigured()
              ? `${filtered.length} products (page ${currentPage}/${totalPages})`
              : "Database connected nahi"}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + New Product
        </Link>
      </header>

      <form className="admin-search-bar" action="/admin/products">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, slug ya category se search karein..."
        />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
      </form>

      <section className="admin-card">
        {filtered.length === 0 ? (
          <div className="admin-empty-box">
            {products.length === 0 ? (
              <>
                <p>Database mein koi product nahi.</p>
                <p>
                  Dashboard par ja kar <strong>Import Starter Data</strong>{" "}
                  button use karein, ya naya product add karein.
                </p>
              </>
            ) : (
              <p>Search se koi product match nahi hua.</p>
            )}
          </div>
        ) : (
          <table className="admin-table admin-table-products">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="admin-product-thumb"
                        />
                      ) : (
                        <span
                          className="admin-product-thumb"
                          style={{ background: product.gradient }}
                        >
                          {product.emoji}
                        </span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small className="mono">{product.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>{categoryName(product.category)}</td>
                  <td>
                    {formatPrice(product.price)}
                    {product.originalPrice && (
                      <s className="admin-old-price">
                        {formatPrice(product.originalPrice)}
                      </s>
                    )}
                  </td>
                  <td>
                    <div className="admin-stock-cell">
                      <form
                        action={toggleStock}
                        style={{ display: "inline" }}
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          type="hidden"
                          name="inStock"
                          value={String(product.inStock)}
                        />
                        <button
                          type="submit"
                          className={
                            product.inStock
                              ? "status-badge status-delivered"
                              : "status-badge status-cancelled"
                          }
                          title="Click to toggle stock"
                        >
                          {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                        </button>
                      </form>
                      {typeof product.stock === "number" && (
                        <span
                          className={
                            product.stock <= 5
                              ? "admin-stock-count low"
                              : "admin-stock-count"
                          }
                          title="Available quantity"
                        >
                          {product.stock} left
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="admin-action-btn"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <DeleteButton
                        id={product.id}
                        serverAction={deleteProduct}
                        confirmText={`"${product.name}" delete karna hai?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Pagination">
          <Link
            className={currentPage <= 1 ? "btn btn-outline disabled" : "btn btn-outline"}
            href={currentPage > 1 ? `/admin/products?page=${currentPage - 1}${queryString}` : "#"}
            aria-disabled={currentPage <= 1}
          >
            ← Prev
          </Link>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Link
            className={
              currentPage >= totalPages ? "btn btn-outline disabled" : "btn btn-outline"
            }
            href={
              currentPage < totalPages
                ? `/admin/products?page=${currentPage + 1}${queryString}`
                : "#"
            }
            aria-disabled={currentPage >= totalPages}
          >
            Next →
          </Link>
        </nav>
      )}
    </div>
  );
}
