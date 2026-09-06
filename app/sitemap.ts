import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "",
    "/search",
    "/wishlist",
    "/track",
    "/login",
    "/account",
    "/about",
    "/contact",
    "/faq",
    "/returns",
    "/privacy",
  ];

  const staticUrls: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  return staticUrls;
}