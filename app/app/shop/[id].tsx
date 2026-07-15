import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useLocalSearchParams, router } from 'expo-router';
import type { SaleSeriesItem, SaleVariantItem, CreateOrderRequest, OrderItemRequest, UserAddress, SocialActivity, ShopInfo } from '../../types';
import { getSaleSeriesDetail, getSaleVariantsBySeriesId } from '../../services/saleSeriesService';
import { getShopDetail } from '../../services/shopService';
import { createOrder, payOrder } from '../../services/orderService';
import { addToCart } from '../../services/cartService';
import { getUserIdFromToken } from '../../utils/jwtHelper';
import { getUserAddresses } from '../../services/addressService';
import { getActivitiesBySeries } from '../../services/activitySeriesService';
import { config } from '../../config';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;

// 辅助函数：获取款式图片URL
const getVariantImageUrl = (customImages: string | null | undefined): string => {
  if (!customImages) return 'https://via.placeholder.com/100';
  
  try {
    const images = JSON.parse(customImages);
    if (Array.isArray(images) && images.length > 0) {
      let imageUrl = images[0];
      // 如果图片路径不是完整URL，添加后端基础路径
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${BASE_URL}${imageUrl}`;
      }
      return imageUrl;
    }
  } catch (e) {
    // 如果不是JSON格式，直接使用字符串
    if (customImages && !customImages.startsWith('http')) {
      return `${BASE_URL}${customImages}`;
    }
    return customImages;
  }
  return 'https://via.placeholder.com/100';
};

const ShopDetail: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pathname = usePathname();

  const [saleSeries, setSaleSeries] = useState<SaleSeriesItem | null>(null);
  const [saleVariants, setSaleVariants] = useState<SaleVariantItem[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [relatedActivities, setRelatedActivities] = useState<SocialActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // 轮播图相关
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [coverImages, setCoverImages] = useState<string[]>([]);

  // 购买弹窗相关
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<SaleVariantItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  // 规格选择弹窗
  const [showSpecModal, setShowSpecModal] = useState(false);
  // 操作类型: 'add_to_cart' 或 'buy_now'
  const [actionType, setActionType] = useState<'add_to_cart' | 'buy_now'>('buy_now');
  
  // 支付方式
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  
  // 模拟支付弹窗
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);
  
  // 记住是否需要重新打开弹窗
  const [shouldReopenModal, setShouldReopenModal] = useState(false);
  // 记录前一个路径
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSaleSeriesDetail();
      loadDefaultAddress();
    }
  }, [id]);

  // 监听路径变化，处理弹窗重新打开逻辑
  useEffect(() => {
    // 只有当当前路径是商品详情页，且前一个路径是地址选择页，且需要重新打开弹窗时
    if (pathname.includes('/shop/') && 
        previousPath && 
        previousPath.includes('/address/') && 
        shouldReopenModal) {
      // 延迟一下，确保页面完全加载
      setTimeout(() => {
        setShowSpecModal(true);
        setShouldReopenModal(false);
        loadDefaultAddress();
      }, 100);
    }
    // 更新前一个路径
    setPreviousPath(pathname);
  }, [pathname, previousPath, shouldReopenModal]);

  // 移除旧的 useFocusEffect
  // useFocusEffect(
  //   useCallback(() => {
  //     if (shouldReopenModal) {
  //       // 延迟一下，确保页面完全加载
  //       setTimeout(() => {
  //         setShowSpecModal(true);
  //         setShouldReopenModal(false);
  //         loadDefaultAddress();
  //       }, 100);
  //     }
  //   }, [shouldReopenModal])
  // );

  const loadDefaultAddress = async () => {
    try {
      const userId = await getUserIdFromToken();
      if (!userId) return;

      const response = await getUserAddresses(userId);
      
      if (response.data) {
        // 兼容不同的响应格式
        let addresses = [];
        if (response.data.code === 200 && response.data.data) {
          addresses = response.data.data;
        } else if (Array.isArray(response.data)) {
          addresses = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          addresses = response.data.data;
        }
        
        const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('加载默认地址失败');
    }
  };

  const fetchSaleSeriesDetail = async () => {
    setLoading(true);
    try {
      // 获取销售系列详情
      const seriesResponse = await getSaleSeriesDetail(id as string);
      const seriesData = seriesResponse.data;
      setSaleSeries(seriesData);

      // 处理封面图片
      processCoverImages(seriesData.saleCoverImage);

      // 获取销售系列下的款式列表
      const variantsResponse = await getSaleVariantsBySeriesId(id as string);
      setSaleVariants(variantsResponse.data || []);

      // 获取关联动态
      if (seriesData.seriesId) {
        fetchRelatedActivities(seriesData.seriesId);
      }

      // 获取店铺信息
      if (seriesData.shopId) {
        fetchShopInfo(seriesData.shopId);
      }
    } catch (err) {
      console.error('获取销售系列详情失败:', err);
      setError('获取商品信息失败');
      // 加载模拟数据
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchShopInfo = async (shopId: string) => {
    try {
      const response = await getShopDetail(shopId);
      const data = (response as any).data || response;
      setShopInfo(data);
    } catch (error) {
      console.error('获取店铺信息失败:', error);
    }
  };

  const fetchRelatedActivities = async (seriesId: string) => {
    setActivitiesLoading(true);
    try {
      console.log('[销售系列详情] 开始获取相关动态，seriesId:', seriesId);
      const response = await getActivitiesBySeries(seriesId);
      console.log('[销售系列详情] 相关动态响应:', response);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data;
        console.log('[销售系列详情] 相关动态数据:', data);
        const activitiesList = data.records || data.list || data.items || data || [];
        console.log('[销售系列详情] 处理后的动态列表:', activitiesList);
        setRelatedActivities(activitiesList);
      }
    } catch (error) {
      console.error('[销售系列详情] 获取相关动态失败:', error);
      loadMockRelatedActivities();
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadMockRelatedActivities = () => {
    const mockActivities: SocialActivity[] = [
      {
        activityId: 'act_001',
        userId: 'user_001',
        activityType: '开箱',
        title: 'Dimoo梦境之旅开箱分享',
        content: '今天收到了期待已久的Dimoo梦境之旅系列',
        coverImage: `${BASE_URL}/images/jrtj/1.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/1.jpg`],
        location: '北京市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 1250,
        likeCount: 256,
        commentCount: 48,
        favoriteCount: 32,
        shareCount: 15,
        publishedAt: '2024-05-10 14:30:00',
        updatedAt: '2024-05-10 14:30:00',
        userInfo: {
          userId: 'user_001',
          username: '潮玩达人',
          avatarUrl: `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
        }
      },
      {
        activityId: 'act_002',
        userId: 'user_002',
        activityType: '收藏',
        title: '我的Dimoo梦境之旅收藏分享',
        content: '花了三个月终于集齐了整个系列！',
        coverImage: `${BASE_URL}/images/jrtj/2.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/2.jpg`],
        location: '上海市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 890,
        likeCount: 178,
        commentCount: 35,
        favoriteCount: 45,
        shareCount: 12,
        publishedAt: '2024-05-09 10:15:00',
        updatedAt: '2024-05-09 10:15:00',
        userInfo: {
          userId: 'user_002',
          username: '玩具收藏家',
          avatarUrl: `${BASE_URL}/images/avatar/3af1b8e1-636f-4673-b42f-59db768dd7b9.jpg`
        }
      }
    ];
    setRelatedActivities(mockActivities);
  };

  const getActivityAvatarUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`;
    if (!imageUrl.startsWith('http')) {
      return `${BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const getActivityImageUrl = (imageUrl: string | string[] | null | undefined): string => {
    if (!imageUrl) return 'https://via.placeholder.com/100';
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
      return 'https://via.placeholder.com/100';
    }
    if (!url) return 'https://via.placeholder.com/100';
    if (!url.startsWith('http')) {
      url = `${BASE_URL}${url}`;
    }
    return url;
  };

  const loadMockData = () => {
    setSaleSeries({
      saleSeriesId: id as string,
      shopId: 'shop_001',
      seriesId: 'series_001',
      saleTitle: 'SKULLPANDA温度系列盲盒',
      saleDescription: 'SKULLPANDA温度系列，包含12款常规款+1款隐藏款，每款都有独特的温度主题设计',
      saleCoverImage: JSON.stringify([
        'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=SP温度1',
        'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=SP温度2',
        'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=SP温度3'
      ]),
      saleStatus: 'ON_SALE',
      variantCount: 13,
      totalSales: 15234,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    });

    setCoverImages([
      'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=SP温度1',
      'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=SP温度2',
      'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=SP温度3'
    ]);

    setSaleVariants([
      {
        saleVariantId: 'variant_001',
        saleSeriesId: id as string,
        variantId: 'orig_variant_001',
        shopId: 'shop_001',
        salePrice: 69.00,
        crossedPrice: 89.00,
        stockQuantity: 100,
        warningStock: 10,
        skuCode: 'SP-WD-001',
        saleStatus: 'ON_SALE',
        limitQuantity: 5,
        customDescription: '温度系列-炽热',
        customImages: JSON.stringify(['https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=炽热']),
        salesCount: 5234,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        saleVariantId: 'variant_002',
        saleSeriesId: id as string,
        variantId: 'orig_variant_002',
        shopId: 'shop_001',
        salePrice: 69.00,
        crossedPrice: 89.00,
        stockQuantity: 80,
        warningStock: 10,
        skuCode: 'SP-WD-002',
        saleStatus: 'ON_SALE',
        limitQuantity: 5,
        customDescription: '温度系列-温暖',
        customImages: JSON.stringify(['https://via.placeholder.com/200x200/FFA07A/FFFFFF?text=温暖']),
        salesCount: 3456,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        saleVariantId: 'variant_003',
        saleSeriesId: id as string,
        variantId: 'orig_variant_003',
        shopId: 'shop_001',
        salePrice: 69.00,
        crossedPrice: 89.00,
        stockQuantity: 50,
        warningStock: 10,
        skuCode: 'SP-WD-003',
        saleStatus: 'ON_SALE',
        limitQuantity: 5,
        customDescription: '温度系列-寒冷',
        customImages: JSON.stringify(['https://via.placeholder.com/200x200/87CEEB/FFFFFF?text=寒冷']),
        salesCount: 2876,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        saleVariantId: 'variant_004',
        saleSeriesId: id as string,
        variantId: 'orig_variant_004',
        shopId: 'shop_001',
        salePrice: 69.00,
        crossedPrice: 89.00,
        stockQuantity: 30,
        warningStock: 10,
        skuCode: 'SP-WD-004',
        saleStatus: 'ON_SALE',
        limitQuantity: 5,
        customDescription: '温度系列-隐藏款',
        customImages: JSON.stringify(['https://via.placeholder.com/200x200/FFD700/FFFFFF?text=隐藏款']),
        salesCount: 1567,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ]);
  };

  const processCoverImages = (coverImageData: string) => {
    const images: string[] = [];
    const baseUrl = config.RESOURCE_BASE_URL;

    try {
      if (coverImageData) {
        if (typeof coverImageData === 'string') {
          if (coverImageData.startsWith('[')) {
            const parsedImages = JSON.parse(coverImageData);
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              const trimmedImages = parsedImages.map((img: string) => {
                const trimmed = img.trim();
                if (trimmed.startsWith('/') && !trimmed.startsWith('http')) {
                  return baseUrl + trimmed;
                }
                return trimmed;
              });
              images.push(...trimmedImages);
            }
          } else {
            const trimmed = coverImageData.trim();
            if (trimmed.startsWith('/') && !trimmed.startsWith('http')) {
              images.push(baseUrl + trimmed);
            } else {
              images.push(trimmed);
            }
          }
        }
      }
    } catch (e) {
      console.error('解析封面图片失败:', e);
    }

    setCoverImages(images.length > 0 ? images : ['https://via.placeholder.com/400x400/CCCCCC/FFFFFF?text=暂无图片']);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentImageIndex(index);
  };

  const getMinPrice = () => {
    if (saleVariants.length === 0) return 0;
    return Math.min(...saleVariants.map(v => v.salePrice));
  };

  const getMaxPrice = () => {
    if (saleVariants.length === 0) return 0;
    return Math.max(...saleVariants.map(v => v.salePrice));
  };

  const getTotalStock = () => {
    return saleVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
  };

  const handleBuy = () => {
    setActionType('buy_now');
    setShowSpecModal(true);
  };

  const handleAddToCart = () => {
    setActionType('add_to_cart');
    setShowSpecModal(true);
  };

  const doAddToCart = async () => {
    if (!selectedVariant || !saleSeries) {
      Alert.alert('提示', '请选择商品款式');
      return;
    }
    
    try {
      const userId = await getUserIdFromToken();
      
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.push('/login');
        return;
      }

      // 获取商品图片
      let imageUrl = '';
      try {
        const images = JSON.parse(selectedVariant.customImages);
        if (Array.isArray(images) && images.length > 0) {
          imageUrl = images[0];
        }
      } catch (e) {
        imageUrl = selectedVariant.customImages || '';
      }

      // 构建 productSnapshot 并序列化为 JSON 字符串
      const productSnapshot = JSON.stringify({
        sku: selectedVariant.skuCode,
        name: selectedVariant.variantName || selectedVariant.customDescription || saleSeries.saleTitle,
        brand: '',
        image: imageUrl,
        price: selectedVariant.salePrice,
        category: '盲盒',
        shopName: saleSeries.shopName || '未知店铺',
        saleSeriesName: saleSeries.saleTitle,
        variantName: selectedVariant.variantName || selectedVariant.customDescription
      });

      // 调用加入购物车 API
      const response = await addToCart({
        userId: userId,
        shopId: selectedVariant.shopId,
        saleSeriesId: saleSeries.saleSeriesId,
        saleVariantId: selectedVariant.saleVariantId,
        variantId: selectedVariant.variantId,
        productSnapshot: productSnapshot,
        quantity: quantity,
        sourceType: 'manual',
        sourceId: ''
      });

      if (response && response.code === 200) {
        setShowSpecModal(false);
        setSelectedVariant(null);
        setQuantity(1);
        Alert.alert('成功', '已添加到购物车');
      } else {
        Alert.alert('失败', response?.message || '添加购物车失败');
      }
    } catch (error) {
      console.error('加入购物车失败:', error);
      Alert.alert('错误', '加入购物车时发生错误');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedVariant || !saleSeries) {
      Alert.alert('提示', '请选择商品款式');
      return;
    }
    
    try {
      const userId = await getUserIdFromToken();
      
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.push('/login');
        return;
      }
      
      const unitPrice = selectedVariant.salePrice;
      const originalPrice = selectedVariant.crossedPrice || unitPrice;
      const subtotalAmount = unitPrice * quantity;
      const actualSubtotal = subtotalAmount;
      
      const orderItem: OrderItemRequest = {
        productId: selectedVariant.saleVariantId,
        originalPrice: originalPrice,
        unitPrice: unitPrice,
        quantity: quantity,
        subtotalAmount: subtotalAmount,
        allocatedDiscount: 0,
        actualSubtotal: actualSubtotal,
        itemSellerId: selectedVariant.shopId
      };
      
      const orderData: CreateOrderRequest = {
        userId: userId,
        amount: subtotalAmount,
        shippingFee: 0,
        totalDiscount: 0,
        actualAmount: actualSubtotal,
        addressId: selectedAddress?.addressId,
        userRemark: '',
        paymentMethod: paymentMethod === 'wechat' ? 'WECHAT' : 'ALIPAY',
        items: [orderItem]
      };
      
      const response = await createOrder(orderData);
      
      if (response && response.code === 200) {
        setShowSpecModal(false);
        setPendingOrderId(response.data?.orderId || null);
        setPendingOrderNo(response.data?.orderNo || null);
        setShowPaymentModal(true);
      } else if (response) {
        Alert.alert('失败', response.message || '创建订单失败');
      } else {
        Alert.alert('失败', '创建订单失败，请稍后重试');
      }
    } catch (error) {
      console.error('创建订单失败');
      let errorMessage = '创建订单时发生错误';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      Alert.alert('错误', errorMessage);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!pendingOrderId) return;
    
    try {
      const response = await payOrder(pendingOrderId, paymentMethod === 'wechat' ? 'WECHAT' : 'ALIPAY');
      
      if (response && response.code === 200) {
        setShowPaymentModal(false);
        setSelectedVariant(null);
        setQuantity(1);
        setPendingOrderId(null);
        setPendingOrderNo(null);
        Alert.alert('支付成功', '订单已支付，请等待发货');
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
    setSelectedVariant(null);
    setQuantity(1);
    Alert.alert('订单待付款', '您可以在"我的订单"中继续支付');
  };

  const selectVariant = (variant: SaleVariantItem) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const changeQuantity = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (selectedVariant && newQuantity > Math.min(selectedVariant.limitQuantity, selectedVariant.stockQuantity)) {
      Alert.alert('提示', '已达到最大购买数量');
      return;
    }
    setQuantity(newQuantity);
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error && !saleSeries) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSaleSeriesDetail}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const minPrice = getMinPrice();
  const maxPrice = getMaxPrice();
  const priceText = minPrice === maxPrice ? `¥${minPrice.toFixed(2)}` : `¥${minPrice.toFixed(2)} - ¥${maxPrice.toFixed(2)}`;

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
        <Text style={styles.headerTitle} numberOfLines={1}>{saleSeries?.saleTitle || '商品详情'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 图片轮播 */}
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {coverImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* 图片指示器 */}
          <View style={styles.imageIndicator}>
            <Text style={styles.indicatorText}>{currentImageIndex + 1} / {coverImages.length}</Text>
          </View>
          {/* 轮播点 */}
          <View style={styles.dotsContainer}>
            {coverImages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentImageIndex && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* 价格区域 */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>¥</Text>
            <Text style={styles.priceText}>{priceText}</Text>
            {saleVariants.length > 0 && saleVariants[0].crossedPrice > 0 && (
              <Text style={styles.originalPrice}>¥{saleVariants[0].crossedPrice.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.salesInfo}>
            <Text style={styles.salesText}>已售 {saleSeries?.totalSales || 0}</Text>
            <Text style={styles.stockText}>库存 {getTotalStock()}件</Text>
          </View>
        </View>

        {/* 商品标题 */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle}>{saleSeries?.saleTitle}</Text>
          <Text style={styles.productDesc}>{saleSeries?.saleDescription}</Text>
        </View>

        {/* 店铺信息 */}
        <TouchableOpacity
          style={styles.shopInfoSection}
          onPress={() => {
            if (saleSeries?.shopId) {
              router.push(`/shop-home/${saleSeries.shopId}` as any);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.shopInfoLeft}>
            {shopInfo?.shopCover ? (
              <Image source={{ uri: shopInfo.shopCover.startsWith('http') ? shopInfo.shopCover : `${BASE_URL}${shopInfo.shopCover}` }} style={styles.shopInfoLogo} resizeMode="cover" />
            ) : (
              <View style={styles.shopInfoLogoPlaceholder}>
                <Text style={styles.shopInfoLogoText}>{(shopInfo?.shopName || saleSeries?.shopName || '店').charAt(0)}</Text>
              </View>
            )}
            <View style={styles.shopInfoText}>
              <Text style={styles.shopInfoName}>{shopInfo?.shopName || saleSeries?.shopName || '未知店铺'}</Text>
              {shopInfo?.shopIntro ? (
                <Text style={styles.shopInfoDesc} numberOfLines={1}>{shopInfo.shopIntro}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.shopInfoRight}>
            <Text style={styles.shopInfoEnter}>进店</Text>
            <Svg width={14} height={14} viewBox="0 0 1024 1024">
              <Path d="M765.7 486.8L314.9 134.7c-5.3-4.1-12.9-0.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1c16.4-12.8 16.4-37.5 0-50.3z" fill="#999"/>
            </Svg>
          </View>
        </TouchableOpacity>

        {/* 规格选择 */}
        <TouchableOpacity style={styles.specSection} onPress={() => setShowSpecModal(true)}>
          <Text style={styles.specLabel}>选择</Text>
          <Text style={styles.specValue} numberOfLines={1}>
            {selectedVariant ? `已选：${selectedVariant.variantName || selectedVariant.customDescription}` : `共${saleVariants.length}个款式可选`}
          </Text>
          <Svg width={20} height={20} viewBox="0 0 1024 1024">
            <Path d="M765.7 486.8L314.9 134.7c-5.3-4.1-12.9-0.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1c16.4-12.8 16.4-37.5 0-50.3z" fill="#999"/>
          </Svg>
        </TouchableOpacity>

        {/* 服务保障 */}
        <View style={styles.serviceSection}>
          <View style={styles.serviceItem}>
            <Svg width={16} height={16} viewBox="0 0 1024 1024">
              <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#52c41a"/>
            </Svg>
            <Text style={styles.serviceText}>正品保证</Text>
          </View>
          <View style={styles.serviceItem}>
            <Svg width={16} height={16} viewBox="0 0 1024 1024">
              <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#52c41a"/>
            </Svg>
            <Text style={styles.serviceText}>极速发货</Text>
          </View>
          <View style={styles.serviceItem}>
            <Svg width={16} height={16} viewBox="0 0 1024 1024">
              <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#52c41a"/>
            </Svg>
            <Text style={styles.serviceText}>七天无理由</Text>
          </View>
        </View>

        {/* 相关动态 */}
        <View style={styles.relatedActivitiesSection}>
          <View style={styles.relatedActivitiesHeader}>
            <Text style={styles.relatedActivitiesTitle}>相关动态</Text>
            <TouchableOpacity style={styles.viewMoreBtn}>
              <Text style={styles.viewMoreBtnText}>查看更多</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="#999" />
              </Svg>
            </TouchableOpacity>
          </View>
          {activitiesLoading ? (
            <View style={styles.activitiesLoadingContainer}>
              <ActivityIndicator size="small" color="#FF6B6B" />
            </View>
          ) : relatedActivities.length > 0 ? (
            relatedActivities.map((activity) => (
              <TouchableOpacity
                key={activity.activityId}
                style={styles.activityCard}
                onPress={() => router.push(`/activity/${activity.activityId}` as any)}
              >
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
                  <View style={styles.activityAuthor}>
                    <Image
                      source={{ uri: getActivityAvatarUrl(activity.userInfo?.avatarUrl) }}
                      style={styles.activityAvatar}
                    />
                    <Text style={styles.activityAuthorName}>{activity.userInfo?.username || '用户'}</Text>
                  </View>
                  <View style={styles.activityStats}>
                    <View style={styles.activityStatItem}>
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#999" />
                      </Svg>
                      <Text style={styles.activityStatText}>{activity.viewCount}</Text>
                    </View>
                    <View style={styles.activityStatItem}>
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#999" />
                      </Svg>
                      <Text style={styles.activityStatText}>{activity.likeCount}</Text>
                    </View>
                    <View style={styles.activityStatItem}>
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" fill="#999" />
                      </Svg>
                      <Text style={styles.activityStatText}>{activity.commentCount}</Text>
                    </View>
                  </View>
                </View>
                {activity.coverImage && (
                  <Image
                    source={{ uri: getActivityImageUrl(activity.coverImage) }}
                    style={styles.activityImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.activitiesEmptyContainer}>
              <Text style={styles.activitiesEmptyText}>暂无相关动态</Text>
            </View>
          )}
        </View>

        {/* 底部占位 */}
        <View style={styles.bottomPlaceholder} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity style={styles.iconButton}>
            <svg
              t="1776698659613"
              className="icon"
              viewBox="0 0 1025 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="9874"
              width={22}
              height={22}
            >
              <path
                d="M512.118374 131.072L603.766374 317.44c20.48 41.472 59.392 70.144 104.96 76.8l205.824 30.208-148.992 145.92c-32.768 32.256-47.616 78.336-39.936 123.392l35.328 205.824-183.296-96.768c-19.968-10.752-42.496-16.384-65.024-16.384-22.528 0-45.056 5.632-65.024 16.384l-183.296 96.768 35.328-205.824c7.68-45.056-7.168-91.136-39.936-123.392L109.686374 424.448 314.998374 394.24c45.568-6.656 84.992-35.328 104.96-76.8l92.16-186.368m0-112.64c-20.48 0-41.472 10.752-51.712 32.256L346.742374 281.6c-8.192 16.896-24.576 29.184-43.52 31.744L49.270374 350.208C2.166374 357.376-16.777626 415.232 17.526374 449.024l183.808 180.224c13.312 13.312 19.968 32.256 16.384 51.2l-43.52 253.952c-6.144 37.376 23.552 67.584 56.832 67.584 8.704 0 17.92-2.048 27.136-6.656L484.982374 875.52c8.192-4.608 17.92-6.656 27.136-6.656 9.216 0 18.432 2.048 27.136 6.656l226.816 119.808c8.704 4.608 17.92 6.656 27.136 6.656 33.792 0 63.488-30.208 56.832-67.584l-43.52-253.952c-3.072-18.944 3.072-37.888 16.384-51.2l183.808-180.224c34.304-33.28 15.36-91.648-32.256-98.304l-253.952-36.864c-18.944-2.56-35.328-14.848-43.52-31.744L563.830374 50.688c-10.752-21.504-31.232-32.256-51.712-32.256z"
                p-id="9875"
              />
            </svg>
            <Text style={styles.iconText}>收藏</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/shop?tab=cart')}>
            <svg
              t="1776698562164"
              className="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="8887"
              width={25}
              height={25}
            >
              <path
                d="M733.090909 814.545455a58.181818 58.181818 0 1 1 0 116.363636 58.181818 58.181818 0 0 1 0-116.363636z m-442.181818 0a58.181818 58.181818 0 1 1 0 116.363636 58.181818 58.181818 0 0 1 0-116.363636zM91.229091 74.752c59.066182 9.937455 81.943273 42.496 98.257454 113.803636l589.568-2.001454a93.090909 93.090909 0 0 1 92.765091 104.168727l-47.429818 395.287273A93.090909 93.090909 0 0 1 731.927273 768h-439.156364a93.090909 93.090909 0 0 1-91.787636-77.591273L116.363636 188.858182c-8.797091-33.047273-16.616727-41.890909-36.701091-45.242182a34.909091 34.909091 0 1 1 11.589819-68.864z m688.081454 181.620364L200.424727 258.327273l3.863273 31.976727 65.559273 388.445091a23.272727 23.272727 0 0 0 20.154182 19.246545l2.792727 0.162909h439.156363a23.272727 23.272727 0 0 0 22.644364-17.850181l0.465455-2.653091 47.429818-395.264a23.272727 23.272727 0 0 0-20.48-25.902546l-2.699637-0.139636z m-336.128 231.051636l1.093819 3.188364c7.400727 25.320727 34.909091 44.520727 67.886545 44.520727 31.092364 0 57.413818-17.128727 66.466909-40.401455l1.210182-3.537454a34.909091 34.909091 0 1 1 66.792727 20.410182c-16.919273 55.365818-72.005818 93.323636-134.469818 93.323636-63.069091 0-118.551273-38.679273-134.912-94.789818a34.909091 34.909091 0 0 1 65.931636-22.714182z"
                fill="#333333"
                p-id="8888"
              />
            </svg>
            <Text style={styles.iconText}>购物车</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomRight}>
          <TouchableOpacity style={styles.addCartButton} onPress={handleAddToCart}>
            <Text style={styles.addCartText}>加入购物车</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
            <Text style={styles.buyButtonText}>立即购买</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 规格选择弹窗 */}
      <Modal
        visible={showSpecModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpecModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowSpecModal(false)} />
          <View style={styles.specModalContent}>
            {/* 地址选择区域 - 只在立即购买时显示 */}
            {actionType === 'buy_now' && (
              <TouchableOpacity style={styles.addressSection} onPress={() => {
                // 先关闭弹窗
                setShowSpecModal(false);
                // 设置标记,以便返回时重新打开弹窗
                setShouldReopenModal(true);
                // 导航到地址选择页
                router.push('/address/select');
              }}>
              <View style={styles.addressIcon}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm212.7 648.2c0 46.5-37.6 84.2-84.2 84.2H383.5c-46.5 0-84.2-37.6-84.2-84.2V524.8c0-46.5 37.6-84.2 84.2-84.2h62.9V335c0-49.7 40.3-90 90-90s90 40.3 90 90v105.6h62.9c46.5 0 84.2 37.6 84.2 84.2v187.4z" fill="#666"/>
                </Svg>
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>收货地址</Text>
                <Text style={styles.addressDetail}>
                  {selectedAddress ? 
                    `${selectedAddress.recipientName} ${selectedAddress.recipientPhone} ${selectedAddress.province}${selectedAddress.city}${selectedAddress.district}${selectedAddress.detailAddress}` : 
                    '请选择收货地址'}
                </Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 1024 1024">
                <Path d="M765.7 486.8L314.9 134.7c-5.3-4.1-12.9-0.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1c16.4-12.8 16.4-37.5 0-50.3z" fill="#999"/>
              </Svg>
            </TouchableOpacity>
            )}

            <View style={styles.specModalHeader}>
              <View style={styles.specModalImage}>
                {selectedVariant ? (
                  <Image
                    source={{ uri: getVariantImageUrl(selectedVariant.customImages) }}
                    style={styles.specModalThumb}
                  />
                ) : (
                  <Image
                    source={{ uri: coverImages[0] || 'https://via.placeholder.com/100' }}
                    style={styles.specModalThumb}
                  />
                )}
              </View>
              <View style={styles.specModalInfo}>
                <Text style={styles.specModalPrice}>
                  {selectedVariant ? `¥${selectedVariant.salePrice.toFixed(2)}` : priceText}
                </Text>
                <Text style={styles.specModalStock}>
                  {selectedVariant ? `库存${selectedVariant.stockQuantity}件` : `库存${getTotalStock()}件`}
                </Text>
                <Text style={styles.specModalSelected}>
                  {selectedVariant ? `已选：${selectedVariant.variantName || selectedVariant.customDescription}` : '请选择款式'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSpecModal(false)} style={styles.closeButton}>
                <Svg width={24} height={24} viewBox="0 0 1024 1024">
                  <Path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z" fill="#999"/>
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.specModalBody}>
              <Text style={styles.specModalLabel}>款式</Text>
              <View style={styles.specOptions}>
                {saleVariants.map((variant) => (
                  <TouchableOpacity
                    key={variant.saleVariantId}
                    style={[
                      styles.specOption,
                      selectedVariant?.saleVariantId === variant.saleVariantId && styles.specOptionActive,
                      variant.stockQuantity === 0 && styles.specOptionDisabled
                    ]}
                    onPress={() => variant.stockQuantity > 0 && selectVariant(variant)}
                    disabled={variant.stockQuantity === 0}
                  >
                    <Text style={[
                      styles.specOptionText,
                      selectedVariant?.saleVariantId === variant.saleVariantId && styles.specOptionTextActive,
                      variant.stockQuantity === 0 && styles.specOptionTextDisabled
                    ]}>
                      {variant.variantName || variant.customDescription}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.quantitySection}>
                <Text style={styles.specModalLabel}>数量</Text>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
                    onPress={() => changeQuantity(-1)}
                    disabled={quantity <= 1}
                  >
                    <Text style={styles.quantityBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => changeQuantity(1)}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {actionType === 'buy_now' && (
                <View style={styles.paymentSection}>
                  <Text style={styles.specModalLabel}>支付方式</Text>
                  <View style={styles.paymentOptions}>
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
              )}
            </ScrollView>

            <View style={styles.specModalFooter}>
              {actionType === 'add_to_cart' ? (
                <TouchableOpacity style={styles.specAddCartBtn} onPress={() => {
                  if (!selectedVariant) {
                    Alert.alert('提示', '请选择商品款式');
                    return;
                  }
                  doAddToCart();
                }}>
                  <Text style={styles.specAddCartText}>加入购物车</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.specBuyBtn} onPress={() => {
                  if (!selectedVariant) {
                    Alert.alert('提示', '请选择商品款式');
                    return;
                  }
                  handlePlaceOrder();
                }}>
                  <Text style={styles.specBuyText}>立即支付</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

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
                  ¥{selectedVariant ? (selectedVariant.salePrice * quantity).toFixed(2) : '0.00'}
                </Text>
              </View>
              
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodLabel}>支付方式</Text>
                <View style={styles.paymentMethodSelected}>
                  {paymentMethod === 'wechat' ? (
                    <>
                      <Svg width={24} height={24} viewBox="0 0 1024 1024">
                        <Path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.645697 2.038838-26.647917-122.810719-159.358451-214.077735-310.826188-214.077735-169.353083 0-308.085774 114.232319-308.085774 259.275068 0 83.708724 46.165736 152.460344 123.281791 205.78483L182.451786 683.690128l89.894635-44.400192c32.220644 10.627588 58.062546 15.614157 90.28319 15.614157 8.517086 0 16.911752-0.462665 25.204062-1.156192-5.310746-18.110632-8.182896-37.024855-8.182896-56.522981C379.650774 464.018958 505.588728 368.541681 664.250054 368.541681zM498.62897 285.87389c21.676438 0 36.035595 14.098699 36.035595 35.452842 0 21.275909-14.359157 35.539696-36.035595 35.539696-21.554886 0-43.118606-14.263787-43.118606-35.539696C455.510364 299.972589 477.074084 285.87389 498.62897 285.87389zM246.61369 356.866428c-21.554886 0-43.230468-14.263787-43.230468-35.539696 0-21.354143 21.675582-35.452842 43.230468-35.452842 21.554886 0 35.914043 14.098699 35.914043 35.452842C282.527733 342.602641 268.168576 356.866428 246.61369 356.866428zM945.448458 606.151333c0-121.777244-123.349039-220.866049-262.052288-220.866049-146.63549 0-262.354464 99.088805-262.354464 220.866049 0 121.911732 115.718974 220.866049 262.354464 220.866049 30.631817 0 61.263635-7.564545 91.782195-15.130117l83.925612 45.537092-22.945508-76.069588C899.651753 743.193134 945.448458 677.406468 945.448458 606.151333zM622.698472 570.576082c-14.359157 0-28.718314-14.098699-28.718314-28.523871 0-14.358131 14.359157-28.641175 28.718314-28.641175 21.676438 0 35.914043 14.283044 35.914043 28.641175C658.612515 556.477383 644.37491 570.576082 622.698472 570.576082zM745.792243 570.576082c-14.237605 0-28.596762-14.098699-28.596762-28.523871 0-14.358131 14.359157-28.641175 28.596762-28.641175 21.554886 0 35.914043 14.283044 35.914043 28.641175C781.706286 556.477383 767.347129 570.576082 745.792243 570.576082z" fill="#07C160"/>
                      </Svg>
                      <Text style={styles.paymentMethodName}>微信支付</Text>
                    </>
                  ) : (
                    <>
                      <Svg width={24} height={24} viewBox="0 0 1024 1024">
                        <Path d="M925.3 384.8c-21.8-51.3-53.1-97.4-93-137.2-39.9-39.9-85.9-71.2-137.2-93-53.3-22.7-109.9-34.2-168.2-34.2-58.3 0-114.9 11.5-168.2 34.2-51.3 21.8-97.4 53.1-137.2 93-39.9 39.9-71.2 85.9-93 137.2-22.7 53.3-34.2 109.9-34.2 168.2 0 58.3 11.5 114.9 34.2 168.2 21.8 51.3 53.1 97.4 93 137.2 39.9 39.9 85.9 71.2 137.2 93 53.3 22.7 109.9 34.2 168.2 34.2 58.3 0 114.9-11.5 168.2-34.2 51.3-21.8 97.4-53.1 137.2-93 39.9-39.9 71.2-85.9 93-137.2 22.7-53.3 34.2-109.9 34.2-168.2 0-58.3-11.5-114.9-34.2-168.2z m-366.2 447.5c-154.4 0-279.5-125.1-279.5-279.5S404.7 273.3 559.1 273.3s279.5 125.1 279.5 279.5-125.1 279.5-279.5 279.5z" fill="#1677FF"/>
                        <Path d="M704.4 545.8c-13.8-6.2-30.6-13.8-48.8-22.2 10.8-19.4 19.6-40.8 25.8-63.8h-57.6v-23.4h70.2v-16.2h-70.2v-38.4h-30c-3.8 0-6.8 3-6.8 6.8v31.6h-72v16.2h72v23.4h-60v16.2h102.6c-4.2 13.8-9.6 26.6-16.2 38.4-34.8-13.8-70.8-24.6-94.2-24.6-42 0-69.6 22.2-69.6 54.6 0 35.4 31.8 57.6 78 57.6 34.2 0 66-14.4 93-39.6 30.6 16.2 68.4 35.4 97.8 52.2l14-27.2z m-202.2 8.4c-28.8 0-45-11.4-45-30 0-16.8 14.4-27.6 37.8-27.6 16.2 0 38.4 6.6 63 17.4-20.4 25.2-41.4 40.2-55.8 40.2z" fill="#1677FF"/>
                      </Svg>
                      <Text style={styles.paymentMethodName}>支付宝</Text>
                    </>
                  )}
                </View>
              </View>
              
              {pendingOrderNo && (
                <View style={styles.paymentOrderInfo}>
                  <Text style={styles.paymentOrderLabel}>订单编号</Text>
                  <Text style={styles.paymentOrderNo}>{pendingOrderNo}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
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
  scrollView: {
    flex: 1,
  },
  imageCarousel: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: '#fff',
  },
  carouselImage: {
    width: screenWidth,
    height: screenWidth,
  },
  imageIndicator: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF6B6B',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priceSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceSymbol: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 28,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
    marginBottom: 4,
  },
  salesInfo: {
    flexDirection: 'row',
    marginTop: 8,
  },
  salesText: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  stockText: {
    fontSize: 12,
    color: '#666',
  },
  titleSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  productDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
  },
  shopInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shopInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopInfoLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  shopInfoLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shopInfoLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopInfoText: {
    flex: 1,
  },
  shopInfoName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  shopInfoDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  shopInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopInfoEnter: {
    fontSize: 13,
    color: '#999',
    marginRight: 4,
  },
  specSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  specLabel: {
    fontSize: 14,
    color: '#999',
    width: 40,
  },
  specValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginHorizontal: 10,
  },
  serviceSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  serviceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  variantsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantItem: {
    width: '48%',
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginRight: '4%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  variantItemActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  variantImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  variantInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  variantName: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  variantStock: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPlaceholder: {
    height: 80,
  },
  relatedActivitiesSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  relatedActivitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  relatedActivitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreBtnText: {
    fontSize: 13,
    color: '#999',
    marginRight: 2,
  },
  activitiesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  activitiesEmptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  activitiesEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  activityContent: {
    flex: 1,
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
    backgroundColor: '#e0e0e0',
  },
  activityAuthorName: {
    fontSize: 12,
    color: '#666',
  },
  activityStats: {
    flexDirection: 'row',
  },
  activityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  activityStatText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 3,
  },
  activityImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  bottomRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addCartButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  addCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  specModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  // 地址选择区域
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  addressIcon: {
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  specModalHeader: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specModalImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  specModalThumb: {
    width: 100,
    height: 100,
  },
  specModalInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  specModalPrice: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  specModalStock: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  specModalSelected: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  closeButton: {
    padding: 5,
  },
  specModalBody: {
    padding: 15,
    maxHeight: 300,
  },
  specModalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  specOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  specOptionActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  specOptionDisabled: {
    borderColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  specOptionText: {
    fontSize: 13,
    color: '#333',
  },
  specOptionTextActive: {
    color: '#FF6B6B',
  },
  specOptionTextDisabled: {
    color: '#999',
  },
  quantitySection: {
    marginTop: 15,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  quantityBtnDisabled: {
    borderColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  quantityBtnText: {
    fontSize: 18,
    color: '#333',
  },
  quantityText: {
    width: 50,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 14,
    color: '#333',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  specModalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  specAddCartBtn: {
    flex: 1,
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  specAddCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  specBuyBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  specBuyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // 购买弹窗
  buyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  buyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  buyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  buyModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  buyModalLabel: {
    fontSize: 14,
    color: '#666',
  },
  buyModalValue: {
    fontSize: 14,
    color: '#333',
  },
  buyModalTotal: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  buyModalTotalPrice: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  buyModalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  buyModalCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  buyModalCancelText: {
    fontSize: 15,
    color: '#666',
  },
  buyModalConfirm: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  buyModalConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 15,
  },
  paymentOptions: {
    flexDirection: 'row',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
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
  paymentMethodInfo: {
    marginBottom: 15,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  paymentMethodSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  paymentMethodName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
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
});

export default ShopDetail;
