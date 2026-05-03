// ── Auth ──────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  kvkkConsent: boolean;
  marketingConsent: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketingConsent: boolean;
}

// ── Addresses ─────────────────────────────────────────────────────────────────

export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressRequest {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  kvkkConsent?: boolean;
  marketingConsent?: boolean;
}

export interface WebLoginResponse {
  user: UserInfo;
}

export interface MobileLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface RefreshRequest {
  refreshToken?: string;
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isLowStock: boolean;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  colors?: string[];
  sizes?: string[];
  isActive: boolean;
  isFeatured: boolean;
  categoryId?: string;
  category?: { id: string; name: string; slug: string };
  images: ProductImage[];
  inventory?: Inventory;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId?: string;
  categoryName?: string;
  primaryImageUrl?: string;
  isInStock: boolean;
  availableQuantity: number;
  createdAt: string;
}

export interface ProductQueryFilter {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  colors?: string[];
  sizes?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  initialStock?: number;
  lowStockThreshold?: number;
}

export interface UpdateProductRequest extends CreateProductRequest {}

export interface UpdateInventoryRequest {
  quantity: number;
  lowStockThreshold?: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  sku?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isAvailable: boolean;
  availableQty: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  updatedAt?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export interface Address {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  notes?: string;
  cancelReason?: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CheckoutRequest {
  shippingAddress: Address;
  billingAddress?: Address;
  currency?: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface OrderQueryFilter {
  status?: OrderStatus;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
