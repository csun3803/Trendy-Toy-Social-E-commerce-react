import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useLocalSearchParams, router } from 'expo-router';
import type { ShopInfo, SaleSeriesItem } from '../../types';
import { getShopDetail, getShopSaleSeries } from '../../services/shopService';
import { config } from '../../config';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;

const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (!imageUrl.startsWith('http')) {
    return `${BASE_URL}${imageUrl}`;
  }
  return imageUrl;
};

const getCoverImage = (saleCoverImage: string | null | undefined): string => {
  if (!saleCoverImage) return '';
  try {
    const images = JSON.parse(saleCoverImage);
    if (Array.isArray(images) && images.length > 0) {
      let url = images[0];
      if (url && !url.startsWith('http')) {
        url = `${BASE_URL}${url}`;
      }
      return url;
    }
  } catch (e) {
    if (saleCoverImage && !saleCoverImage.startsWith('http')) {
      return `${BASE_URL}${saleCoverImage}`;
    }
    return saleCoverImage;
  }
  return '';
};

export default function ShopHomePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [saleSeriesList, setSaleSeriesList] = useState<SaleSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      // 获取店铺详情 - GET /api/admin/shop/{shopId}
      const shopResponse = await getShopDetail(id as string);
      const shopData = (shopResponse as any).data || shopResponse;
      setShopInfo(shopData);

      // 获取店铺下的销售系列 - GET /api/sale-series/shop/{shopId}
      const seriesResponse = await getShopSaleSeries(id as string);
      const seriesData = (seriesResponse as any).data || seriesResponse;

      // 后端直接返回 SaleSeries 数组
      let dataArray: any[] = [];
      if (Array.isArray(seriesData)) {
        dataArray = seriesData;
      } else if (seriesData && Array.isArray(seriesData.records)) {
        dataArray = seriesData.records;
      } else if (seriesData && Array.isArray(seriesData.list)) {
        dataArray = seriesData.list;
      }

      const mappedSeries: SaleSeriesItem[] = dataArray.map((item: any) => ({
        saleSeriesId: item.saleSeriesId || item.sale_series_id,
        shopId: item.shopId || item.shop_id,
        seriesId: item.seriesId || item.series_id,
        saleTitle: item.saleTitle || item.sale_title,
        saleDescription: item.saleDescription || item.sale_description,
        saleCoverImage: item.saleCoverImage || item.sale_cover_image,
        saleStatus: item.saleStatus || item.sale_status,
        variantCount: item.variantCount || item.variant_count || 0,
        totalSales: item.totalSales || item.total_sales || 0,
        minPrice: item.minPrice ?? item.min_price,
        maxPrice: item.maxPrice ?? item.max_price,
        createdAt: item.createdAt || item.created_at,
        updatedAt: item.updatedAt || item.updated_at,
        shopName: item.shopName || item.shop_name,
      }));

      setSaleSeriesList(mappedSeries);
    } catch (err) {
      console.error('获取店铺信息失败:', err);
      setError('获取店铺信息失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const goToSeriesDetail = (saleSeriesId: string) => {
    router.push(`/shop/${saleSeriesId}`);
  };

  const onRefresh = () => {
    fetchData(true);
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
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
              fill="#3C3C3C"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shopInfo?.shopName || '店铺主页'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
      >
        {/* 店铺信息头部 */}
        <View style={styles.shopHeader}>
          <View style={styles.shopLogoContainer}>
            {shopInfo?.shopCover ? (
              <Image source={{ uri: getImageUrl(shopInfo.shopCover) }} style={styles.shopLogo} resizeMode="cover" />
            ) : (
              <View style={styles.shopLogoPlaceholder}>
                <Text style={styles.shopLogoText}>
                  {(shopInfo?.shopName || '店').charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.shopInfoSection}>
            <Text style={styles.shopName}>{shopInfo?.shopName || '未知店铺'}</Text>
            {shopInfo?.shopIntro ? (
              <Text style={styles.shopDescription} numberOfLines={2}>{shopInfo.shopIntro}</Text>
            ) : null}
          </View>
        </View>

        {/* 店铺统计 */}
        <View style={styles.shopStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shopInfo?.productCount ?? saleSeriesList.length}</Text>
            <Text style={styles.statLabel}>在售商品</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(shopInfo?.totalSales || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>累计销量</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shopInfo?.shopRating?.toFixed(1) || '-'}</Text>
            <Text style={styles.statLabel}>店铺评分</Text>
          </View>
        </View>

        {/* 全部商品标题 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>全部商品</Text>
          <Text style={styles.sectionCount}>共{saleSeriesList.length}件</Text>
        </View>

        {/* 商品列表 - 瀑布流双列 */}
        <View style={styles.productList}>
          {saleSeriesList.map((item, index) => {
            const coverUrl = getCoverImage(item.saleCoverImage);
            return (
              <TouchableOpacity
                key={item.saleSeriesId}
                style={[styles.productCard, index % 2 === 0 ? styles.productCardLeft : styles.productCardRight]}
                onPress={() => goToSeriesDetail(item.saleSeriesId)}
                activeOpacity={0.7}
              >
                <View style={styles.productImageContainer}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Svg width={40} height={40} viewBox="0 0 1024 1024">
                        <Path d="M96 896a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h832a32 32 0 0 1 32 32v704a32 32 0 0 1-32 32H96zm44.8-64h742.4L620.16 488.32a16 16 0 0 0-24.32 0L468.16 648.96l-86.4-103.04a16 16 0 0 0-24 0L140.8 832zM304 432a80 80 0 1 0 0-160 80 80 0 0 0 0 160z" fill="#ccc" />
                      </Svg>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={2}>{item.saleTitle}</Text>
                  <Text style={styles.productDesc} numberOfLines={1}>{item.saleDescription}</Text>
                  <View style={styles.productBottom}>
                    <Text style={styles.productPrice}>
                      ¥{item.minPrice != null ? item.minPrice.toFixed(2) : '0.00'}
                    </Text>
                    <Text style={styles.productSales}>已售{item.totalSales || 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomPlaceholder} />
      </ScrollView>
    </View>
  );
}

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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  shopLogoContainer: {
    marginRight: 12,
  },
  shopLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  shopLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopInfoSection: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 13,
    color: '#999',
  },
  productList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  productCard: {
    width: (screenWidth - 24) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  productCardLeft: {
    marginRight: 4,
  },
  productCardRight: {
    marginLeft: 4,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  productSales: {
    fontSize: 11,
    color: '#bbb',
  },
  bottomPlaceholder: {
    height: 30,
  },
});
