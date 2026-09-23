import type { OrderRepository } from "@/repositories/order.repository";

export function createOrderService(repository: OrderRepository) {
  return {
    listOrders: () => repository.list(),
    getOrderById: (id: string) => repository.getById(id),
  };
}
