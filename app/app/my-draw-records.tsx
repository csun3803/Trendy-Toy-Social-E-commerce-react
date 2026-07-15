import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, Dimensions, Alert,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDrawRecords, openDrawRecord } from '../services/blindBoxService';
import type { BlindBoxDrawRecord } from '../types';
import { config } from '../config';

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

const drawTypeText = (type: string) => {
  switch (type) {
    case 'SINGLE': return '单抽';
    case 'TEN': return '十连';
    case 'PICK': return '选盒';
    default: return type;
  }
};

export default function MyDrawRecordsScreen() {
  const [userId, setUserId] = useState('');
  const [records, setRecords] = useState<BlindBoxDrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingRecord, setOpeningRecord] = useState<BlindBoxDrawRecord | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem('userId');
      if (uid) setUserId(uid);
      else setLoading(false);
    })();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getUserDrawRecords(userId);
      const data = (res as any).data;
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('获取抽盒记录失败:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleOpen = async () => {
    if (!openingRecord || !userId) return;
    setOpening(true);
    try {
      await openDrawRecord(openingRecord.recordId, userId);
      setOpeningRecord(null);
      fetchData();
    } catch (e: any) {
      Alert.alert('开盒失败', e?.message || '请稍后重试');
    } finally {
      setOpening(false);
    }
  };

  const stats = {
    total: records.length,
    hidden: records.filter(r => r.isHidden).length,
    pending: records.filter(r => r.status === 'PENDING_OPEN').length,
  };

  const renderItem = ({ item }: { item: BlindBoxDrawRecord }) => {
    const img = parseImageUrl(item.variantImage);
    const isPending = item.status === 'PENDING_OPEN';
    return (
      <View style={styles.card}>
        <View style={styles.cardImgWrap}>
          {isPending ? (
            <View style={styles.mysteryBox}>
              <Text style={styles.mysteryBoxIcon}>🎁</Text>
            </View>
          ) : img ? (
            <Image source={{ uri: img }} style={styles.cardImg} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 30 }}>🎁</Text>
          )}
          {item.isHidden && !isPending ? (
            <View style={styles.hiddenBadge}>
              <Text style={styles.hiddenBadgeText}>隐藏</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {isPending ? '待开盒' : (item.variantName || '未知款式')}
          </Text>
          <Text style={styles.cardMachine} numberOfLines={1}>{item.machineName || ''}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.drawTypeTag}>{drawTypeText(item.drawType)}</Text>
            {item.isGuaranteed ? <Text style={styles.guaranteeTag}>保底</Text> : null}
            <Text style={styles.cardPrice}>¥{item.drawPrice?.toFixed(2)}</Text>
          </View>
          <Text style={styles.cardDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : ''}
          </Text>
        </View>
        {isPending ? (
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => setOpeningRecord(item)}
          >
            <Text style={styles.openBtnText}>开盒</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.openedTag}>
            <Text style={styles.openedTagText}>已开盒</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的抽盒记录</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 统计栏 */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>总抽数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#FF6B9A' }]}>{stats.hidden}</Text>
          <Text style={styles.statLabel}>隐藏款</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#FF9800' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>待开盒</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#6B5FB0" size="large" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.recordId}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#6B5FB0']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>还没有抽盒记录</Text>
              <Text style={styles.emptySubText}>去抽盒机试试手气吧</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/blind-box')}>
                <Text style={styles.emptyBtnText}>去抽盒</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      )}

      {/* 开盒弹窗 */}
      <Modal visible={!!openingRecord} transparent animationType="fade" onRequestClose={() => setOpeningRecord(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.openModal}>
            <Text style={styles.openModalTitle}>确认开盒</Text>
            <Text style={styles.openModalDesc}>开盒后将揭晓款式，无法撤回</Text>
            <View style={styles.openModalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setOpeningRecord(null)}
                disabled={opening}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleOpen}
                disabled={opening}
              >
                {opening ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>确认开盒</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#6B5FB0' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#F0EBFF' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 12, marginBottom: 10,
    padding: 10,
  },
  cardImgWrap: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: '#F5F0FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
    position: 'relative',
  },
  mysteryBox: { alignItems: 'center', justifyContent: 'center' },
  mysteryBoxIcon: { fontSize: 32 },
  cardImg: { width: '90%', height: '90%', borderRadius: 8 },
  hiddenBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#FF6B9A', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6,
  },
  hiddenBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  cardInfo: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 2 },
  cardMachine: { fontSize: 11, color: '#999', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  drawTypeTag: {
    fontSize: 10, color: '#6B5FB0', backgroundColor: '#F0EBFF',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, fontWeight: '600',
  },
  guaranteeTag: {
    fontSize: 10, color: '#FF9800', backgroundColor: '#FFF3E0',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, fontWeight: '600',
  },
  cardPrice: { fontSize: 13, fontWeight: '800', color: '#FF6B9A' },
  cardDate: { fontSize: 10, color: '#BBB' },

  openBtn: {
    backgroundColor: '#6B5FB0', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, minWidth: 56, alignItems: 'center',
  },
  openBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  openedTag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  openedTagText: { fontSize: 11, color: '#999', fontWeight: '600' },

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
  openModal: {
    backgroundColor: '#fff', borderRadius: 16, width: Dimensions.get('window').width - 56,
    padding: 20, alignItems: 'center',
  },
  openModalTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 8 },
  openModalDesc: { fontSize: 13, color: '#999', marginBottom: 20 },
  openModalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 22 },
  modalBtnCancel: { backgroundColor: '#F5F5F5' },
  modalBtnCancelText: { color: '#666', fontSize: 14, fontWeight: '600' },
  modalBtnConfirm: { backgroundColor: '#6B5FB0' },
  modalBtnConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
