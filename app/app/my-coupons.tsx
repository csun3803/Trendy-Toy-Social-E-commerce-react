import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import type { UserCouponDTO } from '../types';
import { getMyCoupons } from '../services/couponService';
import { getUserIdFromToken } from '../utils/jwtHelper';

const MyCouponsPage = () => {
  const [coupons, setCoupons] = useState<UserCouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'unused' | 'used' | 'expired'>('unused');

  const fetchCoupons = useCallback(async () => {
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.back();
        return;
      }
      const response = await getMyCoupons();
      let list: UserCouponDTO[] = [];
      if (response.data) {
        if (response.data.code === 200 && response.data.data) {
          list = response.data.data;
        } else if (Array.isArray(response.data)) {
          list = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          list = response.data.data;
        }
      }
      setCoupons(list);
    } catch (error) {
      console.error('获取优惠券列表失败', error);
      Alert.alert('错误', '获取优惠券列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoupons();
  };

  const filteredCoupons = coupons
    .filter((c) => {
      if (activeTab === 'unused') return c.status === 'unused';
      if (activeTab === 'used') return c.status === 'used';
      if (activeTab === 'expired')
        return c.status === 'expired' || c.status === 'revoked';
      return true;
    })
    .sort((a, b) => {
      // 未使用券按过期时间升序（即将过期的优先）
      if (activeTab === 'unused') {
        const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        return timeA - timeB;
      }
      return 0;
    });

  const handleUseCoupon = () => {
    // 跳转到可使用优惠券的页面（商城首页）
    router.push('/(tabs)/shop');
  };

  const renderCouponCard = (coupon: UserCouponDTO, isDisabled: boolean) => {
    const expired =
      coupon.status === 'expired' ||
      coupon.status === 'revoked' ||
      (coupon.status === 'unused' &&
        coupon.expiresAt &&
        new Date(coupon.expiresAt) < new Date());
    const gray = isDisabled || expired;
    const isUnused = coupon.status === 'unused' && !expired;

    // 计算距过期天数
    let expireHint = '';
    if (isUnused && coupon.expiresAt) {
      const diffMs = new Date(coupon.expiresAt).getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        expireHint = `${diffDays}天内过期`;
      }
    }

    return (
      <View
        key={coupon.userCouponId}
        style={[styles.couponCard, gray && styles.couponCardDisabled]}
      >
        {/* 左侧金额区 */}
        <View style={[styles.couponLeft, gray && styles.couponLeftDisabled]}>
          <Text style={styles.couponAmount}>
            <Text style={styles.couponAmountSymbol}>¥</Text>
            {Number(coupon.discountValue || 0).toFixed(0)}
          </Text>
          <Text style={styles.couponThreshold}>
            满{Number(coupon.minSpend || 0).toFixed(0)}可用
          </Text>
        </View>
        {/* 分隔线 */}
        <View style={styles.couponDivider} />
        {/* 右侧信息区 */}
        <View style={styles.couponRight}>
          <View style={styles.couponInfoTop}>
            <Text
              style={[styles.couponName, gray && styles.couponNameDisabled]}
              numberOfLines={1}
            >
              {coupon.templateName || '优惠券'}
            </Text>
            {isUnused && expireHint ? (
              <View style={styles.expireHintBadge}>
                <Text style={styles.expireHintText}>{expireHint}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.couponCode} numberOfLines={1}>
            券码：{coupon.couponCode}
          </Text>
          <View style={styles.couponBottomRow}>
            <View style={styles.couponTimeInfo}>
              {coupon.status === 'used' && coupon.usedAt ? (
                <Text style={styles.couponExpire}>
                  使用时间：{new Date(coupon.usedAt).toLocaleString()}
                </Text>
              ) : coupon.status === 'revoked' ? (
                <Text style={styles.couponRevokeText}>已作废</Text>
              ) : (
                <Text style={styles.couponExpire}>
                  有效期至：{coupon.expiresAt || '-'}
                </Text>
              )}
            </View>
            {isUnused && (
              <TouchableOpacity
                style={styles.useButton}
                onPress={handleUseCoupon}
                activeOpacity={0.8}
              >
                <Text style={styles.useButtonText}>去使用</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* 状态标签 */}
        {coupon.status !== 'unused' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {coupon.status === 'used'
                ? '已使用'
                : coupon.status === 'expired'
                ? '已过期'
                : '已作废'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const counts = {
    unused: coupons.filter((c) => c.status === 'unused').length,
    used: coupons.filter((c) => c.status === 'used').length,
    expired: coupons.filter(
      (c) => c.status === 'expired' || c.status === 'revoked'
    ).length,
  };

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
        <Text style={styles.headerTitle}>我的券包</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 标签页 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unused' && styles.tabActive]}
          onPress={() => setActiveTab('unused')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'unused' && styles.tabTextActive,
            ]}
          >
            未使用({counts.unused})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'used' && styles.tabActive]}
          onPress={() => setActiveTab('used')}
        >
          <Text
            style={[styles.tabText, activeTab === 'used' && styles.tabTextActive]}
          >
            已使用({counts.used})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && styles.tabActive]}
          onPress={() => setActiveTab('expired')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'expired' && styles.tabTextActive,
            ]}
          >
            已过期({counts.expired})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 券列表 */}
      <ScrollView
        style={styles.couponList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCoupons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'unused'
                ? '暂无可用优惠券'
                : activeTab === 'used'
                ? '暂无已使用优惠券'
                : '暂无已过期优惠券'}
            </Text>
          </View>
        ) : (
          filteredCoupons.map((c) => renderCouponCard(c, false))
        )}
        <View style={{ height: 30 }} />
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
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 5,
    width: 60,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  couponList: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 120,
    position: 'relative',
  },
  couponCardDisabled: {
    backgroundColor: '#fafafa',
  },
  couponLeft: {
    width: 110,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  couponLeftDisabled: {
    backgroundColor: '#bbb',
  },
  couponAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  couponAmountSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  couponThreshold: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.9,
  },
  couponDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  couponRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  couponInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expireHintBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  expireHintText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  couponName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  couponNameDisabled: {
    color: '#999',
  },
  couponCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  couponBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponTimeInfo: {
    flex: 1,
  },
  couponExpire: {
    fontSize: 12,
    color: '#999',
  },
  couponUsedTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  couponRevokeText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  useButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
});

export default MyCouponsPage;
