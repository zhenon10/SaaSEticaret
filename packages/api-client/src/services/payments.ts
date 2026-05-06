import type { ApiClient } from '../client';

export interface InitiatePaymentResponse {
  paymentPageUrl: string;
  token: string;
}

export interface BankTransferResponse {
  orderNumber: string;
  amount: number;
  currency: string;
  bankName: string;
  branch?: string;
  accountHolder: string;
  iban: string;
  description?: string;
}

export function createPaymentService(client: ApiClient) {
  return {
    initiate: (orderId: string) =>
      client.post<InitiatePaymentResponse>(`/payments/initiate/${orderId}`),
    bankTransfer: (orderId: string) =>
      client.post<BankTransferResponse>(`/payments/bank-transfer/${orderId}`),
  };
}
