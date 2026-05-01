import type { ApiClient } from '../client';
import type {
  Order,
  OrderListItem,
  CheckoutRequest,
  UpdateOrderStatusRequest,
  OrderQueryFilter,
  PagedResult,
} from '../types';

export function createOrderService(client: ApiClient) {
  return {
    checkout: (data: CheckoutRequest) =>
      client.post<Order>('/orders/checkout', data),

    getOrders: (filter?: OrderQueryFilter) =>
      client.get<PagedResult<OrderListItem>>('/orders', {
        params: filter as Record<string, string | number | boolean | undefined | null>,
      }),

    getOrderById: (id: string) =>
      client.get<Order>(`/orders/${id}`),

    getOrderByNumber: (orderNumber: string) =>
      client.get<Order>(`/orders/number/${orderNumber}`),

    updateStatus: (id: string, data: UpdateOrderStatusRequest) =>
      client.put<Order>(`/orders/${id}/status`, data),

    cancelOrder: (id: string, reason?: string) =>
      client.post<Order>(`/orders/${id}/cancel`, reason),
  };
}
