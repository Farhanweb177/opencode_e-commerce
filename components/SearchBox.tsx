"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget as HTMLFormElement).get("q") ?? "").trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form className="search-box" onSubmit={handleSubmit} role="search">
      <svg
        className="search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        key={currentQuery}
        type="search"
        name="q"
        defaultValue={currentQuery}
        placeholder="Search products..."
        aria-label="Search products"
      />
      <button type="submit" className="search-submit">
        Search
      </button>
    </form>
  );
}