import { notFound } from "next/navigation";
import { getCategories } from "@/lib/queries";
import { getAdminProducts } from "@/lib/admin-queries";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ]);

  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Edit Product</h1>
          <p>{product.name}</p>
        </div>
      </header>
      <section className="admin-card">
        <ProductForm
          categories={categories}
          product={product}
          action={updateProduct}
        />
      </section>
    </div>
  );
}
