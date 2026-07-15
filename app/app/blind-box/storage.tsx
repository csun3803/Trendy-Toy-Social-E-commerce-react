import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, Alert, Modal, FlatList,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStorageList, shipFromStorage, batchShipFromStorage,
  type BlindBoxStorageItem,
} from '../../services/blindBoxService';
import { getUserAddresses } from '../../services/addressService';
import type { UserAddress } from '../../types';
import { config } from '../../config';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;

const parseImageUrl = (img: string | null | undefined): string => {
  if (!img) return '';
  try {
    const parsed = JSON.parse(img);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let url = parsed[0];
      if (url && !url.startsWith('http')) url = `${BASE_URL}${url}`;
      return url;
    }
  } catch (e) {}
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${BASE_URL}${img}`;
  return img;
};

const BackIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z" fill="#222" />
  </Svg>
);

export default function StoragePage() {
  const [userId, setUserId] = useState<string>('');
  const [list, setList] = useState<BlindBoxStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shipTarget, setShipTarget] = useState<string | null>(null); // storageId 或 'batch'
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem('userId');
      if (uid) setUserId(uid);
      else setLoading(false); // 未登录时停止 loading
    })();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getStorageList(userId, true);
      const data = (res as any).data;
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('加载失败', e?.message || '请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const loadAddresses = async () => {
    if (!userId) return;
    try {
      const res = await getUserAddresses(userId);
      const data = (res as any).data;
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleShip = (storageId?: string) => {
    if (!userId) {
      Alert.alert('提示', '请先登录');
      return;
    }
    setShipTarget(storageId || 'batch');
    loadAddresses();
    setShowAddressModal(true);
  };

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const confirmShip = async (addressId: string) => {
    if (!userId || !shipTarget) return;
    setShipping(true);
    try {
      if (shipTarget === 'batch') {
        if (selectedIds.length === 0) {
          showToast('请先选择要发货的盲盒');
          setShipping(false);
          return;
        }
        await batchShipFromStorage(selectedIds, userId, addressId);
      } else {
        await shipFromStorage(shipTarget, userId, addressId);
      }
      setShowAddressModal(false);
      setSelectedIds([]);
      fetchData();
      showToast('发货成功，可在"我的-我的订单"中查看物流信息');
    } catch (e: any) {
      showToast('发货失败: ' + (e?.message || '请稍后重试'));
    } finally {
      setShipping(false);
    }
  };

  const totalPrice = list.reduce((sum, item) => sum + (item.drawPrice || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>暂存柜</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#6B5FB0" size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.storageId}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#6B5FB0']} />
          }
          ListHeaderComponent={
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                暂存 <Text style={styles.summaryNum}>{list.length}</Text> 件 · 合计 ¥{totalPrice.toFixed(2)}
              </Text>
              {selectedIds.length > 0 && (
                <Text style={styles.summarySelected}>已选 {selectedIds.length} 件</Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📦</Text>
              {userId ? (
                <>
                  <Text style={styles.emptyText}>暂存柜空空如也</Text>
                  <Text style={styles.emptySubText}>去抽盒机抽取喜欢的盲盒吧</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/blind-box')}>
                    <Text style={styles.emptyBtnText}>去抽盒</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>请先登录</Text>
                  <Text style={styles.emptySubText}>登录后查看暂存柜</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/login')}>
                    <Text style={styles.emptyBtnText}>去登录</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const img = parseImageUrl(item.variantImage);
            const isSelected = selectedIds.includes(item.storageId);
            return (
              <View style={[styles.card, isSelected && styles.cardSelected]}>
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => toggleSelect(item.storageId)}
                >
                  <View style={[styles.checkBox, isSelected && styles.checkBoxActive]}>
                    {isSelected && <Text style={styles.checkText}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.cardImgWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cardImg} contentFit="cover" />
                  ) : (
                    <Text style={{ fontSize: 30 }}>🎁</Text>
                  )}
                  {item.isHidden ? (
                    <View style={styles.hiddenBadge}>
                      <Text style={styles.hiddenBadgeText}>隐藏</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.variantName || '未知款式'}</Text>
                  <Text style={styles.cardMachine} numberOfLines={1}>{item.machineName || ''}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardPrice}>¥{item.drawPrice?.toFixed(2)}</Text>
                    <Text style={styles.cardDate}>
                      {item.storedAt ? new Date(item.storedAt).toLocaleDateString('zh-CN') : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.shipBtn}
                  onPress={() => handleShip(item.storageId)}
                >
                  <Text style={styles.shipBtnText}>发货</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* 底部批量发货栏 */}
      {list.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={() => {
              if (selectedIds.length === list.length) setSelectedIds([]);
              else setSelectedIds(list.map((i) => i.storageId));
            }}
          >
            <View style={[styles.checkBox, selectedIds.length === list.length && styles.checkBoxActive]}>
              {selectedIds.length === list.length && <Text style={styles.checkText}>✓</Text>}
            </View>
            <Text style={styles.selectAllText}>全选</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.batchShipBtn, selectedIds.length === 0 && { opacity: 0.5 }]}
            disabled={selectedIds.length === 0}
            onPress={() => handleShip()}
          >
            <Text style={styles.batchShipBtnText}>
              批量发货{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 地址选择弹窗 */}
      <Modal visible={showAddressModal} transparent animationType="fade" onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.addressModal}>
            <Text style={styles.modalTitle}>选择收货地址</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {addresses.length === 0 ? (
                <View style={styles.noAddressWrap}>
                  <Text style={styles.noAddressText}>还没有收货地址</Text>
                  <TouchableOpacity
                    style={styles.addAddrBtn}
                    onPress={() => {
                      setShowAddressModal(false);
                      router.push('/address/edit');
                    }}
                  >
                    <Text style={styles.addAddrBtnText}>+ 新增地址</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.addressId}
                    style={styles.addrItem}
                    onPress={() => confirmShip(addr.addressId)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.addrName}>{addr.recipientName}</Text>
                        <Text style={styles.addrPhone}>{addr.recipientPhone}</Text>
                        {addr.isDefault ? (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>默认</Text>
                          </View>
                        ) : null}
                        </View>
                      <Text style={styles.addrDetail} numberOfLines={2}>
                        {addr.province}{addr.city}{addr.district}{addr.detailAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddressModal(false)}>
              <Text style={styles.modalCloseText}>取消</Text>
            </TouchableOpacity>
            {shipping && (
              <View style={styles.shippingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast 提示 */}
      {toastMsg !== '' && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0EBFF',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  summaryText: { fontSize: 13, color: '#666' },
  summaryNum: { fontSize: 15, fontWeight: '800', color: '#6B5FB0' },
  summarySelected: { fontSize: 12, color: '#FF6B9A', fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 12, marginBottom: 10,
    padding: 10, paddingTop: 12,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#6B5FB0', backgroundColor: '#F5F0FF' },
  checkBtn: { paddingHorizontal: 6, paddingVertical: 10 },
  checkBox: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#C8BCF0',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: { backgroundColor: '#6B5FB0', borderColor: '#6B5FB0' },
  checkText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  cardImgWrap: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: '#F5F0FF',
    alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginRight: 10,
    position: 'relative',
  },
  cardImg: { width: '90%', height: '90%', borderRadius: 8 },
  hiddenBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#FF6B9A', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6,
  },
  hiddenBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  cardInfo: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 2 },
  cardMachine: { fontSize: 11, color: '#999', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#FF6B9A' },
  cardDate: { fontSize: 10, color: '#BBB' },

  shipBtn: {
    backgroundColor: '#6B5FB0', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, minWidth: 56, alignItems: 'center',
  },
  shipBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0EBFF',
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { fontSize: 13, color: '#333', marginLeft: 8 },
  batchShipBtn: {
    backgroundColor: '#FF6B9A', paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 22,
  },
  batchShipBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#666', marginTop: 14 },
  emptySubText: { fontSize: 12, color: '#999', marginTop: 4 },
  emptyBtn: {
    marginTop: 20, backgroundColor: '#6B5FB0', paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 22,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  addressModal: {
    backgroundColor: '#fff', borderRadius: 16, width: screenWidth - 28, padding: 16,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12, textAlign: 'center' },
  addrItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EBFF',
  },
  addrName: { fontSize: 14, fontWeight: '700', color: '#222' },
  addrPhone: { fontSize: 13, color: '#666', marginLeft: 10 },
  defaultBadge: {
    marginLeft: 8, backgroundColor: '#FF6B9A', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  defaultBadgeText: { color: '#fff', fontSize: 10 },
  addrDetail: { fontSize: 12, color: '#888', marginTop: 4 },
  modalCloseBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  modalCloseText: { color: '#999', fontSize: 14 },
  noAddressWrap: { alignItems: 'center', paddingVertical: 30 },
  noAddressText: { fontSize: 14, color: '#999' },
  addAddrBtn: { marginTop: 12, backgroundColor: '#6B5FB0', paddingHorizontal: 22, paddingVertical: 9, borderRadius: 20 },
  addAddrBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  shippingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  toastWrap: {
    position: 'absolute', bottom: 100, left: 40, right: 40,
    backgroundColor: 'rgba(0,0,0,0.78)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
