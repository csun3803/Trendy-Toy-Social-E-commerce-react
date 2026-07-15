import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPersonalizedRecommend, getHotRecommend, type RecommendSeries } from '../services/aiRecommendService';
import { config } from '../config';

const BASE_URL = config.RESOURCE_BASE_URL;
const { width } = Dimensions.get('window');

export default function AiRecommendScreen() {
  const [activeTab, setActiveTab] = useState<'personalized' | 'hot'>('personalized');
  const [loading, setLoading] = useState(false);
  const [personalizedList, setPersonalizedList] = useState<RecommendSeries[]>([]);
  const [hotList, setHotList] = useState<RecommendSeries[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPersonalized = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || '';
      if (!userId) {
        setActiveTab('hot');
        setLoading(false);
        return;
      }
      const response = await getPersonalizedRecommend(userId, 20);
      const data = (response.data as any) || [];
      const list = Array.isArray(data) ? data : (data.records || data.list || []);
      setPersonalizedList(list);
    } catch (error) {
      console.error('获取个性化推荐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHot = async () => {
    setLoading(true);
    try {
      const response = await getHotRecommend(20);
      const data = (response.data as any) || [];
      const list = Array.isArray(data) ? data : (data.records || data.list || []);
      setHotList(list);
    } catch (error) {
      console.error('获取热门推荐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalized();
    fetchHot();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCoverImage = (item: RecommendSeries) => {
    let coverImage = '';
    try {
      const parsed = JSON.parse(item.coverImage || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        coverImage = parsed[0];
      }
    } catch {
      coverImage = item.coverImage || '';
    }
    if (coverImage && !coverImage.startsWith('http')) {
      coverImage = `${BASE_URL}${coverImage}`;
    }
    return coverImage;
  };

  const currentList = activeTab === 'personalized' ? personalizedList : hotList;

  const renderSeriesItem = (item: RecommendSeries, index: number) => (
    <Animated.View
      key={item.seriesId}
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        style={styles.seriesCard}
        onPress={() => router.push(`/series/${item.seriesId}`)}
        activeOpacity={0.8}
      >
        <View style={styles.seriesImageWrap}>
          <Image
            source={{ uri: getCoverImage(item) }}
            style={styles.seriesImage}
            resizeMode="cover"
          />
          {index < 3 && (
            <View style={styles.rankBadge}>
              <LinearGradient
                colors={index === 0 ? ['#FFB800', '#FF6B00'] : index === 1 ? ['#C0C0C0', '#999'] : ['#CD7F32', '#A0522D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rankBadgeGradient}
              >
                <Text style={styles.rankText}>NO.{index + 1}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
        <View style={styles.seriesInfo}>
          <Text style={styles.seriesName} numberOfLines={2}>{item.seriesName}</Text>
          <View style={styles.seriesMeta}>
            <Text style={styles.seriesPrice}>¥{item.minPrice || '0.00'}</Text>
            {item.seriesHotness ? (
              <View style={styles.hotTag}>
                <Text style={styles.hotIcon}>🔥</Text>
                <Text style={styles.seriesHot}>{item.seriesHotness}</Text>
              </View>
            ) : null}
          </View>
          {item.theme ? (
            <View style={styles.themeTag}>
              <Text style={styles.themeText}>{item.theme}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 顶部紫色渐变 */}
      <LinearGradient
        colors={['#8069E1', '#9B7FE8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerIcon}>🎯</Text>
            <Text style={styles.headerTitle}>AI智能推荐</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'personalized' && styles.activeTab]}
            onPress={() => setActiveTab('personalized')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'personalized' && styles.activeTabText]}>
              猜你喜欢
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'hot' && styles.activeTab]}
            onPress={() => setActiveTab('hot')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'hot' && styles.activeTabText]}>
              热门推荐
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 推荐说明条 */}
      <View style={styles.tipBar}>
        <View style={styles.tipDot} />
        <Text style={styles.tipText}>
          {activeTab === 'personalized'
            ? '基于您的浏览、收藏和购买记录，AI为您精选推荐'
            : '当前最热门的潮玩系列，大家都在买'}
        </Text>
      </View>

      {/* 内容区域 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8069E1" />
          <Text style={styles.loadingText}>AI正在为您生成推荐...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {currentList.length > 0 ? (
            <View style={styles.listGrid}>
              {currentList.map((item, index) => renderSeriesItem(item, index))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'personalized'
                  ? '暂无个性化推荐'
                  : '暂无热门推荐'}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === 'personalized'
                  ? '多浏览收藏商品后推荐更精准哦'
                  : '请稍后再来看看'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 40,
    left: -30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8069E1',
    fontWeight: '700',
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0EDFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8069E1',
    marginRight: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#8069E1',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seriesCard: {
    width: (width - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  seriesImageWrap: {
    position: 'relative',
  },
  seriesImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  rankBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  rankBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  seriesInfo: {
    padding: 10,
  },
  seriesName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 19,
    minHeight: 38,
  },
  seriesMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  seriesPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4D4F',
  },
  hotTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  seriesHot: {
    fontSize: 11,
    color: '#FF4D4F',
    fontWeight: '500',
  },
  themeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  themeText: {
    fontSize: 11,
    color: '#8069E1',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
});
