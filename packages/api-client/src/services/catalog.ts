import type { ApiClient } from '../client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Product,
  ProductImage,
  ProductListItem,
  ProductQueryFilter,
  CreateProductRequest,
  UpdateProductRequest,
  Inventory,
  UpdateInventoryRequest,
  PagedResult,
} from '../types';

export function createCatalogService(client: ApiClient) {
  return {
    // Categories
    getCategories: () =>
      client.get<Category[]>('/catalog/categories'),

    getCategoryTree: () =>
      client.get<Category[]>('/catalog/categories/tree'),

    getCategoryBySlug: (slug: string) =>
      client.get<Category>(`/catalog/categories/slug/${slug}`),

    getCategoryById: (id: string) =>
      client.get<Category>(`/catalog/categories/${id}`),

    createCategory: (data: CreateCategoryRequest) =>
      client.post<Category>('/catalog/categories', data),

    updateCategory: (id: string, data: UpdateCategoryRequest) =>
      client.put<Category>(`/catalog/categories/${id}`, data),

    deleteCategory: (id: string) =>
      client.delete<void>(`/catalog/categories/${id}`),

    // Products
    getProducts: (filter?: ProductQueryFilter) =>
      client.get<PagedResult<ProductListItem>>('/catalog/products', {
        params: filter as Record<string, string | number | boolean | undefined | null>,
      }),

    getProductBySlug: (slug: string) =>
      client.get<Product>(`/catalog/products/slug/${slug}`),

    getProductById: (id: string) =>
      client.get<Product>(`/catalog/products/${id}`),

    createProduct: (data: CreateProductRequest) =>
      client.post<Product>('/catalog/products', data),

    updateProduct: (id: string, data: UpdateProductRequest) =>
      client.put<Product>(`/catalog/products/${id}`, data),

    deleteProduct: (id: string) =>
      client.delete<void>(`/catalog/products/${id}`),

    // Images
    addImage: (productId: string, data: { url: string; altText?: string; isPrimary?: boolean }) =>
      client.post<ProductImage>(`/catalog/products/${productId}/images`, data),

    removeImage: (productId: string, imageId: string) =>
      client.delete<void>(`/catalog/products/${productId}/images/${imageId}`),

    // Inventory
    getInventory: (productId: string) =>
      client.get<Inventory>(`/catalog/products/${productId}/inventory`),

    updateInventory: (productId: string, data: UpdateInventoryRequest) =>
      client.put<Inventory>(`/catalog/products/${productId}/inventory`, data),
  };
}
