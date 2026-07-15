import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSaleSeriesList } from '../../services/saleSeriesService';
import { getCartList, updateCartItem, removeCartItem, selectAllItems, removeSelectedItems } from '../../services/cartService';
import type { SaleSeriesItem, CartItem } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}

const Shop = () => {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'recommend' | 'cart'>(params.tab === 'cart' ? 'cart' : 'recommend');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seriesList, setSeriesList] = useState<SaleSeriesItem[]>([]);
  const [page, setPage] = useState(1);
  const searchTimer = useRef<number | null>(null);
  const scrollTimer = useRef<number | null>(null);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    };
    loadUserId();
  }, []);

  const fetchSaleSeriesData = async (isLoadMore = false, isRefresh = false) => {
    if (loading && !isRefresh) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getSaleSeriesList({
        page: isLoadMore ? page + 1 : 1,
        size: 12,
        keyword: searchKeyword
      });

      const responseData = response.data as any;
      // 获取数据数组 - 支持多种格式
      let dataArray: any[] = [];
      if (Array.isArray(responseData)) {
        dataArray = responseData;
      } else if (Array.isArray(responseData.data)) {
        dataArray = responseData.data;
      } else if (Array.isArray(responseData.records)) {
        dataArray = responseData.records;
      } else if (Array.isArray(responseData.list)) {
        dataArray = responseData.list;
      } else if (Array.isArray(responseData.items)) {
        dataArray = responseData.items;
      }
      
      const seriesData = dataArray.map((item: any) => {
        let coverImage = '';
        try {
          const coverImages = JSON.parse(item.saleCoverImage || '[]');
          if (Array.isArray(coverImages) && coverImages.length > 0) {
            coverImage = coverImages[0];
            if (coverImage && !coverImage.startsWith('http')) {
              coverImage = `${BASE_URL}${coverImage}`;
            }
          }
        } catch (e) {
          coverImage = item.saleCoverImage || '';
          if (coverImage && !coverImage.startsWith('http')) {
            coverImage = `${BASE_URL}${coverImage}`;
          }
        }

        return {
          saleSeriesId: item.saleSeriesId,
          shopId: item.shopId,
          seriesId: item.seriesId,
          saleTitle: item.saleTitle,
          saleDescription: item.saleDescription,
          saleCoverImage: coverImage,
          saleStatus: item.saleStatus,
          variantCount: item.variantCount || 0,
          totalSales: item.totalSales || 0,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          shopName: item.shopName
        };
      });

      if (isLoadMore) {
        setSeriesList(prev => [...prev, ...seriesData]);
        setPage(prev => prev + 1);
        const newLength = seriesList.length + seriesData.length;
        // 获取total值 - 支持多种格式
        let total = 0;
        if (typeof responseData.total === 'number') {
          total = responseData.total;
        } else if (typeof responseData.count === 'number') {
          total = responseData.count;
        } else if (responseData.data && typeof responseData.data.total === 'number') {
          total = responseData.data.total;
        }
        setHasMore(newLength < total);
      } else {
        setSeriesList(seriesData);
        setPage(1);
        // 获取total值 - 支持多种格式
        let total = 0;
        if (typeof responseData.total === 'number') {
          total = responseData.total;
        } else if (typeof responseData.count === 'number') {
          total = responseData.count;
        } else if (responseData.data && typeof responseData.data.total === 'number') {
          total = responseData.data.total;
        }
        setHasMore(seriesData.length < total);
      }
    } catch (error) {
      console.error('获取销售系列数据失败:', error);
      loadMockSeriesData(searchKeyword);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMockSeriesData = (keyword: string = '') => {
    const mockSeries: SaleSeriesItem[] = [
      {
        saleSeriesId: 'series_001',
        shopId: 'shop_001',
        seriesId: 'orig_001',
        saleTitle: 'SKULLPANDA温度系列盲盒',
        saleDescription: 'SKULLPANDA温度系列，包含12款常规款+1款隐藏款',
        saleCoverImage: require('../../assets/images/shop/popmart/warmth/1.jpg'),
        saleStatus: 'ON_SALE',
        variantCount: 13,
        totalSales: 15234,
        minPrice: 59.0,
        maxPrice: 699.0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        saleSeriesId: 'series_002',
        shopId: 'shop_001',
        seriesId: 'orig_002',
        saleTitle: 'DIMOO梦境系列盲盒',
        saleDescription: 'DIMOO梦境系列，带你进入奇幻梦境世界',
        saleCoverImage: require('../../assets/images/shop/popmart/warmth/2.jpg'),
        saleStatus: 'ON_SALE',
        variantCount: 12,
        totalSales: 8921,
        minPrice: 69.0,
        maxPrice: 899.0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ];
    
    const filteredSeries = keyword
      ? mockSeries.filter(item => 
          item.saleTitle.toLowerCase().includes(keyword.toLowerCase()) ||
          item.saleDescription.toLowerCase().includes(keyword.toLowerCase())
        )
      : mockSeries;
    
    setSeriesList(filteredSeries);
    setHasMore(false);
  };

  const fetchCartData = async () => {
    console.log('[购物车调试] 开始获取购物车数据');
    console.log('[购物车调试] userId:', userId);
    
    if (!userId) {
      console.log('[购物车调试] userId 为空，加载模拟数据');
      loadMockCartData();
      return;
    }
    
    setCartLoading(true);
    try {
      console.log('[购物车调试] 调用 getCartList API...');
      const response = await getCartList(userId);
      console.log('[购物车调试] API 响应:', response);
      
      const responseData = response.data as any;
      console.log('[购物车调试] responseData:', responseData);
      
      let items = [];
      if (Array.isArray(responseData)) {
        items = responseData;
      } else {
        items = responseData.records || responseData.list || responseData.items || [];
      }
      console.log('[购物车调试] 解析后的 items:', items);
      console.log('[购物车调试] items 数量:', items.length);
      
      setCartItems(items);
      updateAllSelectedStatus(items);
    } catch (error) {
      console.error('[购物车调试] 获取购物车数据失败:', error);
      console.error('[购物车调试] 错误详情:', JSON.stringify(error));
      loadMockCartData();
    } finally {
      setCartLoading(false);
    }
  };

  const loadMockCartData = () => {
    const mockCartItems: CartItem[] = [
      {
        cartItemId: 'cart_001',
        userId: 'user_001',
        shopId: 'shop_001',
        saleSeriesId: 'sale_series_001',
        saleVariantId: 'sale_var_003',
        variantId: 'prod_0303',
        productSnapshot: {
          sku: 'SK-WARM-03',
          name: 'SKULLPANDA温度系列 - 自惬意',
          brand: '泡泡玛特',
          image: '/images/shop/popmart/warmth/3.jpg',
          price: 69.00,
          category: '盲盒',
          shopName: '泡泡玛特官方店',
          saleSeriesName: 'SKULLPANDA温度系列',
          variantName: '自惬意'
        },
        quantity: 1,
        isSelected: true,
        addedAt: '2026-03-15 10:30:00',
        updatedAt: '2026-03-19 13:50:59',
        expireAt: '2026-04-14 10:30:00',
        sourceType: 'manual',
        sourceId: ''
      },
      {
        cartItemId: 'cart_002',
        userId: 'user_001',
        shopId: 'shop_001',
        saleSeriesId: 'sale_series_001',
        saleVariantId: 'sale_var_005',
        variantId: 'prod_0305',
        productSnapshot: {
          sku: 'SK-WARM-05',
          name: 'SKULLPANDA温度系列 - 暖洋洋',
          brand: '泡泡玛特',
          image: '/images/shop/popmart/warmth/5.jpg',
          price: 69.00,
          category: '盲盒',
          shopName: '泡泡玛特官方店',
          saleSeriesName: 'SKULLPANDA温度系列',
          variantName: '暖洋洋'
        },
        quantity: 2,
        isSelected: false,
        addedAt: '2026-03-16 14:20:00',
        updatedAt: '2026-03-19 10:00:00',
        expireAt: '2026-04-15 14:20:00',
        sourceType: 'manual',
        sourceId: ''
      }
    ];
    setCartItems(mockCartItems);
    updateAllSelectedStatus(mockCartItems);
  };

  const updateAllSelectedStatus = (items: CartItem[]) => {
    if (items.length === 0) {
      setIsAllSelected(false);
    } else {
      setIsAllSelected(items.every(item => item.isSelected));
    }
  };

  const handleSelectItem = async (cartItemId: string, isSelected: boolean) => {
    const updatedItems = cartItems.map(item => 
      item.cartItemId === cartItemId ? { ...item, isSelected } : item
    );
    setCartItems(updatedItems);
    updateAllSelectedStatus(updatedItems);

    if (userId) {
      try {
        await updateCartItem({ cartItemId, isSelected });
      } catch (error) {
        console.error('更新选中状态失败:', error);
      }
    }
  };

  const handleSelectAll = async () => {
    const newSelectedState = !isAllSelected;
    const updatedItems = cartItems.map(item => ({ ...item, isSelected: newSelectedState }));
    setCartItems(updatedItems);
    setIsAllSelected(newSelectedState);

    if (userId) {
      try {
        await selectAllItems(userId, newSelectedState);
      } catch (error) {
        console.error('全选操作失败:', error);
      }
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = cartItems.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);

    if (userId) {
      try {
        await updateCartItem({ cartItemId, quantity: newQuantity });
      } catch (error) {
        console.error('更新数量失败:', error);
      }
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除该商品吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: async () => {
            const updatedItems = cartItems.filter(item => item.cartItemId !== cartItemId);
            setCartItems(updatedItems);
            updateAllSelectedStatus(updatedItems);

            if (userId) {
              try {
                await removeCartItem(cartItemId);
              } catch (error) {
                console.error('删除商品失败:', error);
              }
            }
          }
        }
      ]
    );
  };

  const handleRemoveSelected = () => {
    const selectedItems = cartItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      Alert.alert('提示', '请先选择要删除的商品');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除选中的 ${selectedItems.length} 件商品吗？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: async () => {
            const updatedItems = cartItems.filter(item => !item.isSelected);
            setCartItems(updatedItems);
            updateAllSelectedStatus(updatedItems);

            if (userId) {
              try {
                await removeSelectedItems(userId);
              } catch (error) {
                console.error('删除选中商品失败:', error);
              }
            }
          }
        }
      ]
    );
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => item.isSelected)
      .reduce((total, item) => {
        let snapshot = item.productSnapshot;
        if (typeof snapshot === 'string') {
          try {
            snapshot = JSON.parse(snapshot);
          } catch (e) {
            return total;
          }
        }
        return total + (snapshot.price || 0) * item.quantity;
      }, 0);
  };

  const calculateSelectedCount = () => {
    return cartItems.filter(item => item.isSelected).length;
  };

  const handleCheckout = () => {
    const selectedItems = cartItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      Alert.alert('提示', '请先选择要结算的商品');
      return;
    }
    // 准备要传递的数据 - 包含完整信息
    const checkoutData = selectedItems.map(item => ({
      cartItemId: item.cartItemId,
      shopId: item.shopId,
      saleSeriesId: item.saleSeriesId,
      saleVariantId: item.saleVariantId,
      quantity: item.quantity,
      productSnapshot: item.productSnapshot
    }));
    router.push({
      pathname: '/checkout',
      params: { items: JSON.stringify(checkoutData) }
    });
  };

  const handleSearchInput = (text: string) => {
    setSearchKeyword(text);
    
    if (activeTab === 'recommend') {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      
      searchTimer.current = setTimeout(() => {
        setPage(1);
        fetchSaleSeriesData(false);
      }, 500);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchSaleSeriesData(true);
    }
  };

  // 使用节流包装的 loadMore 函数
  const throttledLoadMore = useRef(throttle(loadMore, 300)).current;

  // 滚动事件处理（带节流）
  const handleScroll = (event: any) => {
    if (!hasMore || loading || refreshing) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isNearBottom) {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      scrollTimer.current = setTimeout(() => {
        throttledLoadMore();
      }, 200);
    }
  };

  const onRefresh = useCallback(() => {
    if (activeTab === 'recommend') {
      fetchSaleSeriesData(false, true);
    } else if (activeTab === 'cart') {
      setRefreshing(true);
      fetchCartData().finally(() => {
        setRefreshing(false);
      });
    }
  }, [activeTab]);

  const goToSeriesDetail = (saleSeriesId: string) => {
    router.push(`/shop/${saleSeriesId}`);
  };

  useEffect(() => {
    if (activeTab === 'recommend') {
      fetchSaleSeriesData();
    } else if (activeTab === 'cart') {
      fetchCartData();
    }
  }, [activeTab, userId]);

  // 清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, []);

  const leftColumnItems = seriesList.filter((_, index) => index % 2 === 0);
  const rightColumnItems = seriesList.filter((_, index) => index % 2 === 1);

  // 将购物车项按店铺分组
  const groupCartItemsByShop = () => {
    const grouped: { [key: string]: { shopName: string; items: CartItem[] } } = {};
    
    cartItems.forEach(item => {
      let snapshot = item.productSnapshot;
      if (typeof snapshot === 'string') {
        try {
          snapshot = JSON.parse(snapshot);
        } catch (e) {
          snapshot = { name: '未知商品' };
        }
      }
      
      const shopId = item.shopId || 'unknown';
      const shopName = snapshot.shopName || '未知店铺';
      
      if (!grouped[shopId]) {
        grouped[shopId] = { shopName, items: [] };
      }
      grouped[shopId].items.push(item);
    });
    
    return grouped;
  };

  // 检查某个店铺的所有商品是否都被选中
  const isShopAllSelected = (items: CartItem[]) => {
    return items.length > 0 && items.every(item => item.isSelected);
  };

  // 切换某个店铺的所有商品选中状态
  const toggleShopAllSelected = (items: CartItem[]) => {
    const isAllSelected = isShopAllSelected(items);
    items.forEach(item => {
      handleSelectItem(item.cartItemId, !isAllSelected);
    });
  };

  const renderCartItem = (item: CartItem) => {
    let snapshot = item.productSnapshot;
    if (typeof snapshot === 'string') {
      try {
        snapshot = JSON.parse(snapshot);
      } catch (e) {
        console.error('[购物车] 解析 productSnapshot 失败:', e);
        snapshot = { name: '未知商品', image: '', price: 0 };
      }
    }
    
    const imageUrl = snapshot.image && snapshot.image.startsWith('http') 
      ? snapshot.image 
      : `${BASE_URL}${snapshot.image || ''}`;
    
    return (
      <View key={item.cartItemId} style={[styles.cartItem, isEditing && styles.cartItemEditing]}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.cartItemId, !item.isSelected)}
        >
          <View style={[styles.checkboxInner, item.isSelected && styles.checkboxSelected]}>
            {item.isSelected && (
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff" />
              </Svg>
            )}
          </View>
        </TouchableOpacity>
        
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.cartItemImage}
          resizeMode="cover"
          contentFit="cover"
          transition={200}
          placeholder="#f5f5f5"
          cachePolicy="memory-disk"
        />
        
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>{snapshot.name || '未知商品'}</Text>
          
          {snapshot.saleSeriesName && (
            <Text style={styles.saleSeriesName}>{snapshot.saleSeriesName}</Text>
          )}
          
          {snapshot.variantName && (
            <Text style={styles.variantName}>款式: {snapshot.variantName}</Text>
          )}
          
          <Text style={styles.cartItemSku}>SKU: {snapshot.sku || ''}</Text>
          
          <View style={styles.cartItemBottom}>
            <Text style={styles.cartItemPrice}>¥{(snapshot.price || 0).toFixed(2)}</Text>
            
            {!isEditing && (
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.quantityBtn}
                  onPress={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityBtn}
                  onPress={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteBtnEditing}
            onPress={() => handleRemoveItem(item.cartItemId)}
          >
            <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M519.620465 0c-103.924093 0-188.511256 82.467721-192.083349 185.820279H85.015814A48.91386 48.91386 0 0 0 36.101953 234.686512a48.91386 48.91386 0 0 0 48.913861 48.866232h54.010046V831.345116c0 102.852465 69.822512 186.844279 155.909954 186.844279h439.200744c86.087442 0 155.909953-83.491721 155.909954-186.844279V284.100465h48.91386a48.91386 48.91386 0 0 0 48.913861-48.890046 48.91386 48.91386 0 0 0-48.913861-48.866233h-227.756651A191.559442 191.559442 0 0 0 519.620465 0z m-107.234232 177.080558c3.548279-49.771163 46.627721-88.540279 99.851907-88.540279 53.224186 0 96.327442 38.745302 99.351813 88.540279h-199.20372z m-111.997024 752.044651c-30.981953 0-65.083535-39.15014-65.083535-95.041488V287.744h575.488v546.839814c0 55.915163-34.077767 95.041488-65.059721 95.041488H300.389209v-0.500093z"
                fill="#D81E06"
              />
              <Path
                d="M368.116093 796.814884c24.361674 0 44.27014-21.670698 44.27014-48.818605v-278.623256c0-27.147907-19.908465-48.818605-44.27014-48.818604-24.33786 0-44.27014 21.670698-44.27014 48.818604v278.623256c0 27.147907 19.360744 48.818605 44.293954 48.818605z m154.933581 0c24.361674 0 44.293953-21.670698 44.293954-48.818605v-278.623256c0-27.147907-19.932279-48.818605-44.293954-48.818604-24.33786 0-44.27014 21.670698-44.270139 48.818604v278.623256c0 27.147907 19.932279 48.818605 44.293953 48.818605z m132.810419 0c24.33786 0 44.27014-21.670698 44.27014-48.818605v-278.623256c0-27.147907-19.932279-48.818605-44.27014-48.818604s-44.27014 21.670698-44.27014 48.818604v278.623256c0 27.147907 19.360744 48.818605 44.27014 48.818605z"
                fill="#D81E06"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 渲染一个店铺的购物车项
  const renderShopGroup = (shopId: string, shopName: string, items: CartItem[]) => {
    const isShopSelected = isShopAllSelected(items);
    
    return (
      <View key={shopId} style={styles.shopGroup}>
        <View style={styles.shopHeader}>
          <TouchableOpacity 
            style={styles.shopCheckboxContainer}
            onPress={() => toggleShopAllSelected(items)}
          >
            <View style={[styles.checkboxInner, isShopSelected && styles.checkboxSelected]}>
              {isShopSelected && (
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff" />
                </Svg>
              )}
            </View>
            <Text style={styles.shopHeaderName}>{shopName}</Text>
          </TouchableOpacity>
        </View>
        
        {items.map(renderCartItem)}
      </View>
    );
  };

  return (
    <View style={styles.page}>
      {/* 顶部导航栏 - 仅在推荐页显示 */}
      {activeTab === 'recommend' && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>商城</Text>
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => setActiveTab('cart')}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M733.090909 814.545455a58.181818 58.181818 0 1 1 0 116.363636 58.181818 58.181818 0 0 1 0-116.363636z m-442.181818 0a58.181818 58.181818 0 1 1 0 116.363636 58.181818 58.181818 0 0 1 0-116.363636zM91.229091 74.752c59.066182 9.937455 81.943273 42.496 98.257454 113.803636l589.568-2.001454a93.090909 93.090909 0 0 1 92.765091 104.168727l-47.429818 395.287273A93.090909 93.090909 0 0 1 731.927273 768h-439.156364a93.090909 93.090909 0 0 1-91.787636-77.591273L116.363636 188.858182c-8.797091-33.047273-16.616727-41.890909-36.701091-45.242182a34.909091 34.909091 0 1 1 11.589819-68.864z m688.081454 181.620364L200.424727 258.327273l3.863273 31.976727 65.559273 388.445091a23.272727 23.272727 0 0 0 20.154182 19.246545l2.792727 0.162909h439.156363a23.272727 23.272727 0 0 0 22.644364-17.850181l0.465455-2.653091 47.429818-395.264a23.272727 23.272727 0 0 0-20.48-25.902546l-2.699637-0.139636z m-336.128 231.051636l1.093819 3.188364c7.400727 25.320727 34.909091 44.520727 67.886545 44.520727 31.092364 0 57.413818-17.128727 66.466909-40.401455l1.210182-3.537454a34.909091 34.909091 0 1 1 66.792727 20.410182c-16.919273 55.365818-72.005818 93.323636-134.469818 93.323636-63.069091 0-118.551273-38.679273-134.912-94.789818a34.909091 34.909091 0 0 1 65.931636-22.714182z"
                fill="#333"
              />
            </Svg>
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'recommend' && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.recommendContent}>
            <View style={styles.search1}>
              <Svg width={20} height={20} viewBox="0 0 1026 1024">
                <Path 
                  d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
                  fill="rgba(0,0,0,0.7)" 
                />
              </Svg>
              <TextInput
                style={styles.search}
                placeholder="搜索销售系列、商品..."
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={searchKeyword}
                onChangeText={handleSearchInput}
                selectionColor="#8069E1"
                underlineColorAndroid="transparent"
              />
            </View>

            {/* 抽盒机入口 */}
            <TouchableOpacity
              style={styles.blindBoxBanner}
              onPress={() => router.push('/blind-box/')}
              activeOpacity={0.8}
            >
              <View style={styles.blindBoxBannerLeft}>
                <View style={styles.blindBoxBannerText}>
                  <Text style={styles.blindBoxBannerTitle}>在线抽盒机</Text>
                  <Text style={styles.blindBoxBannerDesc}>足不出户，体验拆盒乐趣</Text>
                </View>
              </View>
              <View style={styles.blindBoxBannerBtn}>
                <Text style={styles.blindBoxBannerBtnText}>去抽盒</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.waterfallContainer}>
              <View style={styles.waterfallColumn}>
                {leftColumnItems.map((item) => (
                  <TouchableOpacity
                    key={item.saleSeriesId}
                    style={styles.seriesItem}
                    onPress={() => goToSeriesDetail(item.saleSeriesId)}
                  >
                    <Image
                      source={typeof item.saleCoverImage === 'string' ? { uri: item.saleCoverImage } : item.saleCoverImage}
                      style={styles.seriesImage}
                      resizeMode="cover"
                      contentFit="cover"
                      transition={300}
                      placeholder="#f5f5f5"
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.seriesInfo}>
                      <Text style={styles.seriesName} numberOfLines={2}>{item.saleTitle}</Text>
                      <Text style={styles.seriesDesc} numberOfLines={1}>{item.saleDescription}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>
                          {item.minPrice ? `¥${item.minPrice.toFixed(2)}起` : (item.variantCount > 0 ? '暂无价格' : '暂无价格')}
                        </Text>
                      </View>
                      <View style={styles.seriesMeta}>
                        <TouchableOpacity onPress={() => router.push(`/shop-home/${item.shopId}` as any)} style={styles.shopNameLink}>
                          <Text style={styles.shopNameText} numberOfLines={1}>{item.shopName || '未知店铺'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.metaText}>已售 {item.totalSales || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.waterfallColumn}>
                {rightColumnItems.map((item) => (
                  <TouchableOpacity
                    key={item.saleSeriesId}
                    style={styles.seriesItem}
                    onPress={() => goToSeriesDetail(item.saleSeriesId)}
                  >
                    <Image
                      source={typeof item.saleCoverImage === 'string' ? { uri: item.saleCoverImage } : item.saleCoverImage}
                      style={styles.seriesImage}
                      resizeMode="cover"
                      contentFit="cover"
                      transition={300}
                      placeholder="#f5f5f5"
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.seriesInfo}>
                      <Text style={styles.seriesName} numberOfLines={2}>{item.saleTitle}</Text>
                      <Text style={styles.seriesDesc} numberOfLines={1}>{item.saleDescription}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>
                          {item.minPrice ? `¥${item.minPrice.toFixed(2)}起` : (item.variantCount > 0 ? '暂无价格' : '暂无价格')}
                        </Text>
                      </View>
                      <View style={styles.seriesMeta}>
                        <TouchableOpacity onPress={() => router.push(`/shop-home/${item.shopId}` as any)} style={styles.shopNameLink}>
                          <Text style={styles.shopNameText} numberOfLines={1}>{item.shopName || '未知店铺'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.metaText}>已售 {item.totalSales || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {hasMore && seriesList.length > 0 && (
              <TouchableOpacity style={styles.loadMore} onPress={throttledLoadMore}>
                {loading ? (
                  <ActivityIndicator color="#666" />
                ) : (
                  <Text style={styles.loadMoreText}>点击加载更多</Text>
                )}
              </TouchableOpacity>
            )}

            {!hasMore && seriesList.length > 0 && (
              <View style={styles.noMore}>
                <Text style={styles.noMoreText}>没有更多了</Text>
              </View>
            )}

            {seriesList.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{searchKeyword ? '暂无搜索结果' : '暂无系列数据'}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'cart' && (
        <View style={styles.cartContent}>
          {/* 购物车顶部栏 */}
          <View style={styles.cartHeaderBar}>
            <TouchableOpacity style={styles.cartBackBtn} onPress={() => setActiveTab('recommend')}>
              <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
                <Path
                  d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                  fill="#333"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.cartHeaderTitle}>购物车</Text>
            <View style={{ width: 30 }} />
          </View>
          {cartLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8069E1" />
            </View>
          ) : cartItems.length === 0 ? (
            <View style={styles.emptyCartContainer}>
              <Svg width={80} height={80} viewBox="0 0 24 24">
                <Path 
                  d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" 
                  fill="#ccc"
                />
              </Svg>
              <Text style={styles.emptyCartText}>购物车是空的</Text>
              <TouchableOpacity 
                style={styles.goShoppingBtn}
                onPress={() => setActiveTab('recommend')}
              >
                <Text style={styles.goShoppingText}>去逛逛</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.cartList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
                }
              >
                <View style={styles.cartHeader}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                    <Text style={styles.deleteSelectedText}>{isEditing ? '完成' : '管理'}</Text>
                  </TouchableOpacity>
                </View>
                
                {Object.entries(groupCartItemsByShop()).map(([shopId, { shopName, items }]) => 
                  renderShopGroup(shopId, shopName, items)
                )}
              </ScrollView>
              
              <View style={styles.cartFooter}>
                <TouchableOpacity 
                  style={styles.selectAllContainer}
                  onPress={handleSelectAll}
                >
                  <View style={[styles.checkboxInner, isAllSelected && styles.checkboxSelected]}>
                    {isAllSelected && (
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff" />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.selectAllText}>全选</Text>
                </TouchableOpacity>
                
                {isEditing ? (
                  <>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity 
                      style={[
                        styles.checkoutBtn,
                        calculateSelectedCount() === 0 && styles.checkoutBtnDisabled,
                        { backgroundColor: calculateSelectedCount() === 0 ? '#ccc' : '#ff6b6b' }
                      ]}
                      onPress={handleRemoveSelected}
                      disabled={calculateSelectedCount() === 0}
                    >
                      <Text style={styles.checkoutBtnText}>
                        删除({calculateSelectedCount()})
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>合计: </Text>
                      <Text style={styles.totalPrice}>¥{calculateSelectedTotal().toFixed(2)}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.checkoutBtn,
                        calculateSelectedCount() === 0 && styles.checkoutBtnDisabled
                      ]}
                      onPress={handleCheckout}
                      disabled={calculateSelectedCount() === 0}
                    >
                      <Text style={styles.checkoutBtnText}>
                        结算({calculateSelectedCount()})
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartIconBtn: {
    position: 'absolute',
    right: 15,
    top: 50,
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  recommendContent: {
    flex: 1,
  },
  search1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 15,
    marginTop: 10,
  },
  search: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    outlineWidth: 0,
    outlineStyle: 'none',
    borderWidth: 0,
  },
  blindBoxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#8069E1',
    borderRadius: 14,
  },
  blindBoxBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blindBoxBannerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  blindBoxBannerText: {
    flex: 1,
  },
  blindBoxBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  blindBoxBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  blindBoxBannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  blindBoxBannerBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  waterfallContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: 15,
  },
  waterfallColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  seriesItem: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seriesImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  seriesInfo: {
    padding: 10,
  },
  seriesName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  seriesDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  priceContainer: {
    marginTop: 5,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  seriesMeta: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopNameLink: {
    maxWidth: '60%',
  },
  shopNameText: {
    fontSize: 11,
    color: '#8069E1',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  variantCount: {
    fontSize: 12,
    color: '#8069E1',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
  },
  noMore: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  noMoreText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  cartContent: {
    flex: 1,
  },
  cartHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartBackBtn: {
    padding: 5,
  },
  cartHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    marginBottom: 20,
  },
  goShoppingBtn: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goShoppingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartList: {
    flex: 1,
  },
  shopGroup: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  shopCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopHeaderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    padding: 5,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8069E1',
    borderColor: '#8069E1',
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  deleteSelectedText: {
    fontSize: 14,
    color: '#ff6b6b',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 10,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cartItemBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  shopNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  shopName: {
    fontSize: 12,
    color: '#8069E1',
    fontWeight: '500',
  },
  saleSeriesName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  variantName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cartItemSku: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityBtnText: {
    fontSize: 16,
    color: '#666',
  },
  quantityText: {
    width: 36,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  deleteBtn: {
    padding: 8,
  },
  cartItemEditing: {
    position: 'relative',
  },
  deleteBtnEditing: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    padding: 4,
  },
  cartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 15,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  checkoutBtn: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Shop;
