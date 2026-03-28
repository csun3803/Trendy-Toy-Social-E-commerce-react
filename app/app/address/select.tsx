import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import type { UserAddress } from '../../types';
import { getUserAddresses, deleteAddress } from '../../services/addressService';
import { getUserIdFromToken } from '../../utils/jwtHelper';

const AddressSelect: React.FC = () => {
  const params = useLocalSearchParams<{ selectedAddressId?: string }>();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    params.selectedAddressId || null
  );

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.back();
        return;
      }

      const response = await getUserAddresses(userId);
      
      if (response.data) {
        // 兼容不同的响应格式
        let addressList = [];
        if (response.data.code === 200 && response.data.data) {
          addressList = response.data.data;
        } else if (Array.isArray(response.data)) {
          addressList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          addressList = response.data.data;
        }
        
        setAddresses(addressList);
      }
    } catch (error) {
      console.error('获取地址列表失败');
      Alert.alert('错误', '获取地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddressId(address.addressId);
    // 返回上一页并传递选中的地址
    router.setParams({ selectedAddress: JSON.stringify(address) });
    router.back();
  };

  const handleAddAddress = () => {
    router.push('/address/edit');
  };

  const handleEditAddress = (addressId: string) => {
    router.push(`/address/edit?id=${addressId}`);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个地址吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAddress(addressId);
              // 重新获取地址列表
              await fetchAddresses();
            } catch (error) {
              console.error('删除地址失败');
              Alert.alert('错误', '删除地址失败，请稍后重试');
            }
          },
        },
      ],
      { cancelable: true }
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

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" fill="#333"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>选择收货地址</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 地址列表 */}
      <ScrollView style={styles.addressList}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无收货地址</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={handleAddAddress}>
              <Text style={styles.addFirstBtnText}>添加新地址</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {addresses.map((address) => (
              <View
                key={address.addressId}
                style={[
                  styles.addressItem,
                  selectedAddressId === address.addressId && styles.addressItemActive,
                ]}
              >
                <TouchableOpacity
                  style={styles.addressContent}
                  onPress={() => handleSelectAddress(address)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressHeader}>
                    <Text style={styles.recipientName}>{address.recipientName}</Text>
                    <Text style={styles.recipientPhone}>{address.recipientPhone}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultTagText}>默认</Text>
                      </View>
                    )}
                    {address.addressTag && (
                      <View style={styles.addressTag}>
                        <Text style={styles.addressTagText}>{address.addressTag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressDetail} numberOfLines={2}>
                    {address.fullAddress || `${address.province}${address.city}${address.district}${address.detailAddress}`}
                  </Text>
                  {selectedAddressId === address.addressId && (
                    <View style={styles.selectedIcon}>
                      <Svg width={20} height={20} viewBox="0 0 1024 1024">
                        <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292c-12.7 17.6-39 17.6-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" fill="#FF6B6B"/>
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleEditAddress(address.addressId)}
                  >
                    <Svg width={16} height={16} viewBox="0 0 1024 1024">
                      <Path d="M884 278.6l-60.2-60.2c-12.5-12.5-32.8-12.5-45.3 0L525.6 471.3l-60.2 60.2c-3.1 3.1-3.1 8.2 0 11.3l49.5 49.5c3.1 3.1 8.2 3.1 11.3 0l60.2-60.2 253.2-253.2c12.5-12.4 12.5-32.7 0-45.3zM417.8 640.2c-3.1-3.1-8.2-3.1-11.3 0l-49.5 49.5c-3.1 3.1-3.1 8.2 0 11.3l49.5 49.5c3.1 3.1 8.2 3.1 11.3 0l49.5-49.5c3.1-3.1 3.1-8.2 0-11.3l-49.5-49.5z" fill="#666"/>
                    </Svg>
                    <Text style={styles.actionBtnText}>编辑</Text>
                  </TouchableOpacity>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      handleDeleteAddress(address.addressId);
                    }}
                  >
                    <Svg width={16} height={16} viewBox="0 0 1024 1024">
                      <Path d="M352 144h320v32H352v-32zm-48 0h-80v32h80v-32zm144 512c0 35.3-28.7 64-64 64s-64-28.7-64-64v-128H224V112c0-8.8 7.2-16 16-16h320c8.8 0 16 7.2 16 16v320h-96v128zm0-192h96v-320H352v320z" fill="#ff4d4f"/>
                    </Svg>
                    <Text style={[styles.actionBtnText, { color: '#ff4d4f' }]}>删除</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddAddress}>
          <Svg width={20} height={20} viewBox="0 0 1024 1024">
            <Path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z" fill="#fff"/>
          </Svg>
          <Text style={styles.addBtnText}>添加新地址</Text>
        </TouchableOpacity>
      </View>
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
  addressList: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  addFirstBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFirstBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addressItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressContent: {
    marginBottom: 10,
  },
  addressItemActive: {
    borderColor: '#FF6B6B',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  recipientPhone: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  defaultTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  defaultTagText: {
    fontSize: 11,
    color: '#fff',
  },
  addressTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressTagText: {
    fontSize: 11,
    color: '#666',
  },
  addressDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  selectedIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddressSelect;
