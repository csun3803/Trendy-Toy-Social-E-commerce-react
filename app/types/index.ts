export interface SeriesItem {
  series_id: string;
  series_name: string;
  cover_image: string;
  min_price: string;
  sales_count: number;
  description?: string;
}

export interface SeriesDetail {
  seriesId: string;
  seriesName: string;
  description: string;
  coverImage: string;
  minPrice: number;
  fullsetPrice: number;
  status: string;
  ipAlbumId: string;
  theme: string;
  releaseYear: string;
  regularVariants: number;
  hiddenVariants: number;
  totalVariants: number;
  seriesHotness: number;
  startDate: string;
  salesCount: number;
  products?: Product[];
}

export interface Product {
  productId: string;
  seriesId: string;
  productName: string;
  variantType: string;
  rarity: string;
  price: number;
  stock: number;
  description: string;
  productImages: string | string[];
  sortOrder: number;
  status: string;
}

export interface PurchaseData {
  seriesId: string;
  seriesName: string;
  purchaseType: string;
  productId?: string;
  productName: string;
  variantType: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  image: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface SeriesListResponse {
  records: SeriesItem[];
  total: number;
  list?: SeriesItem[];
  items?: SeriesItem[];
  count?: number;
}

export interface AlbumItem {
  id: string;
  name: string;
  img: string;
}

export interface AlbumDetail {
  ipName: string;
  shortDescription: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  avatarUrl: string;
  accountLevel: number;
  postCount: number;
  followingCount: number;
  followerCount: number;
  totalOrders: number;
  couponCount: number;
  cabinetCount: number;
}

// 销售系列相关类型
export interface SaleSeriesItem {
  saleSeriesId: string;
  shopId: string;
  seriesId: string;
  saleTitle: string;
  saleDescription: string;
  saleCoverImage: string;
  saleStatus: string;
  variantCount: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleVariantItem {
  saleVariantId: string;
  saleSeriesId: string;
  variantId: string;
  shopId: string;
  salePrice: number;
  crossedPrice: number;
  stockQuantity: number;
  warningStock: number;
  skuCode: string;
  saleStatus: string;
  limitQuantity: number;
  customDescription: string;
  customImages: string;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
  variantName?: string;
}

export interface SaleSeriesListResponse {
  records: SaleSeriesItem[];
  total: number;
  list?: SaleSeriesItem[];
  items?: SaleSeriesItem[];
  count?: number;
}

// 订单相关类型
export interface OrderItemRequest {
  productId: string;
  originalPrice: number;
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
  allocatedDiscount: number;
  actualSubtotal: number;
  itemSellerId: string;
}

export interface CreateOrderRequest {
  userId: string;
  amount: number;
  shippingFee: number;
  totalDiscount: number;
  actualAmount: number;
  addressId?: string;
  userRemark?: string;
  items: OrderItemRequest[];
}

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  productId: string;
  originalPrice: number;
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
  allocatedDiscount: number;
  actualSubtotal: number;
  itemAfterSalesStatus: string;
  itemRefundAmount: number;
  refundQuantity: number;
  itemSellerId: string;
  createTime: string;
  updateTime: string;
}

export interface Order {
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  shippingFee: number;
  totalDiscount: number;
  actualAmount: number;
  settlementAmount: number;
  platformCommission: number;
  refundAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentTime: string;
  addressId: string;
  logisticsCompany: string;
  trackingNumber: string;
  shippingStatus: string;
  shippedTime: string;
  receivedTime: string;
  logisticsTracking: any;
  estimatedDelivery: string;
  orderStatus: string;
  cancelReason: string;
  cancelTime: string;
  completeTime: string;
  totalQuantity: number;
  productVarietyCount: number;
  afterSalesStatus: string;
  afterSalesTime: string;
  lastAfterSalesTime: string;
  userRemark: string;
  paymentDeadline: string;
  autoCancelTime: string;
  createTime: string;
  updateTime: string;
  items?: OrderItem[];
}

// 地址相关类型
export interface UserAddress {
  addressId: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  country: string;
  province: string;
  city: string;
  district: string;
  street: string;
  detailAddress: string;
  fullAddress: string;
  postalCode: string;
  addressTag: string;
  isDefault: boolean;
  longitude: number;
  latitude: number;
  createTime?: string;
  updateTime?: string;
}

export interface CreateAddressRequest {
  recipientName: string;
  recipientPhone: string;
  country?: string;
  province: string;
  city: string;
  district?: string;
  street?: string;
  detailAddress: string;
  postalCode?: string;
  addressTag?: string;
  isDefault?: boolean;
  longitude?: number;
  latitude?: number;
}

export interface UpdateAddressRequest {
  addressId: string;
  recipientName?: string;
  recipientPhone?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  detailAddress?: string;
  postalCode?: string;
  addressTag?: string;
  isDefault?: boolean;
  longitude?: number;
  latitude?: number;
}

export interface ProductSnapshot {
  sku: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  category: string;
}

export interface CartItem {
  cartItemId: string;
  userId: string;
  shopId: string;
  saleSeriesId: string;
  saleVariantId: string;
  variantId: string;
  productSnapshot: ProductSnapshot | string;
  quantity: number;
  isSelected: boolean;
  addedAt: string;
  updatedAt: string;
  expireAt: string;
  sourceType: string;
  sourceId: string;
}

export interface AddToCartRequest {
  userId: string;
  shopId: string;
  saleSeriesId: string;
  saleVariantId: string;
  variantId: string;
  productSnapshot: ProductSnapshot;
  quantity?: number;
  sourceType?: string;
  sourceId?: string;
}

export interface UpdateCartRequest {
  cartItemId: string;
  quantity?: number;
  isSelected?: boolean;
}

export interface CartListResponse {
  records: CartItem[];
  total: number;
  list?: CartItem[];
  items?: CartItem[];
  count?: number;
}

export interface CartSummary {
  totalItems: number;
  selectedItems: number;
  totalAmount: number;
  selectedAmount: number;
}
