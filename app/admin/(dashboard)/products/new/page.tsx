import { getCategories } from "@/lib/queries";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>New Product</h1>
          <p>Naya product catalog mein add karein</p>
        </div>
      </header>
      <section className="admin-card">
        <ProductForm categories={categories} action={createProduct} />
      </section>
    </div>
  );
}
