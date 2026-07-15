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

// 店铺相关类型（匹配后端 Shop 实体）
export interface ShopInfo {
  shopId: string;
  shopName: string;
  shopCover?: string;
  shopType?: string;
  businessEntityType?: string;
  legalPersonName?: string;
  unifiedSocialCreditCode?: string;
  businessScope?: string;
  registeredAddress?: string;
  shopIntro?: string;
  mainCategories?: string;
  mainIps?: string;
  customerServicePhone?: string;
  customerServiceEmail?: string;
  authenticityGuarantee?: number;
  fakeCompensation?: string;
  followerCount?: number;
  productCount?: number;
  shopRating?: number;
  refundRate?: number;
  shopStatus?: string;
  businessStatus?: string;
  freeShippingSetting?: string;
  platformCommissionRate?: number;
  techServiceRate?: number;
  depositBalance?: number;
  depositStatus?: string;
  auditStatus?: string;
  auditNotes?: string;
  monthlySales?: number;
  totalSales?: number;
  totalSalesAmount?: number;
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
  minPrice?: number;
  maxPrice?: number;
  createdAt: string;
  updatedAt: string;
  shopName?: string;
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
  records?: SaleSeriesItem[];
  total?: number;
  list?: SaleSeriesItem[];
  items?: SaleSeriesItem[];
  count?: number;
  data?: SaleSeriesItem[];
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
  paymentMethod?: string;
  items: OrderItemRequest[];
  userCouponId?: string;
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
  productName?: string;
  productImage?: string;
  productSpec?: string;
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
  paymentTime: string;
  addressId: string;
  logisticsCompany: string;
  trackingNumber: string;
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
  shopName?: string;
}

export interface AfterSale {
  afterSaleId: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  sellerId: string;
  afterSaleType: string;
  afterSaleStatus: string;
  reason: string;
  description?: string;
  refundAmount: number;
  returnLogisticsCompany?: string;
  returnTrackingNumber?: string;
  rejectReason?: string;
  auditTime?: string;
  completeTime?: string;
  createTime: string;
  updateTime: string;
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
  shopName?: string;
  saleSeriesName?: string;
  variantName?: string;
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
  productSnapshot: string;
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

export interface SocialActivity {
  activityId: string;
  userId: string;
  activityType: string;
  title: string;
  content: string;
  coverImage: string;
  imageList: string | string[];
  location: string;
  publishStatus: string;
  auditStatus: string;
  auditNotes?: string;
  auditorId?: string;
  auditedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  publishedAt: string;
  updatedAt: string;
  userInfo?: {
    userId: string;
    username: string;
    avatarUrl: string;
  };
  relatedSeries?: SeriesDetail[];
  isLiked?: boolean;
  isFollowing?: boolean;
  realViewCount?: number;
  realLikeCount?: number;
  realFavoriteCount?: number;
}

export interface ActivityListResponse {
  records: SocialActivity[];
  total: number;
  list?: SocialActivity[];
  items?: SocialActivity[];
  count?: number;
}

export interface CreateActivityRequest {
  activityType: string;
  title: string;
  content: string;
  coverImage?: string;
  imageList?: string;
  location?: string;
  publishStatus?: string;
}

export interface UpdateActivityRequest {
  activityId: string;
  activityType?: string;
  title?: string;
  content?: string;
  coverImage?: string;
  imageList?: string;
  location?: string;
  publishStatus?: string;
  auditStatus?: string;
  auditNotes?: string;
}

export interface Comment {
  commentId: string;
  activityId: string;
  userId: string;
  parentCommentId?: string;
  rootCommentId?: string;
  content: string;
  auditStatus: string;
  auditNotes?: string;
  auditorId?: string;
  auditedAt?: string;
  likeCount: number;
  replyCount: number;
  commentedAt: string;
  ipAddress?: string;
  location?: string;
  userInfo?: {
    userId: string;
    username: string;
    avatarUrl: string;
  };
  replyToUserInfo?: {
    userId: string;
    username: string;
    avatarUrl: string;
  };
  replies?: Comment[];
}

export interface CommentListResponse {
  records: Comment[];
  total: number;
  list?: Comment[];
  items?: Comment[];
  count?: number;
}

export interface CreateCommentRequest {
  activityId: string;
  userId?: string;
  content: string;
  parentCommentId?: string;
  rootCommentId?: string;
  location?: string;
}

export interface UpdateCommentRequest {
  commentId: string;
  content?: string;
}

// 售后相关类型
export interface AfterSale {
  afterSaleId: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  sellerId: string;
  afterSaleType: string; // REFUND, RETURN, EXCHANGE
  // PENDING, APPROVED, REJECTED, COMPLETED, CLOSED,
  // PLATFORM_REVIEWING（平台介入审核中）, PLATFORM_RESOLVED（平台已裁决）
  afterSaleStatus: string;
  reason: string;
  description?: string;
  evidenceImages?: string;
  refundAmount: number;
  returnLogisticsCompany?: string;
  returnTrackingNumber?: string;
  returnAddress?: string;
  timeoutAutoApproveTime?: string;
  platformInterventionReason?: string;
  platformInterventionTime?: string;
  platformAdminId?: string;
  platformArbitrationResult?: string; // USER | SELLER
  platformArbitrationReason?: string;
  platformArbitrationTime?: string;
  rejectReason?: string;
  auditTime?: string;
  completeTime?: string;
  createTime: string;
  updateTime: string;
  productName?: string;
  productImage?: string;
  productSpec?: string;
  shopName?: string;
  orderNo?: string;
}

export interface CreateAfterSaleRequest {
  orderId: string;
  orderItemId: string;
  afterSaleType: string;
  reason: string;
  description?: string;
  evidenceImages?: string[];
  refundAmount: number;
}

// 抽盒机相关类型
export interface BlindBoxMachine {
  machineId: string;
  saleSeriesId: string;
  shopId: string;
  machineName: string;
  machineDescription: string;
  machineCoverImage: string;
  drawPrice: number;
  tenDrawPrice: number | null;
  machineStatus: string;
  totalStock: number;
  totalDraws: number;
  guaranteeDraws: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  shopName?: string;
  saleSeriesName?: string;
}

export interface BlindBoxDrawRecord {
  recordId: string;
  machineId: string;
  userId: string;
  setId?: string;
  slotNo?: number;
  saleVariantId: string;
  variantId: string;
  drawType: string;
  orderId?: string;
  orderNo?: string;
  isHidden: boolean;
  isGuaranteed: boolean;
  drawPrice: number;
  status: 'PENDING_OPEN' | 'OPENED';
  openedAt?: string;
  createdAt: string;
  variantName?: string;
  variantImage?: string;
  machineName?: string;
  username?: string;
  avatarUrl?: string;
}

export interface DrawnItem {
  saleVariantId: string;
  variantId: string;
  variantName: string;
  variantImage: string;
  isHidden: boolean;
  isGuaranteed: boolean;
  price: number;
}

export interface DrawResult {
  orderId: string;
  orderNo: string;
  totalPrice: number;
  drawnItems: DrawnItem[];
}

export interface DrawRequest {
  machineId: string;
  userId: string;
  drawType: 'SINGLE' | 'TEN';
  addressId?: string;
  paymentMethod?: string;
}

// 选盒（Pick-box）相关类型
export interface BlindBoxSlot {
  slotNo: number;
  slotCode: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'SELECTED';
  saleVariantId?: string;
  variantName?: string;
  variantImage?: string;
  isHidden?: boolean;
  drawnBy?: string;
  drawnAt?: string;
}

export interface BlindBoxMachineDetail extends BlindBoxMachine {
  slots: BlindBoxSlot[];
  hiddenProbability?: string;
  regularProbability?: string;
  guaranteeRule?: string;
  remainingSeconds?: number;
  queueCount?: number;
  isInQueue?: boolean;
  queuePosition?: number;
  variantList?: SaleVariantItem[];
  productDescription?: string;
  productImages?: string;
}

export interface BlindBoxPickRequest {
  machineId: string;
  userId: string;
  slotNo?: number;
  slotCode?: string;
  addressId?: string;
  paymentMethod?: string;
}

export interface BlindBoxPickResult {
  orderId: string;
  orderNo: string;
  slotNo: number;
  slotCode: string;
  saleVariantId: string;
  variantId: string;
  variantName: string;
  variantImage: string;
  isHidden: boolean;
  isGuaranteed: boolean;
  price: number;
  totalPrice: number;
  remainingSeconds?: number;
  storageId?: string;
}

// ==================== 优惠券相关类型 ====================

/** 用户券视图 */
export interface UserCouponDTO {
  userCouponId: string;
  userId: string;
  templateId: string;
  couponCode: string;
  status: string; // unused/used/expired/revoked
  claimedAt: string;
  usedAt?: string;
  expiresAt: string;
  orderId?: string;
  templateName?: string;
  type?: string;
  discountValue?: number;
  minSpend?: number;
}

/** 下单页可用券 */
export interface AvailableCouponDTO {
  userCouponId: string;
  templateId: string;
  templateName: string;
  discountValue: number;
  minSpend: number;
  expiresAt: string;
  couponCode: string;
  usable: boolean;
  discountAmount: number;
  payableAmount: number;
}
