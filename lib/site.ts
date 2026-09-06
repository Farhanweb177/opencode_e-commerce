// WhatsApp number (store ki asli number yahan daalein).
// Format: sirf digits, country code ke saath — 923001234567
export const SITE_WHATSAPP_NUMBER = "923001234567";

export const SITE_WHATSAPP_DISPLAY = "+92 300 123 4567";

export const SITE_WHATSAPP_LINK = `https://wa.me/${SITE_WHATSAPP_NUMBER}`;

export function buildWhatsAppLink(message: string): string {
  return `${SITE_WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

// SEO/structured data ke liye canonical site URL
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
