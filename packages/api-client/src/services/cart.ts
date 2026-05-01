import type { ApiClient } from '../client';
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types';

export function createCartService(client: ApiClient) {
  return {
    getCart: () =>
      client.get<Cart>('/orders/cart'),

    addItem: (data: AddToCartRequest) =>
      client.post<Cart>('/orders/cart/items', data),

    updateItem: (itemId: string, data: UpdateCartItemRequest) =>
      client.put<Cart>(`/orders/cart/items/${itemId}`, data),

    removeItem: (itemId: string) =>
      client.delete<Cart>(`/orders/cart/items/${itemId}`),

    clearCart: () =>
      client.delete<void>('/orders/cart'),
  };
}
