import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { isAdminConfigured } from "@/lib/admin-auth";
import { DeleteButton } from "../DeleteButton";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
];

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Categories</h1>
          <p>{categories.length} categories</p>
        </div>
      </header>

      {!isAdminConfigured() && (
        <p className="admin-alert admin-alert-warn">
          Database connected nahi — edits save nahi honge.
        </p>
      )}

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Add New Category</h2>
        </div>
        <form action={createCategory} className="category-add-form">
          <input
            name="name"
            placeholder="Name *"
            required
            className="cat-input"
          />
          <input name="slug" placeholder="Slug (optional)" className="cat-input" />
          <input
            name="emoji"
            placeholder="Emoji"
            maxLength={4}
            defaultValue="🛍️"
            className="cat-input cat-input-sm"
          />
          <input
            name="description"
            placeholder="Description"
            className="cat-input cat-input-wide"
          />
          <select name="gradient" className="cat-input">
            {GRADIENTS.map((g, i) => (
              <option key={g} value={g}>
                Gradient {i + 1}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </section>

      <section className="categories-admin-list">
        {categories.map((cat) => (
          <form
            key={cat.slug}
            action={updateCategory}
            className="admin-card category-row"
          >
            <input type="hidden" name="originalSlug" value={cat.slug} />
            <span
              className="category-row-swatch"
              style={{ background: cat.gradient }}
            >
              {cat.emoji}
            </span>
            <div className="category-row-fields">
              <input name="name" defaultValue={cat.name} required />
              <small className="mono">/{cat.slug}</small>
              <input
                name="description"
                defaultValue={cat.description}
                placeholder="Description"
              />
              <div className="category-row-meta">
                <input
                  name="emoji"
                  defaultValue={cat.emoji}
                  maxLength={4}
                  aria-label="Emoji"
                />
                <select name="gradient" defaultValue={cat.gradient}>
                  {[cat.gradient, ...GRADIENTS.filter((g) => g !== cat.gradient)].map(
                    (g, i) => (
                      <option key={i} value={g}>
                        Gradient {i === 0 ? "(current)" : i + 1}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="admin-actions-cell">
              <button type="submit" className="admin-action-btn" title="Save">
                💾
              </button>
              <Link href={`/category/${cat.slug}`} className="admin-action-btn" title="View">
                👁
              </Link>
              <DeleteButton
                id={cat.slug}
                serverAction={deleteCategory}
                confirmText={`"${cat.name}" aur iske saare products delete ho jayenge. Continue?`}
              />
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
