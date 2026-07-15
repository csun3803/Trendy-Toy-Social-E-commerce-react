import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { config } from '../config';
import api from '../utils/api';
import { getFavoriteList } from '../services/favoriteService';

const BASE_URL = config.RESOURCE_BASE_URL;

type TabType = 'product' | 'activity';

// 商品收藏项
interface ProductFavorite {
  favoriteId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  shopName?: string;
  status?: string;
  createdAt: string;
}

// 动态收藏项
interface ActivityFavorite {
  activityId: string;
  title: string;
  coverImage: string;
  username?: string;
  avatarUrl?: string;
  likeCount?: number;
  viewCount?: number;
}

export default function MyFavoritesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('product');
  const [productFavorites, setProductFavorites] = useState<ProductFavorite[]>([]);
  const [activityFavorites, setActivityFavorites] = useState<ActivityFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProductFavorites = async () => {
    setLoading(true);
    try {
      const response = await getFavoriteList({ page: 1, size: 100 });
      const data = response.data as any;
      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.items) {
        items = data.items;
      } else if (data.records) {
        items = data.records;
      }

      const mapped: ProductFavorite[] = items.map((item: any) => {
        const snapshot = typeof item.productSnapshot === 'string'
          ? JSON.parse(item.productSnapshot || '{}')
          : item.productSnapshot || {};
        let image = snapshot.image || snapshot.coverImage || '';
        if (image && !image.startsWith('http')) {
          image = `${BASE_URL}${image}`;
        }
        return {
          favoriteId: item.favoriteId || item.id,
          productId: item.productId || item.saleSeriesId || '',
          productName: snapshot.name || snapshot.saleTitle || item.productName || '商品',
          productImage: image,
          price: snapshot.price || item.price || 0,
          shopName: snapshot.shopName || '',
          status: item.status || '',
          createdAt: item.createdAt || '',
        };
      });
      setProductFavorites(mapped);
    } catch (error) {
      console.error('获取商品收藏失败:', error);
      setProductFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFavorites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interaction/favorites/ACTIVITY');
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.records || data?.items || []);
      const mapped: ActivityFavorite[] = items.map((item: any) => {
        let coverImage = item.coverImage || '';
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = `${BASE_URL}${coverImage}`;
        }
        let avatarUrl = item.userInfo?.avatarUrl || item.avatarUrl || '';
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          avatarUrl = `${BASE_URL}${avatarUrl}`;
        }
        return {
          activityId: item.activityId || item.targetId || '',
          title: item.title || '',
          coverImage,
          username: item.userInfo?.username || item.username || '用户',
          avatarUrl,
          likeCount: item.likeCount || item.realLikeCount || 0,
          viewCount: item.viewCount || item.realViewCount || 0,
        };
      });
      setActivityFavorites(mapped);
    } catch (error) {
      console.error('获取动态收藏失败:', error);
      setActivityFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'product') {
      fetchProductFavorites();
    } else {
      fetchActivityFavorites();
    }
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'product') {
      fetchProductFavorites().finally(() => setRefreshing(false));
    } else {
      fetchActivityFavorites().finally(() => setRefreshing(false));
    }
  }, [activeTab]);

  const renderProductItem = (item: ProductFavorite) => (
    <TouchableOpacity
      key={item.favoriteId}
      style={styles.productItem}
      onPress={() => router.push(`/shop/${item.productId}` as any)}
    >
      <Image
        source={{ uri: item.productImage || `${BASE_URL}/images/placeholder.png` }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
        {item.shopName ? <Text style={styles.shopName}>{item.shopName}</Text> : null}
        <Text style={styles.productPrice}>¥{item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderActivityItem = (item: ActivityFavorite) => (
    <TouchableOpacity
      key={item.activityId}
      style={styles.activityItem}
      onPress={() => router.push(`/activity/${item.activityId}` as any)}
    >
      <Image
        source={{ uri: item.coverImage || `${BASE_URL}/images/placeholder.png` }}
        style={styles.activityImage}
        resizeMode="cover"
      />
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.activityMeta}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.activityAvatar} />
          ) : null}
          <Text style={styles.activityAuthor}>{item.username}</Text>
        </View>
        <View style={styles.activityStats}>
          <Text style={styles.activityStatText}>{item.likeCount} 赞</Text>
          <Text style={styles.activityStatText}>{item.viewCount} 浏览</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
              fill="#333"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的收藏</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'product' && styles.activeTab]}
          onPress={() => setActiveTab('product')}
        >
          <Text style={[styles.tabText, activeTab === 'product' && styles.activeTabText]}>商品</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>动态</Text>
        </TouchableOpacity>
      </View>

      {/* 内容 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
        }
      >
        {activeTab === 'product' ? (
          productFavorites.length > 0 ? (
            productFavorites.map(renderProductItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无收藏的商品</Text>
            </View>
          )
        ) : (
          activityFavorites.length > 0 ? (
            activityFavorites.map(renderActivityItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无收藏的动态</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8069E1',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
  },
  activeTabText: {
    color: '#8069E1',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // 商品收藏样式
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 12,
    color: '#8069E1',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  // 动态收藏样式
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  activityAuthor: {
    fontSize: 12,
    color: '#666',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  activityStatText: {
    fontSize: 11,
    color: '#999',
  },
});
