export type Category = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  description: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  emoji: string;
  gradient: string;
  imageUrl?: string | null;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock?: number;
  tag?: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  gradient: string;
  imageUrl?: string | null;
};

export type ProductSnapshot = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "category"
  | "price"
  | "emoji"
  | "gradient"
  | "imageUrl"
  | "inStock"
  | "stock"
>;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "received" | "failed";

export type Order = {
  id: string;
  order_number: string;
  user_id?: string | null;
  user_email?: string | null;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  payment_method: string;
  payment_status: PaymentStatus;
  items: {
    productId: string;
    name: string;
    emoji: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  coupon_code?: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

export type ValidatedCoupon = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
};

export type TrackedOrder = {
  order_number: string;
  customer_name: string;
  city: string;
  status: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: { name: string; emoji: string; price: number; quantity: number }[];
  created_at: string;
};

export type Coupon = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};
