export type CheckoutSessionResult = {
  url?: string;
  error?: string;
};

export function isOnlinePaymentConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function createCheckoutSession(input: {
  orderNumber: string;
  amount: number;
}): Promise<CheckoutSessionResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { error: "Online payment configured nahi." };
  }

  try {
    const base = siteBaseUrl();
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "pkr",
      "line_items[0][price_data][unit_amount]": String(
        Math.max(50, Math.round(input.amount * 100))
      ),
      "line_items[0][price_data][product_data][name]": `All in One Order ${input.orderNumber}`,
      "line_items[0][price_data][product_data][description]":
        "All in One e-commerce order",
      success_url: `${base}/track?placed=${encodeURIComponent(input.orderNumber)}`,
      cancel_url: `${base}/checkout?cancelled=1`,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = await response.json();

    if (!response.ok || !json.url) {
      console.error("[payment] stripe error:", json?.error?.message ?? response.status);
      return { error: json?.error?.message ?? "Stripe payment fail hua." };
    }
    return { url: json.url as string };
  } catch (error) {
    console.error("[payment] stripe request failed:", error);
    return { error: "Stripe se connect nahi ho paya." };
  }
}