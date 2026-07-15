import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { getOrderDetail, payOrder, cancelOrder, confirmReceive } from '../../services/orderService';
import { getAddressDetail } from '../../services/addressService';
import api from '../../utils/api';
import type { Order, OrderItem, UserAddress } from '../../types';
import { config } from '../../config';

interface LogisticsTrack {
  time: string;
  status: string;
  description: string;
}

interface LogisticsInfo {
  orderId: string;
  logisticsCompany: string;
  trackingNumber: string;
  tracks: LogisticsTrack[];
}

const BASE_URL = config.RESOURCE_BASE_URL;

const OrderDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [logisticsInfo, setLogisticsInfo] = useState<LogisticsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      if (!id) return;
      const response = await getOrderDetail(id);
      if (response && response.code === 200 && response.data) {
        const orderData = response.data;
        setOrder(orderData);

        const items = (orderData as any).orderItems || orderData.items || [];
        setOrderItems(items);

        if (orderData.addressId) {
          try {
            const addrResp = await getAddressDetail(orderData.addressId);
            if (addrResp && addrResp.code === 200 && addrResp.data) {
              setAddress(addrResp.data);
            }
          } catch (e) {
            console.error('获取地址详情失败:', e);
          }
        }

        if (orderData.orderStatus === 'SHIPPED') {
          try {
            const logisticsResp = await api.get<LogisticsInfo>(`/orders/${id}/logistics`);
            if (logisticsResp && logisticsResp.code === 200 && logisticsResp.data) {
              setLogisticsInfo(logisticsResp.data);
            }
          } catch (e) {
            console.error('获取物流信息失败:', e);
          }
        }
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const getStatusText = (order: Order) => {
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING': return '待付款';
      case 'PENDING_SHIPMENT': return '待发货';
      case 'SHIPPED': return '待收货';
      case 'COMPLETED': return '已完成';
      case 'CANCELLED': return '已取消';
      default: {
        const s = order.orderStatus;
        if (s) {
          const lower = s.toLowerCase();
          if (lower.includes('pending') && lower.includes('pay')) return '待付款';
          if (lower.includes('pending') && lower.includes('ship')) return '待发货';
          if (lower.includes('pending')) return '待付款';
          if (lower.includes('ship')) return '待收货';
          if (lower.includes('complet')) return '已完成';
          if (lower.includes('cancel')) return '已取消';
        }
        return '未知状态';
      }
    }
  };

  const getStatusColor = (order: Order) => {
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING': return '#F7055E';
      case 'PENDING_SHIPMENT': return '#F7055E';
      case 'SHIPPED': return '#F7055E';
      case 'COMPLETED': return '#999';
      case 'CANCELLED': return '#999';
      default: return '#999';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'WECHAT': return '微信支付';
      case 'ALIPAY': return '支付宝';
      default: return method || '未支付';
    }
  };

  const getShippingStatusText = (order: Order) => {
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING': return '未发货';
      case 'PENDING_SHIPMENT': return '未发货';
      case 'SHIPPED': return '已发货';
      case 'COMPLETED': return '已签收';
      case 'CANCELLED': return '已取消';
      default: return '未发货';
    }
  };

  const renderProductImage = (item: any) => {
    let imageUrl = item.productImage || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const handlePay = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!order) return;
    try {
      const response = await payOrder(order.orderId, paymentMethod === 'wechat' ? 'WECHAT' : 'ALIPAY');
      if (response && response.code === 200) {
        setShowPaymentModal(false);
        Alert.alert('支付成功', '订单已支付，请等待发货');
        loadOrderDetail();
      } else {
        Alert.alert('支付失败', response?.message || '支付处理失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      Alert.alert('支付失败', '支付处理时发生错误');
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const response = await cancelOrder(order.orderId);
      if (response && response.code === 200) {
        setShowCancelConfirm(false);
        Alert.alert('提示', '订单已取消');
        loadOrderDetail();
      } else {
        Alert.alert('提示', response?.message || '取消订单失败');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      Alert.alert('提示', '取消订单失败，请稍后重试');
    }
  };

  const handleConfirmReceive = async () => {
    if (!order) return;
    try {
      const response = await confirmReceive(order.orderId);
      if (response && response.code === 200) {
        setShowReceiveConfirm(false);
        Alert.alert('提示', '确认收货成功！');
        loadOrderDetail();
      } else {
        Alert.alert('提示', response?.message || '确认收货失败');
      }
    } catch (error) {
      console.error('Confirm receive error:', error);
      Alert.alert('提示', '确认收货失败，请稍后重试');
    }
  };

  const renderLogisticsSection = () => {
    if (order!.orderStatus === 'PENDING_PAYMENT' || order!.orderStatus === 'PENDING' || order!.orderStatus === 'CANCELLED') return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Svg width={18} height={18} viewBox="0 0 1024 1024">
            <Path d="M874.666667 533.333333a42.666667 42.666667 0 0 0-42.666667 42.666667v256a42.666667 42.666667 0 0 1-42.666667 42.666667H234.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V234.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h256a42.666667 42.666667 0 0 0 0-85.333333H234.666667a128 128 0 0 0-128 128v597.333333a128 128 0 0 0 128 128h554.666666a128 128 0 0 0 128-128V576a42.666667 42.666667 0 0 0-42.666666-42.666667z" fill="#F7055E" />
            <Path d="M896 128h-170.666667a42.666667 42.666667 0 0 0 0 85.333333h68.266667L509.013333 497.92a42.666667 42.666667 0 0 0 60.586667 60.586667L853.333333 273.92v68.266667a42.666667 42.666667 0 0 0 85.333334 0V170.666667a42.666667 42.666667 0 0 0-42.666667-42.666667z" fill="#F7055E" />
          </Svg>
          <Text style={styles.sectionTitle}>物流信息</Text>
        </View>
        <View style={styles.sectionBody}>
          {logisticsInfo && logisticsInfo.tracks && logisticsInfo.tracks.length > 0 ? (
            <>
              {(logisticsInfo.logisticsCompany || order!.logisticsCompany) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>物流公司</Text>
                  <Text style={styles.infoValue}>{logisticsInfo.logisticsCompany || order!.logisticsCompany}</Text>
                </View>
              )}
              {(logisticsInfo.trackingNumber || order!.trackingNumber) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>物流单号</Text>
                  <Text style={styles.infoValue}>{logisticsInfo.trackingNumber || order!.trackingNumber}</Text>
                </View>
              )}
              {order!.shippedTime && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>发货时间</Text>
                  <Text style={styles.infoValue}>{formatDate(order!.shippedTime)}</Text>
                </View>
              )}
              {order!.estimatedDelivery && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>预计送达</Text>
                  <Text style={styles.infoValue}>{formatDate(order!.estimatedDelivery)}</Text>
                </View>
              )}
              <View style={styles.trackList}>
                {logisticsInfo.tracks.map((track, index) => (
                  <View key={index} style={styles.trackItem}>
                    <View style={styles.trackDotContainer}>
                      <View style={[styles.trackDot, index === 0 && styles.trackDotActive]} />
                      {index < logisticsInfo.tracks.length - 1 && <View style={styles.trackLine} />}
                    </View>
                    <View style={styles.trackContent}>
                      <Text style={[styles.trackDesc, index === 0 && styles.trackDescActive]}>
                        {track.description}
                      </Text>
                      <Text style={styles.trackTime}>{track.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {(order!.logisticsCompany || order!.trackingNumber) ? (
                <>
                  {order!.logisticsCompany && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>物流公司</Text>
                      <Text style={styles.infoValue}>{order!.logisticsCompany}</Text>
                    </View>
                  )}
                  {order!.trackingNumber && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>物流单号</Text>
                      <Text style={styles.infoValue}>{order!.trackingNumber}</Text>
                    </View>
                  )}
                  {order!.shippedTime && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>发货时间</Text>
                      <Text style={styles.infoValue}>{formatDate(order!.shippedTime)}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.logisticsEmpty}>
                  <Text style={styles.logisticsEmptyText}>
                    {order!.orderStatus === 'PENDING_SHIPMENT' ? '商家尚未发货，请耐心等待' : '暂无物流信息'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderAddressSection = () => {
    if (!address && !order!.addressId) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Svg width={18} height={18} viewBox="0 0 1024 1024">
            <Path d="M512 85.333333c-164.949333 0-298.666667 133.738667-298.666667 298.666667 0 164.949333 298.666667 554.666667 298.666667 554.666667s298.666667-389.717333 298.666667-554.666667c0-164.928-133.717333-298.666667-298.666667-298.666667z m0 448a149.333333 149.333333 0 1 1 0-298.666666 149.333333 149.333333 0 0 1 0 298.666666z" fill="#F7055E" />
          </Svg>
          <Text style={styles.sectionTitle}>收货地址</Text>
        </View>
        <View style={styles.sectionBody}>
          {address ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>收货人</Text>
                <Text style={styles.infoValue}>{address.recipientName}  {address.recipientPhone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>收货地址</Text>
                <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                  {address.fullAddress || `${address.province}${address.city}${address.district || ''}${address.detailAddress}`}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>地址ID</Text>
              <Text style={styles.infoValue}>{order!.addressId}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderShopAndProducts = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Svg width={18} height={18} viewBox="0 0 1024 1024">
            <Path d="M832 320H192c-17.7 0-32-14.3-32-32s14.3-32 32-32h640c17.7 0 32 14.3 32 32s-14.3 32-32 32z" fill="#F7055E" />
            <Path d="M752 832H272c-48.6 0-88-39.4-88-88V344c0-4.4 3.6-8 8-8h640c4.4 0 8 3.6 8 8v400c0 48.6-39.4 88-88 88zM224 360v384c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V360H224z" fill="#F7055E" />
            <Path d="M384 320c-17.7 0-32-14.3-32-32V208c0-17.7 14.3-32 32-32s32 14.3 32 32v80c0 17.7-14.3 32-32 32zM640 320c-17.7 0-32-14.3-32-32V208c0-17.7 14.3-32 32-32s32 14.3 32 32v80c0 17.7-14.3 32-32 32z" fill="#F7055E" />
          </Svg>
          <Text style={styles.sectionTitle}>{order!.shopName || '店铺'}</Text>
        </View>
        <View style={styles.sectionBody}>
          {orderItems.map((item, index) => (
            <View key={item.orderItemId || index} style={styles.productItem}>
              <Image
                source={{
                  uri: renderProductImage(item) || 'https://via.placeholder.com/80',
                }}
                style={styles.productImage}
                defaultSource={require('../../assets/images/shop/popmart/warmth/1.jpg')}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.productName || '商品名称'}
                </Text>
                {item.productSpec && (
                  <Text style={styles.productSpec}>{item.productSpec}</Text>
                )}
                <View style={styles.productBottomRow}>
                  <Text style={styles.productPrice}>
                    ¥{item.unitPrice?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.productQuantity}>
                    x{item.quantity || 1}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderOrderInfo = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Svg width={18} height={18} viewBox="0 0 1024 1024">
            <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#F7055E" />
            <Path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" fill="#F7055E" />
          </Svg>
          <Text style={styles.sectionTitle}>订单信息</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>订单编号</Text>
            <Text style={styles.infoValue}>{order!.orderNo || order!.orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>下单时间</Text>
            <Text style={styles.infoValue}>{formatDate(order!.createTime)}</Text>
          </View>
          {order!.paymentTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>付款时间</Text>
              <Text style={styles.infoValue}>{formatDate(order!.paymentTime)}</Text>
            </View>
          )}
          {order!.shippedTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>发货时间</Text>
              <Text style={styles.infoValue}>{formatDate(order!.shippedTime)}</Text>
            </View>
          )}
          {order!.receivedTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>收货时间</Text>
              <Text style={styles.infoValue}>{formatDate(order!.receivedTime)}</Text>
            </View>
          )}
          {order!.completeTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>完成时间</Text>
              <Text style={styles.infoValue}>{formatDate(order!.completeTime)}</Text>
            </View>
          )}
          {order!.cancelTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>取消时间</Text>
              <Text style={styles.infoValue}>{formatDate(order!.cancelTime)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>支付方式</Text>
            <Text style={styles.infoValue}>{getPaymentMethodText(order!.paymentMethod)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>配送状态</Text>
            <Text style={styles.infoValue}>{getShippingStatusText(order!)}</Text>
          </View>
          {order!.userRemark && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>买家留言</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={3}>
                {order!.userRemark}
              </Text>
            </View>
          )}
          {order!.cancelReason && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>取消原因</Text>
              <Text style={styles.infoValue}>{order!.cancelReason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPriceSummary = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Svg width={18} height={18} viewBox="0 0 1024 1024">
            <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#F7055E" />
            <Path d="M553.6 508.8c39.2-28 64-73.6 64-124.8 0-88-72-160-160-160h-48c-88 0-160 72-160 160 0 51.2 24.8 96.8 64 124.8-52.8 32-88 90.4-88 156.8v16c0 88 72 160 160 160h96c88 0 160-72 160-160v-16c0-66.4-35.2-124.8-88-156.8z" fill="#F7055E" />
          </Svg>
          <Text style={styles.sectionTitle}>价格明细</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>商品总额</Text>
            <Text style={styles.infoValue}>¥{order!.amount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>运费</Text>
            <Text style={styles.infoValue}>{(order!.shippingFee && order!.shippingFee > 0) ? `¥${order!.shippingFee.toFixed(2)}` : '免运费'}</Text>
          </View>
          {order!.totalDiscount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>优惠减免</Text>
              <Text style={[styles.infoValue, { color: '#F7055E' }]}>-¥{order!.totalDiscount.toFixed(2)}</Text>
            </View>
          )}
          {order!.refundAmount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>退款金额</Text>
              <Text style={[styles.infoValue, { color: '#07C160' }]}>-¥{order!.refundAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>实付金额</Text>
            <Text style={styles.totalValue}>¥{order!.actualAmount?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBottomActions = () => {
    if (!order) return null;
    const actions: JSX.Element[] = [];

    if (order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'PENDING') {
      actions.push(
        <TouchableOpacity
          key="cancel"
          style={styles.actionBtnSecondary}
          onPress={() => setShowCancelConfirm(true)}
        >
          <Text style={styles.actionBtnTextSecondary}>取消订单</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity
          key="pay"
          style={styles.actionBtnPrimary}
          onPress={handlePay}
        >
          <Text style={styles.actionBtnTextPrimary}>继续付款</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'PENDING_SHIPMENT') {
      actions.push(
        <TouchableOpacity
          key="remind"
          style={styles.actionBtnSecondary}
          onPress={() => Alert.alert('提示', '已提醒商家发货')}
        >
          <Text style={styles.actionBtnTextSecondary}>提醒发货</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'SHIPPED') {
      actions.push(
        <TouchableOpacity
          key="logistics"
          style={styles.actionBtnSecondary}
          onPress={() => Alert.alert('提示', '物流详情功能开发中')}
        >
          <Text style={styles.actionBtnTextSecondary}>查看物流</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity
          key="confirm"
          style={styles.actionBtnPrimary}
          onPress={() => setShowReceiveConfirm(true)}
        >
          <Text style={styles.actionBtnTextPrimary}>确认收货</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'COMPLETED') {
      actions.push(
        <TouchableOpacity
          key="review"
          style={styles.actionBtnPrimary}
          onPress={() => Alert.alert('提示', '评价功能开发中')}
        >
          <Text style={styles.actionBtnTextPrimary}>评价</Text>
        </TouchableOpacity>
      );
    }

    if (actions.length === 0) return null;

    return (
      <View style={styles.bottomBar}>
        {actions}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F7055E" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>订单不存在</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path
              d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z"
              fill="#3C3C3C"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单详情</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusBanner}>
        <Text style={[styles.statusText, { color: getStatusColor(order) }]}>
          {getStatusText(order)}
        </Text>
        {(order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'PENDING') && order.paymentDeadline && (
          <Text style={styles.statusSubText}>
            请在 {formatDate(order.paymentDeadline)} 前完成付款
          </Text>
        )}
        {order.orderStatus === 'SHIPPED' && order.estimatedDelivery && (
          <Text style={styles.statusSubText}>
            预计 {formatDate(order.estimatedDelivery)} 送达
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {renderLogisticsSection()}
        {renderAddressSection()}
        {renderShopAndProducts()}
        {renderPriceSummary()}
        {renderOrderInfo()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {renderBottomActions()}

      {/* 支付弹窗 */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择支付方式</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modalCloseBtn}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.paymentAmountSection}>
                <Text style={styles.paymentAmountLabel}>支付金额</Text>
                <Text style={styles.paymentAmountValue}>¥{order.actualAmount?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.paymentOptions}>
                <Text style={styles.paymentMethodLabel}>选择支付方式</Text>
                <View style={styles.paymentOptionsRow}>
                  <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'wechat' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('wechat')}
                  >
                    <Svg width={24} height={24} viewBox="0 0 1024 1024">
                      <Path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.645697 2.038838-26.647917-122.810719-159.358451-214.077735-310.826188-214.077735-169.353083 0-308.085774 114.232319-308.085774 259.275068 0 83.708724 46.165736 152.460344 123.281791 205.78483L182.451786 683.690128l89.894635-44.400192c32.220644 10.627588 58.062546 15.614157 90.28319 15.614157 8.517086 0 16.911752-0.462665 25.204062-1.156192-5.310746-18.110632-8.182896-37.024855-8.182896-56.522981C379.650774 464.018958 505.588728 368.541681 664.250054 368.541681zM498.62897 285.87389c21.676438 0 36.035595 14.098699 36.035595 35.452842 0 21.275909-14.359157 35.539696-36.035595 35.539696-21.554886 0-43.118606-14.263787-43.118606-35.539696C455.510364 299.972589 477.074084 285.87389 498.62897 285.87389zM246.61369 356.866428c-21.554886 0-43.230468-14.263787-43.230468-35.539696 0-21.354143 21.675582-35.452842 43.230468-35.452842 21.554886 0 35.914043 14.098699 35.914043 35.452842C282.527733 342.602641 268.168576 356.866428 246.61369 356.866428zM945.448458 606.151333c0-121.777244-123.349039-220.866049-262.052288-220.866049-146.63549 0-262.354464 99.088805-262.354464 220.866049 0 121.911732 115.718974 220.866049 262.354464 220.866049 30.631817 0 61.263635-7.564545 91.782195-15.130117l83.925612 45.537092-22.945508-76.069588C899.651753 743.193134 945.448458 677.406468 945.448458 606.151333zM622.698472 570.576082c-14.359157 0-28.718314-14.098699-28.718314-28.523871 0-14.358131 14.359157-28.641175 28.718314-28.641175 21.676438 0 35.914043 14.283044 35.914043 28.641175C658.612515 556.477383 644.37491 570.576082 622.698472 570.576082zM745.792243 570.576082c-14.237605 0-28.596762-14.098699-28.596762-28.523871 0-14.358131 14.359157-28.641175 28.596762-28.641175 21.554886 0 35.914043 14.283044 35.914043 28.641175C781.706286 556.477383 767.347129 570.576082 745.792243 570.576082z" fill="#07C160" />
                    </Svg>
                    <Text style={[styles.paymentText, paymentMethod === 'wechat' && styles.paymentTextActive]}>微信支付</Text>
                    {paymentMethod === 'wechat' && (
                      <View style={styles.paymentCheck}>
                        <Svg width={16} height={16} viewBox="0 0 1024 1024">
                          <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#FF6B6B" />
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'alipay' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('alipay')}
                  >
                    <Svg width={24} height={24} viewBox="0 0 1024 1024">
                      <Path d="M925.3 384.8c-21.8-51.3-53.1-97.4-93-137.2-39.9-39.9-85.9-71.2-137.2-93-53.3-22.7-109.9-34.2-168.2-34.2-58.3 0-114.9 11.5-168.2 34.2-51.3 21.8-97.4 53.1-137.2 93-39.9 39.9-71.2 85.9-93 137.2-22.7 53.3-34.2 109.9-34.2 168.2 0 58.3 11.5 114.9 34.2 168.2 21.8 51.3 53.1 97.4 93 137.2 39.9 39.9 85.9 71.2 137.2 93 53.3 22.7 109.9 34.2 168.2 34.2 58.3 0 114.9-11.5 168.2-34.2 51.3-21.8 97.4-53.1 137.2-93 39.9-39.9 71.2-85.9 93-137.2 22.7-53.3 34.2-109.9 34.2-168.2 0-58.3-11.5-114.9-34.2-168.2z m-366.2 447.5c-154.4 0-279.5-125.1-279.5-279.5S404.7 273.3 559.1 273.3s279.5 125.1 279.5 279.5-125.1 279.5-279.5 279.5z" fill="#1677FF" />
                      <Path d="M704.4 545.8c-13.8-6.2-30.6-13.8-48.8-22.2 10.8-19.4 19.6-40.8 25.8-63.8h-57.6v-23.4h70.2v-16.2h-70.2v-38.4h-30c-3.8 0-6.8 3-6.8 6.8v31.6h-72v16.2h72v23.4h-60v16.2h102.6c-4.2 13.8-9.6 26.6-16.2 38.4-34.8-13.8-70.8-24.6-94.2-24.6-42 0-69.6 22.2-69.6 54.6 0 35.4 31.8 57.6 78 57.6 34.2 0 66-14.4 93-39.6 30.6 16.2 68.4 35.4 97.8 52.2l14-27.2z m-202.2 8.4c-28.8 0-45-11.4-45-30 0-16.8 14.4-27.6 37.8-27.6 16.2 0 38.4 6.6 63 17.4-20.4 25.2-41.4 40.2-55.8 40.2z" fill="#1677FF" />
                    </Svg>
                    <Text style={[styles.paymentText, paymentMethod === 'alipay' && styles.paymentTextActive]}>支付宝</Text>
                    {paymentMethod === 'alipay' && (
                      <View style={styles.paymentCheck}>
                        <Svg width={16} height={16} viewBox="0 0 1024 1024">
                          <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#FF6B6B" />
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.paymentCancelBtn} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.paymentCancelText}>取消支付</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentConfirmBtn} onPress={handlePaymentConfirm}>
                <Text style={styles.paymentConfirmText}>确认支付</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 取消订单确认弹窗 */}
      <Modal
        visible={showCancelConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmTitle}>确认取消订单</Text>
            <Text style={styles.confirmText}>取消订单后将无法恢复，是否继续？</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowCancelConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmConfirmBtn}
                onPress={handleCancelOrder}
              >
                <Text style={styles.confirmConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 确认收货弹窗 */}
      <Modal
        visible={showReceiveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiveConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmTitle}>确认收货</Text>
            <Text style={styles.confirmText}>确认已收到商品？</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowReceiveConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmConfirmBtn}
                onPress={handleConfirmReceive}
              >
                <Text style={styles.confirmConfirmText}>确认收货</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#F7055E',
    borderRadius: 20,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBanner: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  logisticsEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logisticsEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  trackList: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  trackItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  trackDotContainer: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  trackDotActive: {
    backgroundColor: '#F7055E',
  },
  trackLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#DDD',
    marginTop: 4,
  },
  trackContent: {
    flex: 1,
    paddingBottom: 16,
    marginLeft: 8,
  },
  trackDesc: {
    fontSize: 14,
    color: '#999',
  },
  trackDescActive: {
    color: '#333',
    fontWeight: '500',
  },
  trackTime: {
    fontSize: 12,
    color: '#BFBFBF',
    marginTop: 4,
  },
  productItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  productSpec: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    marginTop: 4,
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F7055E',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 36,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  actionBtnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  actionBtnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7055E',
  },
  actionBtnTextPrimary: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentAmountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  paymentAmountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  paymentOptions: {
    marginBottom: 15,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  paymentOptionActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  paymentText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
  },
  paymentTextActive: {
    color: '#FF6B6B',
  },
  paymentCheck: {
    marginLeft: 8,
  },
  paymentCancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  paymentCancelText: {
    fontSize: 15,
    color: '#666',
  },
  paymentConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  paymentConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    color: '#666',
  },
  confirmConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OrderDetail;
