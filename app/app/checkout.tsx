import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { createOrder, batchCreateOrders } from '../services/orderService';
import { getUserAddresses } from '../services/addressService';
import { getAvailableCoupons } from '../services/couponService';
import { getUserIdFromToken } from '../utils/jwtHelper';
import type { UserAddress, ProductSnapshot, AvailableCouponDTO } from '../types';

interface ShopGroup {
  shopId: string;
  shopName?: string;
  items: any[];
}

const Checkout = () => {
  const { items: itemsStr } = useLocalSearchParams<{ items?: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [shopGroups, setShopGroups] = useState<ShopGroup[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCouponDTO[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<AvailableCouponDTO | null>(null);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  useEffect(() => {
    initCheckout();
  }, []);

  // 拉取可用优惠券
  const fetchAvailableCoupons = async (amount: number) => {
    if (amount <= 0) {
      setAvailableCoupons([]);
      return;
    }
    try {
      const response = await getAvailableCoupons(amount);
      let list: AvailableCouponDTO[] = [];
      if (response.data) {
        if (response.data.code === 200 && response.data.data) {
          list = response.data.data;
        } else if (Array.isArray(response.data)) {
          list = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          list = response.data.data;
        }
      }
      setAvailableCoupons(list);
      // 若当前选中的券已不在可用列表中，则重置
      if (
        selectedCoupon &&
        !list.find((c) => c.userCouponId === selectedCoupon.userCouponId && c.usable)
      ) {
        setSelectedCoupon(null);
      }
    } catch (error) {
      console.error('获取可用优惠券失败', error);
    }
  };

  // 当前优惠金额
  const couponDiscount = () => {
    if (!selectedCoupon) return 0;
    return Number(selectedCoupon.discountAmount || selectedCoupon.discountValue || 0);
  };

  const calculatePayableAmount = () => {
    const total = calculateTotalAmount();
    const discount = couponDiscount();
    return Math.max(0, total - discount);
  };

  const initCheckout = async () => {
    try {
      // 解析购物车项数据
      if (itemsStr) {
        const parsedItems = JSON.parse(itemsStr);
        setItems(parsedItems);
        
        // 按店铺分组商品
        const groups = new Map<string, ShopGroup>();
        parsedItems.forEach((item: any) => {
          const shopId = item.shopId || 'unknown';
          if (!groups.has(shopId)) {
            groups.set(shopId, {
              shopId,
              shopName: '店铺',
              items: []
            });
          }
          groups.get(shopId)!.items.push(item);
        });
        
        setShopGroups(Array.from(groups.values()));
      }

      // 获取用户地址
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.back();
        return;
      }

      const addressResponse = await getUserAddresses(userId);
      let addressList: UserAddress[] = [];
      if (addressResponse.data) {
        if (addressResponse.data.code === 200 && addressResponse.data.data) {
          addressList = addressResponse.data.data;
        } else if (Array.isArray(addressResponse.data)) {
          addressList = addressResponse.data;
        }
      }

      setAddresses(addressList);

      // 自动选择默认地址或第一个地址
      if (addressList.length > 0) {
        const defaultAddr = addressList.find(addr => addr.isDefault) || addressList[0];
        setSelectedAddress(defaultAddr);
      }

      // 拉取可用优惠券
      const totalAmount = parsedItems.reduce((sum: number, item: any) => {
        const snapshot = getProductSnapshot(item.productSnapshot);
        return sum + (snapshot.price * item.quantity);
      }, 0);
      await fetchAvailableCoupons(totalAmount);
    } catch (error) {
      console.error('初始化结算页面失败:', error);
      Alert.alert('错误', '初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getProductSnapshot = (product: any): ProductSnapshot => {
    if (typeof product === 'string') {
      try {
        return JSON.parse(product);
      } catch (e) {
        return { name: '未知商品', image: '', price: 0, sku: '', brand: '', category: '' };
      }
    }
    return product;
  };

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const snapshot = getProductSnapshot(item.productSnapshot);
      return total + (snapshot.price * item.quantity);
    }, 0);
  };

  const calculateShopAmount = (shopItems: any[]) => {
    return shopItems.reduce((total, item) => {
      const snapshot = getProductSnapshot(item.productSnapshot);
      return total + (snapshot.price * item.quantity);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('提示', '请选择收货地址');
      return;
    }

    if (items.length === 0) {
      Alert.alert('提示', '没有可结算的商品');
      return;
    }

    setSubmitting(true);
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert('提示', '请先登录');
        return;
      }

      // 构建按店铺分组的订单请求
      const shopOrders = shopGroups.map(group => {
        const orderItems = group.items.map(item => {
          const snapshot = getProductSnapshot(item.productSnapshot);
          return {
            productId: item.saleVariantId || item.cartItemId,
            originalPrice: snapshot.price,
            unitPrice: snapshot.price,
            quantity: item.quantity,
            subtotalAmount: snapshot.price * item.quantity,
            allocatedDiscount: 0,
            actualSubtotal: snapshot.price * item.quantity,
            itemSellerId: group.shopId,
            productName: snapshot.name,
            productImage: snapshot.image,
            productSpec: snapshot.sku || '',
          };
        });

        const shopAmount = calculateShopAmount(group.items);

        return {
          shopId: group.shopId,
          items: orderItems,
          amount: shopAmount,
          shippingFee: 0,
          totalDiscount: 0,
          actualAmount: shopAmount,
        };
      });

      // 调用批量创建订单接口
      const batchRequest = {
        userId,
        addressId: selectedAddress.addressId,
        userRemark: '',
        paymentMethod: '',
        userCouponId: selectedCoupon?.userCouponId || '',
        shopOrders,
      };

      const response = await batchCreateOrders(batchRequest);
      
      if (response && response.data) {
        Alert.alert('成功', '订单创建成功');
        // 跳转到订单列表
        router.replace('/order');
      } else {
        Alert.alert('失败', '订单创建失败，请重试');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      Alert.alert('错误', '订单创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
              fill="#3C3C3C"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>确认订单</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* 地址区域 */}
        <View style={styles.addressSection}>
          {selectedAddress ? (
            <TouchableOpacity
              style={styles.addressItem}
              onPress={() => router.push('/address/select')}
            >
              <View style={styles.addressHeader}>
                <Text style={styles.recipientName}>{selectedAddress.recipientName}</Text>
                <Text style={styles.recipientPhone}>{selectedAddress.recipientPhone}</Text>
                {selectedAddress.isDefault && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>默认</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressDetail} numberOfLines={2}>
                {selectedAddress.fullAddress || `${selectedAddress.province}${selectedAddress.city}${selectedAddress.district}${selectedAddress.detailAddress}`}
              </Text>
              <Svg width={16} height={16} viewBox="0 0 1024 1024" style={styles.arrowIcon}>
                <Path d="M296.094353 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L18.811294 553.984a60.446118 60.446118 0 0 1 0-84.720941L254.291059 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L137.612588 511.638588 539.231412 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z" fill="#999" transform="rotate(180 512 512)"/>
              </Svg>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addressItem}
              onPress={() => router.push('/address/edit')}
            >
              <View style={styles.emptyAddress}>
                <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                  <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z" fill="#999"/>
                </Svg>
                <Text style={styles.emptyAddressText}>请添加收货地址</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 按店铺分组的商品列表 */}
        {shopGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.itemsSection}>
            <View style={styles.shopHeader}>
              <Text style={styles.shopName}>{group.shopName}</Text>
            </View>
            {group.items.map((item, itemIndex) => {
              const snapshot = getProductSnapshot(item.productSnapshot);
              const imageUrl = snapshot.image && snapshot.image.startsWith('http')
                ? snapshot.image
                : `https://via.placeholder.com/80`;
              
              return (
                <View key={itemIndex} style={styles.itemRow}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{snapshot.name}</Text>
                    <Text style={styles.itemPrice}>¥{snapshot.price.toFixed(2)}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.shopTotal}>
              <Text style={styles.shopTotalLabel}>店铺小计：</Text>
              <Text style={styles.shopTotalPrice}>¥{calculateShopAmount(group.items).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* 优惠券选择区 */}
        <View style={styles.couponSection}>
          <TouchableOpacity
            style={styles.couponSelector}
            onPress={() => setShowCouponPicker(true)}
          >
            <Text style={styles.couponSelectorLabel}>优惠券</Text>
            <View style={styles.couponSelectorRight}>
              {selectedCoupon ? (
                <Text style={styles.couponSelectedText}>
                  -¥{couponDiscount().toFixed(2)}
                </Text>
              ) : availableCoupons.filter((c) => c.usable).length > 0 ? (
                <Text style={styles.couponAvailableText}>
                  {availableCoupons.filter((c) => c.usable).length}张可用
                </Text>
              ) : (
                <Text style={styles.couponEmptyText}>暂无可用</Text>
              )}
              <Svg width={14} height={14} viewBox="0 0 1024 1024">
                <Path
                  d="M296.094353 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L18.811294 553.984a60.446118 60.446118 0 0 1 0-84.720941L254.291059 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L137.612588 511.638588 539.231412 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                  fill="#999"
                  transform="rotate(180 512 512)"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* 优惠券选择弹窗 */}
        {showCouponPicker && (
          <View style={styles.couponPickerOverlay}>
            <View style={styles.couponPickerContainer}>
              <View style={styles.couponPickerHeader}>
                <Text style={styles.couponPickerTitle}>选择优惠券</Text>
                <TouchableOpacity
                  onPress={() => setShowCouponPicker(false)}
                >
                  <Text style={styles.couponPickerClose}>关闭</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.couponPickerList}>
                {/* 不使用优惠券 */}
                <TouchableOpacity
                  style={[
                    styles.couponPickerItem,
                    !selectedCoupon && styles.couponPickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCoupon(null);
                    setShowCouponPicker(false);
                  }}
                >
                  <View style={styles.couponPickerItemInfo}>
                    <Text style={styles.couponPickerItemName}>不使用优惠券</Text>
                  </View>
                  {!selectedCoupon && (
                    <Svg width={18} height={18} viewBox="0 0 1024 1024">
                      <Path
                        d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z"
                        fill="#FF6B6B"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>

                {availableCoupons.length === 0 && (
                  <View style={styles.couponPickerEmpty}>
                    <Text style={styles.couponPickerEmptyText}>
                      暂无可用优惠券
                    </Text>
                  </View>
                )}

                {availableCoupons.map((coupon) => {
                  const isSelected =
                    selectedCoupon?.userCouponId === coupon.userCouponId;
                  return (
                    <TouchableOpacity
                      key={coupon.userCouponId}
                      style={[
                        styles.couponPickerItem,
                        isSelected && styles.couponPickerItemActive,
                        !coupon.usable && styles.couponPickerItemDisabled,
                      ]}
                      disabled={!coupon.usable}
                      onPress={() => {
                        setSelectedCoupon(coupon);
                        setShowCouponPicker(false);
                      }}
                    >
                      <View style={styles.couponPickerItemLeft}>
                        <Text
                          style={[
                            styles.couponPickerItemAmount,
                            !coupon.usable && styles.couponPickerItemTextDisabled,
                          ]}
                        >
                          ¥{Number(coupon.discountValue || 0).toFixed(0)}
                        </Text>
                        <Text
                          style={[
                            styles.couponPickerItemThreshold,
                            !coupon.usable && styles.couponPickerItemTextDisabled,
                          ]}
                        >
                          满{Number(coupon.minSpend || 0).toFixed(0)}可用
                        </Text>
                      </View>
                      <View style={styles.couponPickerItemInfo}>
                        <Text
                          style={[
                            styles.couponPickerItemName,
                            !coupon.usable && styles.couponPickerItemTextDisabled,
                          ]}
                          numberOfLines={1}
                        >
                          {coupon.templateName}
                        </Text>
                        <Text style={styles.couponPickerItemExpire}>
                          有效期至：{coupon.expiresAt}
                        </Text>
                        {coupon.usable ? (
                          <Text style={styles.couponPickerItemDiscount}>
                            本单可抵扣 ¥
                            {Number(coupon.discountAmount || 0).toFixed(2)}
                          </Text>
                        ) : (
                          <Text style={styles.couponPickerItemUnavailable}>
                            不满足使用条件
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Svg width={18} height={18} viewBox="0 0 1024 1024">
                          <Path
                            d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z"
                            fill="#FF6B6B"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部结算栏 */}
      <View style={styles.footer}>
        <View style={styles.totalInfo}>
          {couponDiscount() > 0 && (
            <Text style={styles.discountText}>
              已优惠：¥{couponDiscount().toFixed(2)}
            </Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>合计：</Text>
            <Text style={styles.totalPrice}>
              ¥{calculatePayableAmount().toFixed(2)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>提交订单</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  addressSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  addressItem: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  recipientPhone: {
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
  defaultTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 12,
    color: '#fff',
  },
  addressDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 10,
  },
  emptyAddress: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
  },
  emptyAddressText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  itemsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  shopHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  shopTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
  },
  shopTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  shopTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ddd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 优惠券选择区样式
  couponSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  couponSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  couponSelectorLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  couponSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponSelectedText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginRight: 6,
  },
  couponAvailableText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginRight: 6,
  },
  couponEmptyText: {
    fontSize: 13,
    color: '#999',
    marginRight: 6,
  },
  // 优惠券选择弹窗
  couponPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  couponPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  couponPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  couponPickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  couponPickerClose: {
    fontSize: 14,
    color: '#999',
  },
  couponPickerList: {
    padding: 10,
  },
  couponPickerEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  couponPickerEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  couponPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  couponPickerItemActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff5f5',
  },
  couponPickerItemDisabled: {
    opacity: 0.6,
  },
  couponPickerItemLeft: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  couponPickerItemAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  couponPickerItemThreshold: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  couponPickerItemInfo: {
    flex: 1,
  },
  couponPickerItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  couponPickerItemExpire: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  couponPickerItemDiscount: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  couponPickerItemUnavailable: {
    fontSize: 12,
    color: '#bbb',
  },
  couponPickerItemTextDisabled: {
    color: '#bbb',
  },
});

export default Checkout;
