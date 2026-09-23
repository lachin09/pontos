import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/constants/order";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  productImage: string | null;
  size: string;
  color: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  comment: string | null;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
