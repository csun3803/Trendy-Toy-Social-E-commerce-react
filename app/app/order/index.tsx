import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { getUserOrders } from '../../services/orderService';
import { getUserIdFromToken } from '../../utils/jwtHelper';
import type { Order } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;

const OrderList: React.FC = () => {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(status || 'all');

  const tabs = [
    { key: 'all', label: '全部', status: '' },
    { key: 'unpaid', label: '待付款', status: 'PENDING' },
    { key: 'unshipped', label: '待发货', status: 'PENDING_SHIPMENT' },
    { key: 'shipping', label: '待收货', status: 'SHIPPED' },
    { key: 'completed', label: '已完成', status: 'COMPLETED' },
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
      if (currentTab && currentTab.status) {
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
        setOrders(orderList);
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
    switch (order.orderStatus) {
      case 'PENDING':
        return '待付款';
      case 'PENDING_SHIPMENT':
        return '待发货';
      case 'SHIPPED':
        return '待收货';
      case 'COMPLETED':
        return '已完成';
      case 'CANCELLED':
        return '已取消';
      default:
        return order.orderStatus;
    }
  };

  const getStatusColor = (order: Order) => {
    switch (order.orderStatus) {
      case 'PENDING':
        return '#FF6B6B';
      case 'PENDING_SHIPMENT':
        return '#FFA500';
      case 'SHIPPED':
        return '#1677FF';
      case 'COMPLETED':
        return '#52c41a';
      case 'CANCELLED':
        return '#999';
      default:
        return '#666';
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
    router.push(`/order/pay?orderId=${order.orderId}`);
  };

  const handleConfirmReceive = (order: Order) => {
    router.push(`/order/confirm?orderId=${order.orderId}`);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" fill="#333"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的订单</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.orderList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width={80} height={80} viewBox="0 0 1024 1024">
              <Path d="M832 312H696v-16c0-101.6-82.4-184-184-184s-184 82.4-184 184v16H192c-17.7 0-32 14.3-32 32v536c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V344c0-17.7-14.3-32-32-32zM432 296c0-61.9 50.1-112 112-112s112 50.1 112 112v16H432v-16z" fill="#ccc"/>
            </Svg>
            <Text style={styles.emptyText}>暂无订单</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.orderId} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNo}>订单号: {order.orderNo}</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order) }]}>
                  {getStatusText(order)}
                </Text>
              </View>
              
              <View style={styles.orderBody}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderAmount}>¥{order.actualAmount.toFixed(2)}</Text>
                  <Text style={styles.orderQuantity}>共{order.totalQuantity}件商品</Text>
                </View>
                <Text style={styles.orderTime}>{formatDate(order.createTime)}</Text>
              </View>

              <View style={styles.orderFooter}>
                {order.orderStatus === 'PENDING' && (
                  <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(order)}>
                    <Text style={styles.payBtnText}>立即付款</Text>
                  </TouchableOpacity>
                )}
                {order.orderStatus === 'SHIPPED' && (
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirmReceive(order)}>
                    <Text style={styles.confirmBtnText}>确认收货</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPlaceholder} />
      </ScrollView>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 34,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  orderList: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNo: {
    fontSize: 13,
    color: '#666',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderBody: {
    padding: 15,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  orderQuantity: {
    fontSize: 13,
    color: '#666',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 12,
    gap: 10,
  },
  payBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#1677FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomPlaceholder: {
    height: 20,
  },
});

export default OrderList;
