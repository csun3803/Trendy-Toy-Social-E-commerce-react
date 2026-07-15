import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Alert } from 'react-native';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getBlindBoxMachines } from '../../services/blindBoxService';
import type { BlindBoxMachine } from '../../types';
import { config } from '../../config';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;

const getMachineCoverUrl = (coverImage: string | null | undefined): string => {
  if (!coverImage) return '';
  try {
    const parsed = JSON.parse(coverImage);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let url = parsed[0];
      if (url && !url.startsWith('http')) url = `${BASE_URL}${url}`;
      return url;
    }
  } catch (e) {}
  if (coverImage.startsWith('http')) return coverImage;
  return `${BASE_URL}${coverImage}`;
};

// 判断抽盒机是否热门（已抽次数 >= 200）
const isHotMachine = (machine: BlindBoxMachine): boolean => (machine.totalDraws || 0) >= 200;
// 判断是否新品（创建时间在 7 天内）
const isNewMachine = (machine: BlindBoxMachine): boolean => {
  if (!machine.createdAt) return false;
  const created = new Date(machine.createdAt).getTime();
  return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
};

export default function BlindBoxListPage() {
  const [machines, setMachines] = useState<BlindBoxMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'new' | 'guarantee'>('all');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await getBlindBoxMachines();
      const data = response.data as any;
      let list: BlindBoxMachine[] = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.data)) list = data.data;
      else if (data && Array.isArray(data.records)) list = data.records;
      else if (data && Array.isArray(data.list)) list = data.list;
      else if (data && Array.isArray(data.items)) list = data.items;

      setMachines(list);
    } catch (error) {
      console.error('获取抽盒机列表失败:', error);
      Alert.alert('加载失败', '无法获取抽盒机列表，请检查网络后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, []);

  const goBack = () => router.back();

  const goToMachineDetail = (machineId: string) => router.push(`/blind-box/${machineId}`);

  const filteredMachines = machines.filter((m) => {
    switch (activeTab) {
      case 'hot':
        return isHotMachine(m);
      case 'new':
        return isNewMachine(m);
      case 'guarantee':
        return (m.guaranteeDraws || 0) > 0;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B4A5F4" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部栏 */}
      <LinearGradient
        colors={['#EFE9FF', '#F7F4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
              <Path d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z" fill="#222" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>在线抽盒</Text>
          <TouchableOpacity onPress={() => router.push('/blind-box/storage')} style={styles.headerRight}>
            <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M511.488 995.328a128.654222 128.654222 0 0 1-57.116444-13.112889L70.769778 791.808a126.833778 126.833778 0 0 1-70.769778-113.777778V311.608889a126.179556 126.179556 0 0 1 15.36-60.103111V248.604444c1.479111-2.901333 3.356444-5.603556 5.518222-8.021333a127.630222 127.630222 0 0 1 49.891556-42.325333L454.371556 13.368889a128.739556 128.739556 0 0 1 112.981333 0l383.601778 190.407111a126.862222 126.862222 0 0 1 72.049777 113.379556v360.874666a126.805333 126.805333 0 0 1-70.769777 115.939556L568.604444 984.32c-17.92 7.964444-37.461333 11.747556-57.116444 11.008z m42.638222-470.897778v370.204445l360.192-178.545778c14.449778-7.253333 23.552-21.987556 23.438222-38.087111v-335.928889L554.097778 524.430222zM85.248 330.666667v347.335111a42.268444 42.268444 0 0 0 23.438222 38.087111l360.192 178.545778V523.576889L85.248 330.666667zM135.537778 260.835556l375.950222 189.952 137.671111-65.564445L286.435556 188.074667 135.537778 260.864z m245.105778-118.471112l363.576888 197.973334 150.897778-71.480889-365.283555-180.224a42.922667 42.922667 0 0 0-37.518223 0l-111.672888 53.731555z"
                fill="#8069E1"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* 顶部横幅 */}
        <LinearGradient
          colors={['#9D8BFF', '#B4A5F4', '#D9C7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          {/* 装饰圆 */}
          <View style={[styles.bannerDecor, styles.bannerDecor1]} />
          <View style={[styles.bannerDecor, styles.bannerDecor2]} />

          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>在线选盒·实时揭晓</Text>
              <Text style={styles.bannerSubtitle}>足不出户，体验拆盒乐趣</Text>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#B4A5F4']} tintColor="#B4A5F4" />}
      >
        {/* 分类标签 */}
        <View style={styles.tabsRow}>
          {[
            { key: 'all', label: '全部' },
            { key: 'hot', label: '热门' },
            { key: 'new', label: '新品' },
            { key: 'guarantee', label: '保底' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key as typeof activeTab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabItemText, activeTab === tab.key && styles.tabItemTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 抽盒机列表（双列网格） */}
        {filteredMachines.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>该分类暂无抽盒机</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredMachines.map((machine) => {
              const cover = getMachineCoverUrl(machine.machineCoverImage);
              const hot = isHotMachine(machine);
              const isNew = isNewMachine(machine);
              const totalStock = machine.totalStock || 0;
              const soldOut = totalStock <= 0;

              return (
                <TouchableOpacity
                  key={machine.machineId}
                  style={styles.machineCard}
                  onPress={() => goToMachineDetail(machine.machineId)}
                  activeOpacity={0.85}
                >
                  {/* 封面区 */}
                  <View style={styles.machineCoverWrap}>
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={styles.machineCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.machineCoverPlaceholder}>
                        <Svg width={42} height={42} viewBox="0 0 1024 1024">
                          <Path
                            d="M512 96L896 256v512L512 928 128 768V256L512 96z"
                            fill="#D9C7FF"
                          />
                          <Path d="M512 96L896 256 512 416 128 256 512 96z" fill="#EFE6FF" />
                          <Path d="M512 416v512" stroke="#B4A5F4" strokeWidth="10" />
                        </Svg>
                      </View>
                    )}
                    {/* 渐变遮罩，便于文字可读 */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.35)']}
                      style={styles.coverMask}
                    />

                    {/* 角标 */}
                    <View style={styles.tagRow}>
                      {hot && (
                        <View style={[styles.cornerTag, styles.hotTag]}>
                          <Text style={styles.cornerTagText}>HOT</Text>
                        </View>
                      )}
                      {isNew && !hot && (
                        <View style={[styles.cornerTag, styles.newTag]}>
                          <Text style={styles.cornerTagText}>NEW</Text>
                        </View>
                      )}
                      {soldOut && (
                        <View style={[styles.cornerTag, styles.soldOutTag]}>
                          <Text style={styles.cornerTagText}>已售罄</Text>
                        </View>
                      )}
                    </View>

                    {/* 价格徽章 */}
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>¥{machine.drawPrice}/抽</Text>
                    </View>
                  </View>

                  {/* 文字信息 */}
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName} numberOfLines={1}>
                      {machine.machineName}
                    </Text>
                    {machine.saleSeriesName ? (
                      <Text style={styles.seriesName} numberOfLines={1}>
                        {machine.saleSeriesName}
                      </Text>
                    ) : null}
                    <View style={styles.statsRow}>
                      <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>剩余 {totalStock}</Text>
                      </View>
                      {machine.guaranteeDraws > 0 && (
                        <View style={[styles.statBadge, styles.guaranteeBadge]}>
                          <Text style={styles.guaranteeText}>{machine.guaranteeDraws}抽保底</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <View style={styles.priceLeft}>
                        <Text style={styles.drawPrice}>
                          ¥{machine.drawPrice}
                        </Text>
                        <Text style={styles.drawPriceUnit}>/次</Text>
                      </View>
                      <View style={[styles.drawButton, soldOut && styles.drawButtonDisabled]}>
                        <Text style={styles.drawButtonText}>{soldOut ? '已售罄' : '去抽盒'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={styles.footerText}>
          <Text style={styles.footerTextInner}>— 没有更多了 —</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_GAP = 10;
const CARD_WIDTH = (screenWidth - 28 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4FF' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#888' },

  headerGradient: {
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 44,
    paddingBottom: 10,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerRight: { width: 36, alignItems: 'center', justifyContent: 'center' },

  scrollView: { flex: 1 },

  // 横幅
  banner: {
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 6,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#9D8BFF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerDecor: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bannerDecor1: { width: 140, height: 140, top: -60, right: -30 },
  bannerDecor2: { width: 80, height: 80, bottom: -40, left: -20 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4, letterSpacing: 0.5 },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bannerBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  bannerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStats: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  bannerStatsText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // 分类标签
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  tabItemActive: {
    backgroundColor: '#B4A5F4',
    shadowColor: '#B4A5F4',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  tabItemText: { fontSize: 13, color: '#777' },
  tabItemTextActive: { color: '#fff', fontWeight: '600' },

  // 网格列表
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: '#B8AED8' },

  machineCard: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#222',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  machineCoverWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0EAFF',
    position: 'relative',
  },
  machineCover: { width: '100%', height: '100%' },
  machineCoverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },

  // 角标
  tagRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
  },
  cornerTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  hotTag: { backgroundColor: '#FF5C5C' },
  newTag: { backgroundColor: '#2DCE8F' },
  soldOutTag: { backgroundColor: '#999' },
  cornerTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // 价格徽章
  priceBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priceBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // 文字信息
  machineInfo: { padding: 10 },
  machineName: { fontSize: 14, fontWeight: '700', color: '#222', lineHeight: 18 },
  seriesName: { fontSize: 11, color: '#9C8DE8', marginTop: 2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  statBadge: {
    backgroundColor: '#F5F1FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 4,
  },
  statBadgeText: { fontSize: 10, color: '#7A6BD8' },
  guaranteeBadge: { backgroundColor: '#FFF3D6' },
  guaranteeText: { fontSize: 10, color: '#E29A1A', fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceLeft: { flexDirection: 'row', alignItems: 'baseline' },
  drawPrice: { fontSize: 16, fontWeight: '700', color: '#E85A5A' },
  drawPriceUnit: { fontSize: 10, color: '#999', marginLeft: 2 },
  drawButton: {
    backgroundColor: '#B4A5F4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  drawButtonDisabled: { backgroundColor: '#D6CFF0' },
  drawButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  footerText: { alignItems: 'center', paddingVertical: 20 },
  footerTextInner: { fontSize: 12, color: '#B8AED8' },
});
