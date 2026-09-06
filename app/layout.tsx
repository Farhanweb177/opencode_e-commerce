import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import "./globals.css";
import "@/components/skip-link.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "All in One – Online Shopping Store",
    template: "%s – All in One",
  },
  description:
    "All in One — Electronics, Ladies Boutique, Winter & Summer Clothing, Cosmetics aur Laptop Accessories sab ek jagah. Best prices with fast delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ur" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
