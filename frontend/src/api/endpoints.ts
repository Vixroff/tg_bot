import { apiJson } from "./client";
import type { AdminOrder, AdminUser, Order, PaymentResult, Product } from "../types";
import { getAdminToken } from "../admin/adminAuth";

export const api = {
  listProducts: () => apiJson<Product[]>("/api/catalog/products"),
  getProduct: (productId: number) => apiJson<Product>(`/api/catalog/products/${productId}`),
  listOrders: () => apiJson<Order[]>("/api/orders/"),
  getOrder: (orderId: number) => apiJson<Order>(`/api/orders/${orderId}`),
  createOrder: (items: { product_id: number; quantity: number }[]) =>
    apiJson<Order>("/api/orders/", { method: "POST", body: { items } }),
  mockPay: (orderId: number) =>
    apiJson<PaymentResult>("/api/payments/mock-pay", {
      method: "POST",
      body: { order_id: orderId }
    }),

  adminListProducts: () =>
    apiJson<Product[]>("/api/admin/products", {
      headers: adminHeaders()
    }),
  adminCreateProduct: (payload: Partial<Product> & { name: string; price: number; unit: string }) =>
    apiJson<Product>("/api/admin/products", {
      method: "POST",
      headers: adminHeaders(),
      body: payload
    }),
  adminUpdateProduct: (productId: number, payload: Partial<Product>) =>
    apiJson<Product>(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: payload
    }),
  adminDeactivateProduct: (productId: number) =>
    apiJson<Product>(`/api/admin/products/${productId}`, {
      method: "DELETE",
      headers: adminHeaders()
    }),

  adminListOrders: () =>
    apiJson<AdminOrder[]>("/api/admin/orders", {
      headers: adminHeaders()
    }),
  adminUpdateOrder: (orderId: number, payload: { status: string }) =>
    apiJson<AdminOrder>(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: payload
    }),

  adminListUsers: () =>
    apiJson<AdminUser[]>("/api/admin/users", {
      headers: adminHeaders()
    }),
  adminUpdateUser: (userId: number, payload: { is_admin: boolean }) =>
    apiJson<AdminUser>(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: payload
    })
};

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "X-Admin-Token": token } : {};
}

