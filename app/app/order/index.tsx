import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { getUserOrders, payOrder, cancelOrder, confirmReceive } from '../../services/orderService';
import { createAfterSale, getOrderAfterSales, submitReturnLogistics, applyPlatformIntervention } from '../../services/afterSaleService';
import { getUserIdFromToken } from '../../utils/jwtHelper';
import type { Order, AfterSale } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;

const OrderList: React.FC = () => {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [afterSalesMap, setAfterSalesMap] = useState<Map<string, AfterSale[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(status || 'all');
  
  // 支付弹窗相关状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  
  // 更多菜单相关状态
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // 确认收货弹窗相关状态
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);

  // 售后申请相关状态
  const [showAfterSaleModal, setShowAfterSaleModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [afterSaleType, setAfterSaleType] = useState('REFUND');
  const [afterSaleReason, setAfterSaleReason] = useState('');
  const [afterSaleDescription, setAfterSaleDescription] = useState('');
  const [afterSaleAmount, setAfterSaleAmount] = useState(0);
  
  // 退货物流相关状态
  const [showSubmitLogisticsModal, setShowSubmitLogisticsModal] = useState(false);
  const [selectedAfterSale, setSelectedAfterSale] = useState<AfterSale | null>(null);
  const [logisticsCompany, setLogisticsCompany] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // 申请平台介入相关状态
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionReason, setInterventionReason] = useState('');
  const [interventionSubmitting, setInterventionSubmitting] = useState(false);

  const tabs = [
    { key: 'all', label: '全部', status: '' },
    { key: 'unpaid', label: '待付款', status: 'PENDING_PAYMENT' },
    { key: 'unshipped', label: '待发货', status: 'PENDING_SHIPMENT' },
    { key: 'shipping', label: '待收货', status: 'SHIPPED' },
    { key: 'completed', label: '待评价', status: 'COMPLETED' },
  ];

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        router.push('/login');
        return;
      }

      const params: any = { page: 1, size: 20 };
      const currentTab = tabs.find(t => t.key === activeTab);
      
      // 待付款标签：不传status给后端，查全部后前端本地筛选
      if (currentTab && currentTab.status && activeTab !== 'unpaid') {
        params.status = currentTab.status;
      }

      const response = await getUserOrders(userId, params);
      
      if (response.data) {
        let orderList = [];
        if (response.data.code === 200 && response.data.data) {
          orderList = response.data.data.records || response.data.data || [];
        } else if (Array.isArray(response.data)) {
          orderList = response.data;
        } else if (response.data.records) {
          orderList = response.data.records;
        }
        
        // 待付款标签：本地筛选同时包含PENDING和PENDING_PAYMENT的订单
        if (activeTab === 'unpaid') {
          orderList = orderList.filter((order: Order) => {
            const s = order.orderStatus;
            return s === 'PENDING' || s === 'PENDING_PAYMENT';
          });
        }
        
        setOrders(orderList);
        
        // 获取每个订单的售后信息
        const newAfterSalesMap = new Map<string, AfterSale[]>();
        for (const order of orderList) {
          if (order.afterSalesStatus && order.afterSalesStatus !== 'NONE') {
            try {
              const afterSaleResponse = await getOrderAfterSales(order.orderId);
              if (afterSaleResponse && afterSaleResponse.code === 200 && afterSaleResponse.data) {
                newAfterSalesMap.set(order.orderId, afterSaleResponse.data);
              }
            } catch (error) {
              console.error('获取售后信息失败:', error);
            }
          }
        }
        setAfterSalesMap(newAfterSalesMap);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [activeTab]);

  const getStatusText = (order: Order) => {
    if (order.afterSalesStatus === 'PROCESSING') {
      const afterSales = afterSalesMap.get(order.orderId);
      if (afterSales && afterSales.length > 0) {
        const latestAfterSale = afterSales[0];
        if (latestAfterSale.afterSaleStatus === 'PENDING') {
          return '售后审核中';
        } else if (latestAfterSale.afterSaleStatus === 'APPROVED') {
          if (latestAfterSale.afterSaleType === 'RETURN' && !latestAfterSale.returnTrackingNumber) {
            return '待填写退货物流';
          } else if (latestAfterSale.afterSaleType === 'RETURN' && latestAfterSale.returnTrackingNumber) {
            return '待商家验货';
          }
        }
      }
      return '售后中';
    }
    if (order.afterSalesStatus === 'COMPLETED') {
      const afterSales = afterSalesMap.get(order.orderId);
      if (afterSales && afterSales.length > 0) {
        const latestAfterSale = afterSales[0];
        if (latestAfterSale.afterSaleType === 'REFUND') {
          return '已退款';
        } else if (latestAfterSale.afterSaleType === 'RETURN') {
          return '已退货';
        }
      }
      return '已退款';
    }
    if (order.afterSalesStatus === 'REJECTED') {
      const afterSales = afterSalesMap.get(order.orderId);
      if (afterSales && afterSales.length > 0) {
        const latestAfterSale = afterSales[0];
        if (latestAfterSale.afterSaleStatus === 'PLATFORM_REVIEWING') {
          return '平台介入审核中';
        }
        if (latestAfterSale.afterSaleStatus === 'PLATFORM_RESOLVED') {
          if (latestAfterSale.platformArbitrationResult === 'USER') {
            return '平台已裁决（支持用户）';
          }
          if (latestAfterSale.platformArbitrationResult === 'SELLER') {
            return '平台已裁决（支持商家）';
          }
          return '平台已裁决';
        }
      }
      return '售后已拒绝（可申请平台介入）';
    }
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING': return '待付款';
      case 'PENDING_SHIPMENT': return '待发货';
      case 'SHIPPED': return '待收货';
      case 'COMPLETED': return '待评价';
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
    if (order.afterSalesStatus === 'PROCESSING') {
      return '#FF6B6B';
    }
    if (order.afterSalesStatus === 'COMPLETED') {
      return '#07C160';
    }
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return '#F7055E';
      case 'PENDING_SHIPMENT':
        return '#F7055E';
      case 'SHIPPED':
        return '#F7055E';
      case 'COMPLETED':
        return '#999';
      case 'CANCELLED':
        return '#999';
      default:
        return '#999';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const goBack = () => {
    router.back();
  };

  const handlePay = (order: Order) => {
    setPendingOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!pendingOrder) return;
    
    try {
      const response = await payOrder(pendingOrder.orderId, paymentMethod === 'wechat' ? 'WECHAT' : 'ALIPAY');
      
      if (response && response.code === 200) {
        setShowPaymentModal(false);
        setPendingOrder(null);
        Alert.alert('支付成功', '订单已支付，请等待发货');
        // 重新加载订单列表
        loadOrders();
      } else {
        Alert.alert('支付失败', response?.message || '支付处理失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      Alert.alert('支付失败', '支付处理时发生错误');
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingOrder(null);
  };

  const handleMoreClick = (order: Order) => {
    setShowMoreMenu(order.orderId);
  };

  const handleCancelOrder = () => {
    setShowMoreMenu(null);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!pendingOrder) return;
    
    try {
      const response = await cancelOrder(pendingOrder.orderId);
      
      if (response && response.code === 200) {
        setShowCancelConfirm(false);
        setPendingOrder(null);
        Alert.alert('提示', '订单已取消');
        loadOrders();
      } else {
        Alert.alert('提示', response?.message || '取消订单失败');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      Alert.alert('提示', '取消订单失败，请稍后重试');
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelConfirm(false);
    setPendingOrder(null);
  };

  const handleConfirmReceive = (order: Order) => {
    setPendingOrder(order);
    setShowReceiveConfirm(true);
  };

  const handleReceiveConfirm = async () => {
    if (!pendingOrder) return;
    
    try {
      const response = await confirmReceive(pendingOrder.orderId);
      
      if (response && response.code === 200) {
        setShowReceiveConfirm(false);
        setPendingOrder(null);
        Alert.alert('提示', '确认收货成功！');
        // 重新加载订单列表
        loadOrders();
      } else {
        Alert.alert('提示', response?.message || '确认收货失败');
      }
    } catch (error) {
      console.error('Confirm receive error:', error);
      Alert.alert('提示', '确认收货失败，请稍后重试');
    }
  };

  const handleReceiveModalClose = () => {
    setShowReceiveConfirm(false);
    setPendingOrder(null);
  };

  const handleApplyAfterSale = (order: Order, orderItem: any) => {
    setSelectedOrder(order);
    setSelectedOrderItem(orderItem);
    setAfterSaleType('REFUND');
    setAfterSaleReason('');
    setAfterSaleDescription('');
    setAfterSaleAmount(orderItem.actualSubtotal || orderItem.unitPrice * orderItem.quantity || 0);
    setShowAfterSaleModal(true);
  };

  const handleSubmitAfterSale = async () => {
    if (!selectedOrder || !selectedOrderItem) return;
    if (!afterSaleReason) {
      Alert.alert('提示', '请填写退款原因');
      return;
    }
    if (afterSaleAmount <= 0) {
      Alert.alert('提示', '退款金额必须大于0');
      return;
    }

    try {
      const response = await createAfterSale({
        orderId: selectedOrder.orderId,
        orderItemId: selectedOrderItem.orderItemId,
        afterSaleType,
        reason: afterSaleReason,
        description: afterSaleDescription,
        refundAmount: afterSaleAmount,
      });

      if (response && response.code === 200) {
        setShowAfterSaleModal(false);
        Alert.alert('提示', '售后申请提交成功');
        loadOrders();
      } else {
        Alert.alert('提示', response?.message || '提交失败');
      }
    } catch (error) {
      console.error('Submit after sale error:', error);
      Alert.alert('提示', '提交失败，请稍后重试');
    }
  };
  
  // 处理提交退货物流
  const handleSubmitLogistics = async () => {
    if (!selectedAfterSale) return;
    if (!logisticsCompany) {
      Alert.alert('提示', '请填写物流公司');
      return;
    }
    if (!trackingNumber) {
      Alert.alert('提示', '请填写物流单号');
      return;
    }
    
    try {
      const response = await submitReturnLogistics(selectedAfterSale.afterSaleId, logisticsCompany, trackingNumber);
      if (response && response.code === 200) {
        setShowSubmitLogisticsModal(false);
        Alert.alert('提示', '退货物流提交成功');
        loadOrders();
      } else {
        Alert.alert('提示', response?.message || '提交失败');
      }
    } catch (error) {
      console.error('Submit logistics error:', error);
      Alert.alert('提示', '提交失败，请稍后重试');
    }
  };

  // 提交申请平台介入
  const handleSubmitIntervention = async () => {
    if (!selectedAfterSale) return;
    if (!interventionReason.trim()) {
      Alert.alert('提示', '请填写申请平台介入的原因');
      return;
    }
    setInterventionSubmitting(true);
    try {
      const userId = await getUserIdFromToken();
      const response = await applyPlatformIntervention(
        selectedAfterSale.afterSaleId,
        interventionReason.trim(),
        userId || undefined
      );
      if (response && response.code === 200) {
        setShowInterventionModal(false);
        Alert.alert('提示', '已提交平台介入申请，请耐心等待平台审核');
        loadOrders();
      } else {
        Alert.alert('提示', response?.message || '提交失败');
      }
    } catch (error) {
      console.error('Apply intervention error:', error);
      Alert.alert('提示', '提交失败，请稍后重试');
    } finally {
      setInterventionSubmitting(false);
    }
  };

  const handleOrderDetail = (order: Order) => {
    router.push(`/order/${order.orderId}`);
  };

  const renderProductImage = (item: any) => {
    let imageUrl = item.productImage || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const renderOrderItems = (order: Order) => {
    const items = order.items || [];

    return (
      <View style={styles.productList}>
        {items.map((item, index) => (
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
              {item.itemAfterSalesStatus === 'PROCESSING' && (
                <Text style={styles.afterSaleStatusText}>售后处理中</Text>
              )}
              {item.itemAfterSalesStatus === 'COMPLETED' && (
                <Text style={styles.afterSaleStatusText}>售后已完成</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderOrderActions = (order: Order) => {
    const actions: JSX.Element[] = [];
    const canApplyAfterSale = (order.orderStatus === 'SHIPPED' || order.orderStatus === 'COMPLETED') 
      && order.afterSalesStatus !== 'PROCESSING';
    const items = order.items || [];
    const hasProcessingItem = items.some(item => item.itemAfterSalesStatus === 'PROCESSING');
    
    // 检查是否有待提交退货物流的售后
    const afterSales = afterSalesMap.get(order.orderId);
    const pendingLogisticsAfterSale = afterSales?.find(
      as => as.afterSaleType === 'RETURN' && 
            as.afterSaleStatus === 'APPROVED' && 
            !as.returnTrackingNumber
    );

    if (order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'PENDING') {
      actions.push(
        <View key="more-container" style={styles.moreBtnContainer}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => handleMoreClick(order)}
          >
            <Text style={styles.actionBtnTextSecondary}>更多</Text>
          </TouchableOpacity>
          {showMoreMenu === order.orderId && (
            <View style={styles.moreMenu}>
              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setShowMoreMenu(null);
                  handleOrderDetail(order);
                }}
              >
                <Text style={styles.moreMenuText}>查看订单</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.moreMenuItem}
                onPress={() => {
                  setPendingOrder(order);
                  handleCancelOrder();
                }}
              >
                <Text style={[styles.moreMenuText, styles.cancelText]}>取消订单</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
      actions.push(
        <TouchableOpacity
          key="payagent"
          style={styles.actionBtnSecondary}
          onPress={() => {}}
        >
          <Text style={styles.actionBtnTextSecondary}>找人代付</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity
          key="pay"
          style={styles.actionBtnPrimary}
          onPress={() => handlePay(order)}
        >
          <Text style={styles.actionBtnTextPrimary}>继续付款</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'SHIPPED') {
      actions.push(
        <TouchableOpacity
          key="logistics"
          style={styles.actionBtnSecondary}
          onPress={() => {}}
        >
          <Text style={styles.actionBtnTextSecondary}>查看物流</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity
          key="confirm"
          style={styles.actionBtnPrimary}
          onPress={() => handleConfirmReceive(order)}
        >
          <Text style={styles.actionBtnTextPrimary}>确认收货</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'COMPLETED') {
      actions.push(
        <TouchableOpacity
          key="review"
          style={styles.actionBtnPrimary}
          onPress={() => {}}
        >
          <Text style={styles.actionBtnTextPrimary}>评价</Text>
        </TouchableOpacity>
      );
    } else if (order.orderStatus === 'PENDING_SHIPMENT') {
      actions.push(
        <TouchableOpacity
          key="remind"
          style={styles.actionBtnSecondary}
          onPress={() => {}}
        >
          <Text style={styles.actionBtnTextSecondary}>提醒发货</Text>
        </TouchableOpacity>
      );
    } else {
      actions.push(
        <TouchableOpacity
          key="detail"
          style={styles.actionBtnSecondary}
          onPress={() => handleOrderDetail(order)}
        >
          <Text style={styles.actionBtnTextSecondary}>查看详情</Text>
        </TouchableOpacity>
      );
    }

    // 添加提交退货物流按钮
    if (pendingLogisticsAfterSale) {
      actions.push(
        <TouchableOpacity
          key="submit-logistics"
          style={styles.actionBtnPrimary}
          onPress={() => {
            setSelectedAfterSale(pendingLogisticsAfterSale);
            setShowSubmitLogisticsModal(true);
          }}
        >
          <Text style={styles.actionBtnTextPrimary}>提交退货物流</Text>
        </TouchableOpacity>
      );
    }

    // 添加申请平台介入按钮（仅当售后被商家拒绝且未申请过介入时显示）
    const rejectedAfterSale = afterSales?.find(
      as => as.afterSaleStatus === 'REJECTED'
    );
    if (rejectedAfterSale) {
      actions.push(
        <TouchableOpacity
          key="apply-intervention"
          style={[styles.actionBtnPrimary, { backgroundColor: '#FF6B00' }]}
          onPress={() => {
            setSelectedAfterSale(rejectedAfterSale);
            setInterventionReason('');
            setShowInterventionModal(true);
          }}
        >
          <Text style={styles.actionBtnTextPrimary}>申请平台介入</Text>
        </TouchableOpacity>
      );
    }

    // 添加售后按钮
    if (canApplyAfterSale && !hasProcessingItem && items.length > 0) {
      // 找到第一个可以申请售后的商品
      const availableItem = items.find(item => item.itemAfterSalesStatus !== 'PROCESSING');
      if (availableItem) {
        actions.push(
          <TouchableOpacity
            key="aftersale"
            style={styles.actionBtnPrimary}
            onPress={() => handleApplyAfterSale(order, availableItem)}
          >
            <Text style={styles.actionBtnTextPrimary}>申请售后</Text>
          </TouchableOpacity>
        );
      }
    }

    return <View style={styles.orderFooter}>{actions}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F7055E" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024">
              <Path 
                d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
                fill="#3C3C3C" 
              />
            </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单中心</Text>
        <TouchableOpacity style={styles.searchButton}>
              <Svg width={24} height={24} viewBox="0 0 1026 1024">
                <Path 
                  d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
                  fill="rgba(0,0,0,0.7)" 
                />
              </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tab.key === 'unpaid' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.orderList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5000']} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width={100} height={100} viewBox="0 0 1024 1024">
              <Path d="M832 312H696v-16c0-101.6-82.4-184-184-184s-184 82.4-184 184v16H192c-17.7 0-32 14.3-32 32v536c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V344c0-17.7-14.3-32-32-32zM432 296c0-61.9 50.1-112 112-112s112 50.1 112 112v16H432v-16z" fill="#D9D9D9"/>
            </Svg>
            <Text style={styles.emptyText}>暂无订单</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onRefresh}>
              <Text style={styles.emptyButtonText}>去逛逛</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.orderId} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{order.shopName || '店铺'}</Text>
                </View>
                <Text style={[styles.orderStatus, { color: getStatusColor(order) }]}>
                  {getStatusText(order)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.orderContent}
                activeOpacity={0.7}
                onPress={() => handleOrderDetail(order)}
              >
                {renderOrderItems(order)}
              </TouchableOpacity>

              <View style={styles.orderSummary}>
                <View style={styles.shippingInfo}>
                  <Text style={styles.shippingText}>运费 ¥0.00</Text>
                </View>
                <View style={styles.totalInfo}>
                  <Text style={styles.totalLabel}>总价</Text>
                  <Text style={styles.orderAmount}>¥{order.actualAmount?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              {renderOrderActions(order)}
            </View>
          ))
        )}
        <View style={styles.bottomPlaceholder} />
      </ScrollView>

      {/* 支付弹窗 */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={handlePaymentCancel}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>确认支付</Text>
              <TouchableOpacity onPress={handlePaymentCancel} style={styles.paymentCloseBtn}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999"/>
                </Svg>
              </TouchableOpacity>
            </View>
            
            <View style={styles.paymentModalBody}>
              <View style={styles.paymentAmountSection}>
                <Text style={styles.paymentAmountLabel}>支付金额</Text>
                <Text style={styles.paymentAmountValue}>
                  ¥{pendingOrder ? pendingOrder.actualAmount?.toFixed(2) || '0.00' : '0.00'}
                </Text>
              </View>
              
              <View style={styles.paymentOptions}>
                <Text style={styles.paymentMethodLabel}>选择支付方式</Text>
                <View style={styles.paymentOptionsRow}>
                  <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'wechat' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('wechat')}
                  >
                    <Svg width={24} height={24} viewBox="0 0 1024 1024">
                      <Path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.645697 2.038838-26.647917-122.810719-159.358451-214.077735-310.826188-214.077735-169.353083 0-308.085774 114.232319-308.085774 259.275068 0 83.708724 46.165736 152.460344 123.281791 205.78483L182.451786 683.690128l89.894635-44.400192c32.220644 10.627588 58.062546 15.614157 90.28319 15.614157 8.517086 0 16.911752-0.462665 25.204062-1.156192-5.310746-18.110632-8.182896-37.024855-8.182896-56.522981C379.650774 464.018958 505.588728 368.541681 664.250054 368.541681zM498.62897 285.87389c21.676438 0 36.035595 14.098699 36.035595 35.452842 0 21.275909-14.359157 35.539696-36.035595 35.539696-21.554886 0-43.118606-14.263787-43.118606-35.539696C455.510364 299.972589 477.074084 285.87389 498.62897 285.87389zM246.61369 356.866428c-21.554886 0-43.230468-14.263787-43.230468-35.539696 0-21.354143 21.675582-35.452842 43.230468-35.452842 21.554886 0 35.914043 14.098699 35.914043 35.452842C282.527733 342.602641 268.168576 356.866428 246.61369 356.866428zM945.448458 606.151333c0-121.777244-123.349039-220.866049-262.052288-220.866049-146.63549 0-262.354464 99.088805-262.354464 220.866049 0 121.911732 115.718974 220.866049 262.354464 220.866049 30.631817 0 61.263635-7.564545 91.782195-15.130117l83.925612 45.537092-22.945508-76.069588C899.651753 743.193134 945.448458 677.406468 945.448458 606.151333zM622.698472 570.576082c-14.359157 0-28.718314-14.098699-28.718314-28.523871 0-14.358131 14.359157-28.641175 28.718314-28.641175 21.676438 0 35.914043 14.283044 35.914043 28.641175C658.612515 556.477383 644.37491 570.576082 622.698472 570.576082zM745.792243 570.576082c-14.237605 0-28.596762-14.098699-28.596762-28.523871 0-14.358131 14.359157-28.641175 28.596762-28.641175 21.554886 0 35.914043 14.283044 35.914043 28.641175C781.706286 556.477383 767.347129 570.576082 745.792243 570.576082z" fill="#07C160"/>
                    </Svg>
                    <Text style={[styles.paymentText, paymentMethod === 'wechat' && styles.paymentTextActive]}>微信支付</Text>
                    {paymentMethod === 'wechat' && (
                      <View style={styles.paymentCheck}>
                        <Svg width={16} height={16} viewBox="0 0 1024 1024">
                          <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#FF6B6B"/>
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === 'alipay' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('alipay')}
                  >
                    <Svg width={24} height={24} viewBox="0 0 1024 1024">
                      <Path d="M925.3 384.8c-21.8-51.3-53.1-97.4-93-137.2-39.9-39.9-85.9-71.2-137.2-93-53.3-22.7-109.9-34.2-168.2-34.2-58.3 0-114.9 11.5-168.2 34.2-51.3 21.8-97.4 53.1-137.2 93-39.9 39.9-71.2 85.9-93 137.2-22.7 53.3-34.2 109.9-34.2 168.2 0 58.3 11.5 114.9 34.2 168.2 21.8 51.3 53.1 97.4 93 137.2 39.9 39.9 85.9 71.2 137.2 93 53.3 22.7 109.9 34.2 168.2 34.2 58.3 0 114.9-11.5 168.2-34.2 51.3-21.8 97.4-53.1 137.2-93 39.9-39.9 71.2-85.9 93-137.2 22.7-53.3 34.2-109.9 34.2-168.2 0-58.3-11.5-114.9-34.2-168.2z m-366.2 447.5c-154.4 0-279.5-125.1-279.5-279.5S404.7 273.3 559.1 273.3s279.5 125.1 279.5 279.5-125.1 279.5-279.5 279.5z" fill="#1677FF"/>
                      <Path d="M704.4 545.8c-13.8-6.2-30.6-13.8-48.8-22.2 10.8-19.4 19.6-40.8 25.8-63.8h-57.6v-23.4h70.2v-16.2h-70.2v-38.4h-30c-3.8 0-6.8 3-6.8 6.8v31.6h-72v16.2h72v23.4h-60v16.2h102.6c-4.2 13.8-9.6 26.6-16.2 38.4-34.8-13.8-70.8-24.6-94.2-24.6-42 0-69.6 22.2-69.6 54.6 0 35.4 31.8 57.6 78 57.6 34.2 0 66-14.4 93-39.6 30.6 16.2 68.4 35.4 97.8 52.2l14-27.2z m-202.2 8.4c-28.8 0-45-11.4-45-30 0-16.8 14.4-27.6 37.8-27.6 16.2 0 38.4 6.6 63 17.4-20.4 25.2-41.4 40.2-55.8 40.2z" fill="#1677FF"/>
                    </Svg>
                    <Text style={[styles.paymentText, paymentMethod === 'alipay' && styles.paymentTextActive]}>支付宝</Text>
                    {paymentMethod === 'alipay' && (
                      <View style={styles.paymentCheck}>
                        <Svg width={16} height={16} viewBox="0 0 1024 1024">
                          <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#FF6B6B"/>
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              {pendingOrder && (
                <View style={styles.paymentOrderInfo}>
                  <Text style={styles.paymentOrderLabel}>订单编号</Text>
                  <Text style={styles.paymentOrderNo}>{pendingOrder.orderNo || pendingOrder.orderId}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.paymentModalFooter}>
              <TouchableOpacity style={styles.paymentCancelBtn} onPress={handlePaymentCancel}>
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
        onRequestClose={handleCancelModalClose}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>确认取消订单</Text>
            <Text style={styles.confirmModalText}>取消订单后将无法恢复，是否继续？</Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={handleCancelModalClose}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmConfirmBtn}
                onPress={handleCancelConfirm}
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
        onRequestClose={handleReceiveModalClose}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>确认收货</Text>
            <Text style={styles.confirmModalText}>确认已收到商品？</Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={handleReceiveModalClose}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmConfirmBtn}
                onPress={handleReceiveConfirm}
              >
                <Text style={styles.confirmConfirmText}>确认收货</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 售后申请弹窗 */}
      <Modal
        visible={showAfterSaleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAfterSaleModal(false)}
      >
        <View style={styles.afterSaleModalOverlay}>
          <View style={styles.afterSaleModalContent}>
            <View style={styles.afterSaleModalHeader}>
              <Text style={styles.afterSaleModalTitle}>申请售后</Text>
              <TouchableOpacity onPress={() => setShowAfterSaleModal(false)}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999"/>
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.afterSaleModalBody}>
              {/* 售后类型 */}
              <Text style={styles.afterSaleLabel}>售后类型</Text>
              <View style={styles.afterSaleTypeRow}>
                <TouchableOpacity
                  style={[styles.afterSaleTypeBtn, afterSaleType === 'REFUND' && styles.afterSaleTypeBtnActive]}
                  onPress={() => setAfterSaleType('REFUND')}
                >
                  <Text style={[styles.afterSaleTypeText, afterSaleType === 'REFUND' && styles.afterSaleTypeTextActive]}>仅退款</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.afterSaleTypeBtn, afterSaleType === 'RETURN' && styles.afterSaleTypeBtnActive]}
                  onPress={() => setAfterSaleType('RETURN')}
                >
                  <Text style={[styles.afterSaleTypeText, afterSaleType === 'RETURN' && styles.afterSaleTypeTextActive]}>退货退款</Text>
                </TouchableOpacity>
              </View>

              {/* 退款原因 */}
              <Text style={styles.afterSaleLabel}>退款原因 *</Text>
              <TextInput
                style={styles.afterSaleInput}
                placeholder="请输入退款原因"
                value={afterSaleReason}
                onChangeText={setAfterSaleReason}
                multiline
              />

              {/* 详细说明 */}
              <Text style={styles.afterSaleLabel}>详细说明</Text>
              <TextInput
                style={[styles.afterSaleInput, styles.afterSaleTextarea]}
                placeholder="请详细描述您的问题"
                value={afterSaleDescription}
                onChangeText={setAfterSaleDescription}
                multiline
                numberOfLines={4}
              />

              {/* 退款金额 */}
              <Text style={styles.afterSaleLabel}>退款金额 *</Text>
              <View style={styles.afterSaleAmountRow}>
                <Text style={styles.afterSaleCurrency}>¥</Text>
                <TextInput
                  style={styles.afterSaleAmountInput}
                  placeholder="0.00"
                  value={afterSaleAmount.toString()}
                  onChangeText={(text) => setAfterSaleAmount(parseFloat(text) || 0)}
                  keyboardType="decimal-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.afterSaleModalFooter}>
              <TouchableOpacity
                style={styles.afterSaleCancelBtn}
                onPress={() => setShowAfterSaleModal(false)}
              >
                <Text style={styles.afterSaleCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.afterSaleSubmitBtn}
                onPress={handleSubmitAfterSale}
              >
                <Text style={styles.afterSaleSubmitText}>提交申请</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 提交退货物流弹窗 */}
      <Modal
        visible={showSubmitLogisticsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitLogisticsModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.afterSaleModalContent}>
            <View style={styles.afterSaleModalHeader}>
              <Text style={styles.afterSaleModalTitle}>提交退货物流</Text>
              <TouchableOpacity onPress={() => setShowSubmitLogisticsModal(false)}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999"/>
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.afterSaleModalBody}>
              {/* 物流公司 */}
              <Text style={styles.afterSaleLabel}>物流公司 *</Text>
              <TextInput
                style={styles.afterSaleInput}
                placeholder="请输入物流公司名称，如顺丰快递"
                value={logisticsCompany}
                onChangeText={setLogisticsCompany}
              />

              {/* 物流单号 */}
              <Text style={styles.afterSaleLabel}>物流单号 *</Text>
              <TextInput
                style={styles.afterSaleInput}
                placeholder="请输入物流单号"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>

            <View style={styles.afterSaleModalFooter}>
              <TouchableOpacity
                style={styles.afterSaleCancelBtn}
                onPress={() => setShowSubmitLogisticsModal(false)}
              >
                <Text style={styles.afterSaleCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.afterSaleSubmitBtn}
                onPress={handleSubmitLogistics}
              >
                <Text style={styles.afterSaleSubmitText}>提交</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 申请平台介入弹窗 */}
      <Modal
        visible={showInterventionModal}
        transparent
        animationType="fade"
        onRequestClose={() => !interventionSubmitting && setShowInterventionModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.afterSaleModalContent}>
            <View style={styles.afterSaleModalHeader}>
              <Text style={styles.afterSaleModalTitle}>申请平台介入</Text>
              <TouchableOpacity
                onPress={() => !interventionSubmitting && setShowInterventionModal(false)}
                disabled={interventionSubmitting}
              >
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999"/>
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.afterSaleModalBody}>
              {selectedAfterSale && (
                <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#FFF7E6', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>商家拒绝原因</Text>
                  <Text style={{ fontSize: 13, color: '#333' }}>{selectedAfterSale.rejectReason || '无'}</Text>
                </View>
              )}
              <Text style={styles.afterSaleLabel}>申请介入原因 *</Text>
              <TextInput
                style={[styles.afterSaleInput, { height: 100 }]}
                placeholder="请详细说明您申请平台介入的原因，平台将根据双方证据进行裁决"
                value={interventionReason}
                onChangeText={setInterventionReason}
                multiline
                textAlignVertical="top"
              />
              <Text style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                提示：平台介入后商家和您都将无法再操作此售后单，由平台做出最终裁决
              </Text>
            </View>

            <View style={styles.afterSaleModalFooter}>
              <TouchableOpacity
                style={[styles.afterSaleCancelBtn, interventionSubmitting && { opacity: 0.5 }]}
                onPress={() => setShowInterventionModal(false)}
                disabled={interventionSubmitting}
              >
                <Text style={styles.afterSaleCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.afterSaleSubmitBtn, { backgroundColor: '#FF6B00' }, interventionSubmitting && { opacity: 0.5 }]}
                onPress={handleSubmitIntervention}
                disabled={interventionSubmitting}
              >
                <Text style={styles.afterSaleSubmitText}>{interventionSubmitting ? '提交中...' : '提交申请'}</Text>
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
  searchButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    marginTop: 0,
  },
  tabsScrollView: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F7055E',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#F7055E',
    fontWeight: '700',
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    right: 8,
    top: 10,
    backgroundColor: '#F7055E',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  orderList: {
    flex: 1,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    backgroundColor: '#F7055E',
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productList: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    gap: 12,
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
    fontWeight: '400',
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
  moreProducts: {
    paddingVertical: 4,
  },
  moreProductsText: {
    fontSize: 13,
    color: '#666',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingText: {
    fontSize: 13,
    color: '#666',
  },
  totalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  orderTime: {
    fontSize: 12,
    color: '#BFBFBF',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 12,
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
  bottomPlaceholder: {
    height: 20,
  },
  // 支付弹窗样式
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentCloseBtn: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  paymentModalBody: {
    padding: 20,
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
  paymentOrderInfo: {
    marginTop: 10,
  },
  paymentOrderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentOrderNo: {
    fontSize: 13,
    color: '#999',
  },
  paymentModalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  // 更多菜单样式
  moreBtnContainer: {
    position: 'relative',
  },
  moreMenu: {
    position: 'absolute',
    right: 0,
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    zIndex: 1000,
  },
  moreMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  moreMenuText: {
    fontSize: 14,
    color: '#333',
  },
  cancelText: {
    color: '#FF6B6B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
  },
  // 取消确认弹窗样式
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    padding: 24,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmModalButtons: {
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
  // 商品售后按钮样式
  afterSaleButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignSelf: 'flex-start',
  },
  afterSaleButtonText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  afterSaleStatusText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  // 售后弹窗样式
  afterSaleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  afterSaleModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  afterSaleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  afterSaleModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  afterSaleModalBody: {
    padding: 20,
  },
  afterSaleLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  afterSaleTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  afterSaleTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  afterSaleTypeBtnActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  afterSaleTypeText: {
    fontSize: 14,
    color: '#666',
  },
  afterSaleTypeTextActive: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  afterSaleInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  afterSaleTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  afterSaleAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  afterSaleCurrency: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  afterSaleAmountInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    marginLeft: 4,
  },
  afterSaleModalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  afterSaleCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
  },
  afterSaleCancelText: {
    fontSize: 15,
    color: '#666',
  },
  afterSaleSubmitBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  afterSaleSubmitText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default OrderList;
