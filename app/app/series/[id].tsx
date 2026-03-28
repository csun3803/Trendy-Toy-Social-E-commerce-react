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
  Alert
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useLocalSearchParams, router } from 'expo-router';
import type { SeriesDetail, Product } from '../../types';
import { getSeriesDetail } from '../../services/seriesService';
import { config } from '../../config';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';

const getImageUrl = (imageUrl: string | string[] | null | undefined): string => {
  if (!imageUrl) return DEFAULT_IMAGE;
  
  let url: string;
  if (Array.isArray(imageUrl)) {
    url = imageUrl[0];
  } else if (typeof imageUrl === 'string') {
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        url = parsed[0];
      } else {
        url = imageUrl;
      }
    } catch (e) {
      url = imageUrl;
    }
  } else {
    return DEFAULT_IMAGE;
  }
  
  if (!url) return DEFAULT_IMAGE;
  if (!url.startsWith('http') && !url.startsWith('data:')) {
    url = `${BASE_URL}${url}`;
  }
  return url;
};

interface SeriesData {
  seriesId: string;
  seriesName: string;
  description: string;
  coverImage: string;
  minPrice: number;
  fullsetPrice: number;
  status: string;
  theme: string;
  releaseYear: string;
  regularVariants: number;
  hiddenVariants: number;
  totalVariants: number;
  seriesHotness: number;
  startDate: string;
  salesCount: number;
  products: Product[];
}

interface ProductData {
  productId: string;
  seriesId: string;
  productName: string;
  variantType: string;
  rarity: string;
  price: number;
  stock: number;
  description: string;
  productImages: string;
  sortOrder: number;
  status: string;
}

export default function SeriesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSeriesDetail();
    }
  }, [id]);

  const fetchSeriesDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSeriesDetail(id as string);
      const data = response.data as any;
      
      if (data) {
        setSeriesData({
          seriesId: data.seriesId || data.series_id || id,
          seriesName: data.seriesName || data.series_name || '未知系列',
          description: data.description || '',
          coverImage: data.coverImage || data.cover_image || '',
          minPrice: data.minPrice || data.min_price || 0,
          fullsetPrice: data.fullsetPrice || data.fullset_price || 0,
          status: data.status || 'ON_SALE',
          theme: data.theme || data.ip_name || '',
          releaseYear: data.releaseYear || data.release_year || new Date().getFullYear().toString(),
          regularVariants: data.regularVariants || data.regular_variants || 0,
          hiddenVariants: data.hiddenVariants || data.hidden_variants || 0,
          totalVariants: data.totalVariants || data.total_variants || 0,
          seriesHotness: data.seriesHotness || data.series_hotness || 0,
          startDate: data.startDate || data.start_date || '',
          salesCount: data.salesCount || data.sales_count || 0,
          products: data.products || data.variants || []
        });
        
        const productList = data.products || data.variants || [];
        setProducts(productList.map((item: any) => ({
          productId: item.productId || item.product_id || item.variantId || item.variant_id,
          seriesId: item.seriesId || item.series_id || id,
          productName: item.productName || item.product_name || item.variantName || item.variant_name || '未知款式',
          variantType: item.variantType || item.variant_type || '常规款',
          rarity: item.rarity || 'R',
          price: item.price || item.salePrice || item.sale_price || 0,
          stock: item.stock || item.stockQuantity || item.stock_quantity || 0,
          description: item.description || '',
          productImages: item.productImages || item.product_images || item.customImages || item.custom_images || '',
          sortOrder: item.sortOrder || item.sort_order || 0,
          status: item.status || 'ON_SALE'
        })));
      }
    } catch (err) {
      console.error('获取系列详情失败:', err);
      setError('获取系列详情失败');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setSeriesData({
      seriesId: id as string,
      seriesName: '新生日记系列',
      description: 'DIMOO新生日记系列，带你感受不同情绪的温暖',
      coverImage: '',
      minPrice: 99,
      fullsetPrice: 594,
      status: 'ON_SALE',
      theme: 'DIMOO',
      releaseYear: '2025',
      regularVariants: 6,
      hiddenVariants: 1,
      totalVariants: 7,
      seriesHotness: 8888,
      startDate: '2025-11-06',
      salesCount: 15234,
      products: []
    });

    setProducts([
      { productId: '1', seriesId: id as string, productName: '隐藏款-安全感', variantType: '隐藏款', rarity: 'SP', price: 269, stock: 50, description: '', productImages: '', sortOrder: 1, status: 'ON_SALE' },
      { productId: '2', seriesId: id as string, productName: '眷恋', variantType: '常规款', rarity: 'R', price: 103, stock: 200, description: '', productImages: '', sortOrder: 2, status: 'ON_SALE' },
      { productId: '3', seriesId: id as string, productName: '新奇', variantType: '常规款', rarity: 'R', price: 98, stock: 200, description: '', productImages: '', sortOrder: 3, status: 'ON_SALE' },
      { productId: '4', seriesId: id as string, productName: '懵懂', variantType: '常规款', rarity: 'R', price: 82, stock: 200, description: '', productImages: '', sortOrder: 4, status: 'ON_SALE' },
      { productId: '5', seriesId: id as string, productName: '陌生', variantType: '常规款', rarity: 'R', price: 83, stock: 200, description: '', productImages: '', sortOrder: 5, status: 'ON_SALE' },
      { productId: '6', seriesId: id as string, productName: '依赖', variantType: '常规款', rarity: 'R', price: 98, stock: 200, description: '', productImages: '', sortOrder: 6, status: 'ON_SALE' },
      { productId: '7', seriesId: id as string, productName: '守护', variantType: '常规款', rarity: 'R', price: 94, stock: 200, description: '', productImages: '', sortOrder: 7, status: 'ON_SALE' }
    ]);
  };

  const goBack = () => {
    router.back();
  };

  const handleShare = () => {
    Alert.alert('提示', '分享功能');
  };

  const handleProductClick = (productName: string) => {
    Alert.alert('提示', `点击了 ${productName}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
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
        <Text style={styles.headerTitle}>玩具系列</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>

        <Svg width={22} height={22} viewBox="0 0 1236 1024" fill="none">
          <Path
            d="M741.885532 1018.335144c-28.324281 0-50.932207-11.329712-73.540133-28.272782-22.659425-22.659425-39.653993-50.880708-39.653993-84.869845V792.049889c-124.420841 0-328.046671 33.989137-435.575941 181.069403-16.994568 28.272782-56.597063 45.215852-90.534701 50.880708h-16.994568c-56.545564-11.329712-90.483203-62.21042-84.818347-118.807483 28.324281-243.228324 113.142627-418.632871 260.222893-537.440354 107.477771-84.869845 231.950111-130.085697 367.700664-141.41541V118.858982c0-50.932207 22.659425-96.199557 67.926775-113.142627 39.602494-11.329712 84.869845-5.664856 118.807484 28.272782l362.035807 367.700664c28.324281 22.659425 45.318849 56.597063 50.983706 96.199557 5.613357 39.602494-5.664856 79.204989-33.989137 107.477771-5.664856 5.664856-11.329712 16.994568-22.659425 22.659425l-350.706095 356.370952c-22.659425 22.659425-50.932207 33.989137-79.204989 33.989137z m-90.534701-339.376383h90.534701v226.233756l356.370951-367.700664 5.664857-5.664856c5.664856-5.664856 5.664856-16.994568 5.664856-22.659425 0-11.329712-5.664856-16.94307-11.329713-22.607926l-5.664856-5.664856-356.370951-362.035808v214.955542l-79.204989 5.664856c-118.807483 0-231.950111 39.602494-328.149668 113.142628-113.142627 90.534701-186.68276 237.614967-209.290686 429.962583 141.415409-175.353048 390.360089-203.677329 531.775498-203.677329z"
            fill="#666666"
          />
        </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.seriesHeader}>
          <Image
            source={{ uri: getImageUrl(seriesData?.coverImage) }}
            style={styles.seriesCover}
            resizeMode="cover"
          />
          <View style={styles.seriesInfo}>
            <Text style={styles.seriesName}>{seriesData?.seriesName}</Text>
            <Text style={styles.seriesMeta}>
              {seriesData?.theme} | 发售{seriesData?.startDate || seriesData?.releaseYear} | ¥{seriesData?.minPrice}元/个，¥{seriesData?.fullsetPrice}元/盒 | {seriesData?.regularVariants}个常规款，{seriesData?.hiddenVariants}个隐藏款
            </Text>
            <Text style={styles.seriesDescription}>{seriesData?.description}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(seriesData?.seriesHotness || 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>浏览</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(seriesData?.salesCount || 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>想要</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>3.4k</Text>
                <Text style={styles.statLabel}>拥有</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          <TouchableOpacity style={styles.tagItem}>
            <Text style={styles.tagText}>{seriesData?.theme || '盲盒'}</Text>
            <Svg width={14} height={14} viewBox="0 0 1024 1024">
              <Path d="M338.944 176.928L847.072 512 338.944 847.072c-27.328 27.328-71.808 27.328-99.136 0s-27.328-71.808 0-99.136l414.08-414.08-414.08-414.08c-27.328-27.328-27.328-71.808 0-99.136s71.808-27.328 99.136 0z" fill="#999"/>
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tagItem}>
            <Text style={styles.tagText}>泡泡玛特</Text>
            <Svg width={14} height={14} viewBox="0 0 1024 1024">
              <Path d="M338.944 176.928L847.072 512 338.944 847.072c-27.328 27.328-71.808 27.328-99.136 0s-27.328-71.808 0-99.136l414.08-414.08-414.08-414.08c-27.328-27.328-27.328-71.808 0-99.136s71.808-27.328 99.136 0z" fill="#999"/>
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tagItem}>
            <Text style={styles.tagText}>盲盒系列</Text>
            <Svg width={14} height={14} viewBox="0 0 1024 1024">
              <Path d="M338.944 176.928L847.072 512 338.944 847.072c-27.328 27.328-71.808 27.328-99.136 0s-27.328-71.808 0-99.136l414.08-414.08-414.08-414.08c-27.328-27.328-27.328-71.808 0-99.136s71.808-27.328 99.136 0z" fill="#999"/>
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.variantsHeader}>
          <Text style={styles.variantsTitle}>款式</Text>
          <View style={styles.variantsSort}>
            <Text style={styles.sortText}>闪购低价优先</Text>
            <Svg width={16} height={16} viewBox="0 0 1024 1024">
              <Path d="M512 729.6L256 473.6h512z" fill="#666"/>
            </Svg>
          </View>
          <Text style={styles.sortText}>默认</Text>
          <Svg width={20} height={20} viewBox="0 0 1024 1024">
            <Path d="M128 128h768v85.3H128z m85.3 213.4h597.4v85.3H213.3z m0 213.4h426.7v85.3H213.3z m0 213.4h256v85.3h-256z" fill="#666"/>
          </Svg>
        </View>

        <View style={styles.variantsContainer}>
          {products.map((item) => (
            <TouchableOpacity
              key={item.productId}
              style={styles.variantItem}
              onPress={() => handleProductClick(item.productName)}
            >
              <Image
                source={{ uri: getImageUrl(item.productImages) }}
                style={styles.variantImage}
                resizeMode="stretch"
              />
              <Text style={styles.variantName} numberOfLines={1}>{item.productName}</Text>
              <View style={styles.variantPriceContainer}>
                <Svg width={20} height={20} viewBox="0 0 1024 1024">
                  <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8h-56v56c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8v-56h-56c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h56v-56c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v56h56c4.4 0 8 3.6 8 8v48z" fill="#FF6B6B"/>
                </Svg>
                <Text style={styles.variantPrice}>¥{item.price}</Text>
              </View>
              <Text style={styles.variantWantCount}>1.3w 想要</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.discussionHeader}>
          <Text style={styles.discussionTitle}>讨论</Text>
          <TouchableOpacity style={styles.postButton}>
            <Text style={styles.postButtonText}>去发帖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>查看更多</Text>
            <Svg width={14} height={14} viewBox="0 0 1024 1024">
              <Path d="M338.944 176.928L847.072 512 338.944 847.072c-27.328 27.328-71.808 27.328-99.136 0s-27.328-71.808 0-99.136l414.08-414.08-414.08-414.08c-27.328-27.328-27.328-71.808 0-99.136s71.808-27.328 99.136 0z" fill="#666"/>
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.discussionContainer}>
          {[1, 2, 3].map((index) => (
            <TouchableOpacity key={index} style={styles.discussionItem}>
              <View style={styles.discussionContent}>
                <Text style={styles.discussionTitleItem}>
                  {index === 1 ? '一人一句此娃萌点，不好听不要说' : 
                   index === 2 ? 'Dimoo背上小书包📚' : 
                   'DIMOO新生系列 四抽准确无踩雷！'}
                </Text>
                <View style={styles.discussionAuthor}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorAvatarText}>
                      {index === 1 ? '鱼' : index === 2 ? '橘' : 'M'}
                    </Text>
                  </View>
                  <Text style={styles.authorName}>
                    {index === 1 ? '鱼鱼鱼' : index === 2 ? '橘络' : 'Magic'}
                  </Text>
                </View>
                <View style={styles.discussionStats}>
                  <View style={styles.commentItem}>
                    <Svg width={20} height={20} viewBox="0 0 1024 1024">
                      <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 560c-4.4 0-8-3.6-8-8v-64c0-4.4 3.6-8 8-8s8 3.6 8 8v64c0 4.4-3.6 8-8 8zm0-240c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48z" fill="#999"/>
                    </Svg>
                    <Text style={styles.commentCount}>
                      {index === 1 ? '3' : index === 2 ? '6' : '回复'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.discussionImage}>
                <Text style={styles.discussionImageText}>图</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPlaceholder} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE4E1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFE4E1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  seriesHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFE4E1',
  },
  seriesCover: {
    width: 140,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  seriesInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  seriesName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  seriesMeta: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  seriesDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    marginRight: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFE4E1',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
    marginRight: 4,
  },
  variantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  variantsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  variantsSort: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  variantItem: {
    width: (screenWidth - 72) / 4,
    margin: 6,
    alignItems: 'center',
  },
  variantImage: {
    width: '100%',
    height: 118,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  variantName: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  variantPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  variantWantCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#FFE4E1',
  },
  discussionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  postButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 6,
  },
  postButtonText: {
    fontSize: 12,
    color: '#666',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  discussionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  discussionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  discussionContent: {
    flex: 1,
  },
  discussionTitleItem: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  discussionAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 12,
    color: '#666',
  },
  discussionStats: {
    flexDirection: 'row',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  discussionImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discussionImageText: {
    fontSize: 16,
    color: '#999',
  },
  bottomPlaceholder: {
    height: 30,
  },
});
