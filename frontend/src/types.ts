export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  is_active: boolean;
  category: string | null;
  image_url: string | null;
};

export type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  price_at_order: number;
  product: {
    id: number;
    name: string;
    unit: string | null;
    image_url: string | null;
  } | null;
};

export type Order = {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  created_at: string | null;
  items: OrderItem[];
};

export type AdminOrderItem = OrderItem;

export type AdminOrder = {
  id: number;
  user_id: number;
  user: { id: number; telegram_id: number; username: string | null } | null;
  status: string;
  total_amount: number;
  created_at: string | null;
  items: AdminOrderItem[];
};

export type AdminUser = {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string | null;
};

export type Payment = {
  id: number;
  order_id: number;
  amount: number;
  status: string;
  provider: string;
  external_id: string | null;
};

export type PaymentResult = {
  order: Order;
  payment: Payment;
};

