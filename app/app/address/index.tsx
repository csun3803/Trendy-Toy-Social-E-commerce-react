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
import { router } from 'expo-router';
import type { UserAddress } from '../../types';
import { getUserAddresses, deleteAddress } from '../../services/addressService';
import { getUserIdFromToken } from '../../utils/jwtHelper';

const AddressIndex = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

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
              await deleteAddress(addressId);
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
          <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
              fill="#3C3C3C"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>收货地址</Text>
        <TouchableOpacity style={styles.headerRight} onPress={handleAddAddress}>
          <Text style={styles.addText}>新增地址</Text>
        </TouchableOpacity>
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
                style={styles.addressItem}
              >
                <View style={styles.addressContent}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.recipientName}>{address.recipientName}</Text>
                    <Text style={styles.recipientPhone}>{address.recipientPhone}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultTagText}>默认</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressDetail} numberOfLines={2}>
                    {address.fullAddress || `${address.province}${address.city}${address.district}${address.detailAddress}`}
                  </Text>
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleEditAddress(address.addressId)}
                  >
                    <Svg width={16} height={16} viewBox="0 0 1024 1024">
                      <Path d="M884 278.6l-60.2-60.2c-12.5-12.5-32.8-12.5-45.3 0L525.6 471.3l-60.2 60.2c-3.1 3.1-3.1 8.2 0 11.3l49.5 49.5c3.1 3.1 8.2 3.1 11.3 0l60.2-60.2 253.2-253.2c12.5-12.4 12.5-32.7 0-45.3zM417.8 640.2c-3.1-3.1-8.2-3.1-11.3 0l-49.5 49.5c-3.1 3.1-3.1 8.2 0 11.3l49.5 49.5c3.1 3.1 8.2 3.1 11.3 0l49.5-49.5c3.1-3.1 3.1-8.2 0-11.3l-49.5-49.5z" fill="#666"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={styles.bottomHint}>
              <Text style={styles.bottomHintText}>到底啦</Text>
            </View>
          </>
        )}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    padding: 5,
  },
  addText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
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
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  addressContent: {
    flex: 1,
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
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
  defaultTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 12,
    color: '#fff',
  },
  addressDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
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
  bottomHint: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bottomHintText: {
    fontSize: 14,
    color: '#999',
  },
});

export default AddressIndex;
