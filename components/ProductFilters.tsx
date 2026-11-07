import type { Product, Category } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" },
  { value: "name-asc", label: "Name: A-Z" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3★ & above" },
  { value: "4", label: "4★ & above" },
  { value: "4.5", label: "4.5★ & above" },
];

export function ProductFilters({
  base,
  params,
  showSearch = false,
}: {
  base: string;
  params: {
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    rating?: string;
  };
  showSearch?: boolean;
}) {
  return (
    <form method="get" action={base} className="product-filters">
      {!showSearch && params.q && (
        <input type="hidden" name="q" value={params.q} />
      )}
      {showSearch && (
        <div className="filter-field filter-search">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
      )}
      <div className="filter-field">
        <select name="sort" defaultValue={params.sort ?? ""} aria-label="Sort">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <input
          type="number"
          name="minPrice"
          defaultValue={params.minPrice ?? ""}
          placeholder="Min price"
          aria-label="Min price"
        />
      </div>
      <div className="filter-field">
        <input
          type="number"
          name="maxPrice"
          defaultValue={params.maxPrice ?? ""}
          placeholder="Max price"
          aria-label="Max price"
        />
      </div>
      <div className="filter-field">
        <select name="rating" defaultValue={params.rating ?? ""} aria-label="Rating">
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <label className="filter-check">
        <input
          type="checkbox"
          name="inStock"
          value="1"
          defaultChecked={params.inStock === "1"}
        />
        In stock only
      </label>
      <button type="submit" className="btn btn-outline filter-apply">
        Apply
      </button>
      <a href={showSearch ? "/search" : base} className="filter-clear">
        Clear
      </a>
    </form>
  );
}

export function applyFilters(
  products: Product[],
  filters: {
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    rating?: string;
    sort?: string;
  }
): Product[] {
  let result = [...products];

  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min)) result = result.filter((p) => p.price >= min);
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max)) result = result.filter((p) => p.price <= max);
  }
  if (filters.rating) {
    const minRating = Number(filters.rating);
    if (!Number.isNaN(minRating)) {
      result = result.filter((p) => p.rating >= minRating);
    }
  }
  if (filters.inStock === "1") {
    result = result.filter((p) => p.inStock);
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating-desc":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "name-asc":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  return result;
}

export function categoryNameFor(
  slug: string,
  categories: Category[]
): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}