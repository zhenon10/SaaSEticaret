import type { ApiClient } from '../client';
import type { UserAddress, AddressRequest } from '../types';

export function createAddressService(client: ApiClient) {
  return {
    getAll:     ()                          => client.get<UserAddress[]>('/addresses'),
    create:     (data: AddressRequest)      => client.post<UserAddress>('/addresses', data),
    update:     (id: string, data: AddressRequest) => client.put<UserAddress>(`/addresses/${id}`, data),
    remove:     (id: string)               => client.delete<void>(`/addresses/${id}`),
    setDefault: (id: string)               => client.put<UserAddress>(`/addresses/${id}/default`),
  };
}
