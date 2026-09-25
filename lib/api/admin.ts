import { apiRequest } from "@/lib/api/client";
import type { AdminProductInput } from "@/lib/validators/admin-product";
import type { AdminCategoryInput } from "@/lib/validators/admin-category";
import type { ContactLinksInput } from "@/lib/validators/contact-links";
import type { StoreInfo } from "@/lib/validators/store-info";
import type { OrderStatus, PaymentStatus } from "@/lib/constants/order";
import type { AdminLoginData } from "@/lib/validators/admin-auth";

/** Typed calls to the admin API. Admin components use these, not fetch. */

export type AdminNotification = {
  id: string;
  order_id: string;
  order_number: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type UploadedProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
};

export const adminAuthApi = {
  login: (credentials: AdminLoginData) =>
    apiRequest("/api/admin/login", {
      method: "POST",
      body: credentials,
      fallbackError: "Не вдалося увійти.",
    }),
  logout: () => apiRequest("/api/admin/logout", { method: "POST" }),
};

export const adminProductsApi = {
  create: (product: AdminProductInput) =>
    apiRequest<{ id: string }>("/api/admin/products", {
      method: "POST",
      body: product,
      fallbackError: "Не вдалося зберегти товар.",
    }),
  update: (id: string, product: AdminProductInput) =>
    apiRequest<{ id: string }>(`/api/admin/products/${id}`, {
      method: "PUT",
      body: product,
      fallbackError: "Не вдалося зберегти зміни.",
    }),
  remove: (id: string) =>
    apiRequest(`/api/admin/products/${id}`, {
      method: "DELETE",
      fallbackError: "Не вдалося видалити товар.",
    }),
  uploadImage: (productId: string, form: FormData) =>
    apiRequest<{ image: UploadedProductImage }>(
      `/api/admin/products/${productId}/images`,
      {
        method: "POST",
        body: form,
        fallbackError: "Не вдалося завантажити зображення.",
      },
    ),
  updateImage: (
    productId: string,
    imageId: string,
    image: { alt: string; color: string | null; sortOrder: number },
  ) =>
    apiRequest(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      body: image,
      fallbackError: "Не вдалося оновити зображення.",
    }),
  removeImage: (productId: string, imageId: string) =>
    apiRequest(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
      fallbackError: "Не вдалося видалити зображення.",
    }),
};

export const adminCategoriesApi = {
  create: (category: AdminCategoryInput) =>
    apiRequest<{ id: string }>("/api/admin/categories", {
      method: "POST",
      body: category,
      fallbackError: "Не вдалося створити категорію.",
    }),
  update: (id: string, category: AdminCategoryInput) =>
    apiRequest<{ id: string }>(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: category,
      fallbackError: "Не вдалося зберегти категорію.",
    }),
  remove: (id: string) =>
    apiRequest(`/api/admin/categories/${id}`, {
      method: "DELETE",
      fallbackError: "Не вдалося видалити категорію.",
    }),
  reorder: (ids: string[]) =>
    apiRequest("/api/admin/categories", {
      method: "PATCH",
      body: { ids },
      fallbackError: "Не вдалося змінити порядок.",
    }),
  uploadImage: (id: string, form: FormData) =>
    apiRequest<{ imageUrl: string }>(`/api/admin/categories/${id}/image`, {
      method: "POST",
      body: form,
      fallbackError: "Не вдалося завантажити зображення.",
    }),
  removeImage: (id: string) =>
    apiRequest(`/api/admin/categories/${id}/image`, {
      method: "DELETE",
      fallbackError: "Не вдалося видалити зображення.",
    }),
};

export const adminOrdersApi = {
  updateStatus: (
    id: string,
    statuses: { status: OrderStatus; paymentStatus: PaymentStatus },
  ) =>
    apiRequest(`/api/admin/orders/${id}`, {
      method: "PATCH",
      body: statuses,
      fallbackError: "Не вдалося оновити замовлення.",
    }),
};

export const adminNotificationsApi = {
  list: () =>
    apiRequest<{ notifications: AdminNotification[]; unreadCount: number }>(
      "/api/admin/notifications",
    ),
  markRead: (id: string) =>
    apiRequest("/api/admin/notifications", {
      method: "PATCH",
      body: { id },
    }),
};

export const adminSettingsApi = {
  saveContactLinks: (links: ContactLinksInput) =>
    apiRequest("/api/admin/settings/contact-links", {
      method: "PUT",
      body: links,
      fallbackError: "Не вдалося зберегти контакти.",
    }),
  saveStoreInfo: (info: StoreInfo) =>
    apiRequest("/api/admin/settings/store-info", {
      method: "PUT",
      body: info,
      fallbackError: "Не вдалося зберегти інформацію.",
    }),
};
