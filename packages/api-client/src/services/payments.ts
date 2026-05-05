import type { ApiClient } from '../client';

export interface InitiatePaymentResponse {
  paymentPageUrl: string;
  token: string;
}

export function createPaymentService(client: ApiClient) {
  return {
    initiate: (orderId: string) =>
      client.post<InitiatePaymentResponse>(`/payments/initiate/${orderId}`),
  };
}
