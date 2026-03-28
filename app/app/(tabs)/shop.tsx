import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSaleSeriesList } from '../../services/saleSeriesService';
import { getCartList, updateCartItem, removeCartItem, selectAllItems, removeSelectedItems } from '../../services/cartService';
import type { SaleSeriesItem, CartItem } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;

const Shop = () => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'cart'>('recommend');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seriesList, setSeriesList] = useState<SaleSeriesItem[]>([]);
  const [page, setPage] = useState(1);
  const searchTimer = useRef<number | null>(null);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
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

  const fetchSaleSeriesData = async (isLoadMore = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await getSaleSeriesList({
        page: isLoadMore ? page + 1 : 1,
        size: 12,
        keyword: searchKeyword
      });

      const responseData = response.data as any;
      const seriesData = (responseData.records || responseData.list || responseData.items || []).map((item: any) => {
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
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });

      if (isLoadMore) {
        setSeriesList(prev => [...prev, ...seriesData]);
        setPage(prev => prev + 1);
        const newLength = seriesList.length + seriesData.length;
        const total = responseData.total || responseData.count || 0;
        setHasMore(newLength < total);
      } else {
        setSeriesList(seriesData);
        setPage(1);
        const total = responseData.total || responseData.count || 0;
        setHasMore(seriesData.length < total);
      }
    } catch (error) {
      console.error('获取销售系列数据失败:', error);
      loadMockSeriesData(searchKeyword);
    } finally {
      setLoading(false);
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
          category: '盲盒'
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
          category: '盲盒'
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
    router.push('/checkout');
  };

  const handleSearchInput = (text: string) => {
    setSearchKeyword(text);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchSaleSeriesData(true);
    }
  };

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

  useEffect(() => {
    if (activeTab === 'recommend') {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      setPage(1);
      fetchSaleSeriesData(false);
    }
  }, [searchKeyword, activeTab]);

  const leftColumnItems = seriesList.filter((_, index) => index % 2 === 0);
  const rightColumnItems = seriesList.filter((_, index) => index % 2 === 1);

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
      <View key={item.cartItemId} style={styles.cartItem}>
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
        />
        
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>{snapshot.name || '未知商品'}</Text>
          <Text style={styles.cartItemBrand}>{snapshot.brand || ''}</Text>
          <Text style={styles.cartItemSku}>SKU: {snapshot.sku || ''}</Text>
          
          <View style={styles.cartItemBottom}>
            <Text style={styles.cartItemPrice}>¥{(snapshot.price || 0).toFixed(2)}</Text>
            
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
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleRemoveItem(item.cartItemId)}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path 
              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" 
              fill="#999"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommend' && styles.activeTab]}
          onPress={() => setActiveTab('recommend')}
        >
          <Text style={[styles.tabText, activeTab === 'recommend' && styles.activeTabText]}>推荐</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.activeTab]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[styles.tabText, activeTab === 'cart' && styles.activeTabText]}>购物车</Text>
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'recommend' && (
        <ScrollView style={styles.content}>
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
                    />
                    <View style={styles.seriesInfo}>
                      <Text style={styles.seriesName} numberOfLines={2}>{item.saleTitle}</Text>
                      <Text style={styles.seriesDesc} numberOfLines={1}>{item.saleDescription}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>¥{item.variantCount > 0 ? '69.00起' : '暂无价格'}</Text>
                      </View>
                      <View style={styles.seriesMeta}>
                        <Text style={styles.metaText}>已售 {item.totalSales || 0}</Text>
                        <Text style={styles.variantCount}>{item.variantCount}个款式</Text>
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
                    />
                    <View style={styles.seriesInfo}>
                      <Text style={styles.seriesName} numberOfLines={2}>{item.saleTitle}</Text>
                      <Text style={styles.seriesDesc} numberOfLines={1}>{item.saleDescription}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>¥{item.variantCount > 0 ? '69.00起' : '暂无价格'}</Text>
                      </View>
                      <View style={styles.seriesMeta}>
                        <Text style={styles.metaText}>已售 {item.totalSales || 0}</Text>
                        <Text style={styles.variantCount}>{item.variantCount}个款式</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {hasMore && seriesList.length > 0 && (
              <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
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
              <ScrollView style={styles.cartList}>
                <View style={styles.cartHeader}>
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
                  <TouchableOpacity onPress={handleRemoveSelected}>
                    <Text style={styles.deleteSelectedText}>删除选中</Text>
                  </TouchableOpacity>
                </View>
                
                {cartItems.map(renderCartItem)}
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
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8069E1',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#8069E1',
    fontWeight: 'bold',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 30,
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
    paddingVertical: 8,
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
    paddingHorizontal: 15,
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
