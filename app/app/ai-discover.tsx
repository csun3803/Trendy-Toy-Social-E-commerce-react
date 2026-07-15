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
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPersonalizedRecommend, getHotRecommend, type RecommendSeries } from '../services/aiRecommendService';
import { config } from '../config';

const BASE_URL = config.RESOURCE_BASE_URL;
const { width } = Dimensions.get('window');

// 快捷标签
const quickTags = [
  { text: '限量版盲盒', color: '#8069E1' },
  { text: '今日AI推荐', color: '#FF6B9D' },
  { text: '设计师联名', color: '#00D4AA' },
  { text: '隐藏款攻略', color: '#FFB800' },
  { text: '二手交换', color: '#7B68EE' },
];

// 灵感流卡片
const inspirationCards = [
  {
    id: 2,
    title: '跨次元搭配',
    subtitle: 'AI脑洞撞创意混搭',
    icon: '✨',
    gradient: ['#FF6B9D', '#FF8FB1'],
    accent: '#FF6B9D',
    content: '「赛博机甲兔」遇上「复古唱片熊」，3次居然能碰撞出「蒸汽波」风格？点击下方生成你的专属混搭概念图，分享到社区有机会获得限量徽章。',
    actions: [
      { icon: '🔗', text: '分享灵感' },
      { icon: '🎨', text: '生成概念图' },
    ],
  },
  {
    id: 3,
    title: '隐藏款概率雷达',
    subtitle: '你的抽盒运气指数',
    icon: '🎯',
    gradient: ['#00D4AA', '#2ECC71'],
    accent: '#00D4AA',
    content: '根据你的开盒历史，AI预测你下一盒抽取「LABUBU隐藏款」的概率为28.6%，高于平台平均（12.4%）。建议今日开盒3次，有较高概率触发隐藏款。',
    actions: [
      { icon: '📈', text: '查看概率图' },
      { icon: '📦', text: '立即开盒' },
    ],
  },
  {
    id: 4,
    title: '收藏家成长路径',
    subtitle: '你距离「潮玩大师」还有3步',
    icon: '🏆',
    gradient: ['#FFB800', '#FF6B00'],
    accent: '#FFB800',
    content: '你已收藏24款系列，解锁「收藏新星」徽章。再收藏6款IP限定可升级为「IP收藏家」，获得专属身份标识、优先购权益和每月神秘礼盒。',
    actions: [
      { icon: '🏅', text: '查看徽章墙' },
      { icon: '🎁', text: '推荐未收藏' },
    ],
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早啊';
  if (hour < 14) return '午安';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

// 脉冲点组件
function PulseDot() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseDot, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]} />
      <View style={styles.pulseDotInner} />
    </View>
  );
}

export default function AiDiscoverScreen() {
  const [userId, setUserId] = useState('');

  // 推荐数据
  const [recommendList, setRecommendList] = useState<RecommendSeries[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);

  // 动画
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    AsyncStorage.getItem('userId').then(id => {
      if (id) setUserId(id);
    });

    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setRecommendLoading(true);
    try {
      const uid = await AsyncStorage.getItem('userId') || '';
      let list: RecommendSeries[] = [];
      if (uid) {
        try {
          const resp = await getPersonalizedRecommend(uid, 4);
          const data = (resp.data as any) || [];
          list = Array.isArray(data) ? data : (data.records || data.list || []);
        } catch { /* fallback to hot */ }
      }
      if (list.length === 0) {
        const resp = await getHotRecommend(4);
        const data = (resp.data as any) || [];
        list = Array.isArray(data) ? data : (data.records || data.list || []);
      }
      setRecommendList(list);
    } catch (error) {
      console.error('获取推荐失败:', error);
    } finally {
      setRecommendLoading(false);
    }
  };

  // 点击「问问AI」搜索框 → 进入对话页
  const handleAskAI = () => {
    router.push('/ai-customer-service' as any);
  };

  // 点击快捷标签 → 携带问题进入对话页
  const handleTagPress = (tag: string) => {
    router.push({ pathname: '/ai-customer-service', params: { q: tag } } as any);
  };

  const getCoverImage = (item: RecommendSeries) => {
    let coverImage = '';
    try {
      const parsed = JSON.parse(item.coverImage || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) coverImage = parsed[0];
    } catch {
      coverImage = item.coverImage || '';
    }
    if (coverImage && !coverImage.startsWith('http')) coverImage = `${BASE_URL}${coverImage}`;
    return coverImage;
  };

  const handleCardAction = (cardId: number, actionIndex: number) => {
    if (cardId === 3 && actionIndex === 1) {
      router.push('/blind-box/index' as any);
    } else {
      router.push('/shop' as any);
    }
  };

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

        {/* 导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>AI发现</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* 问候语 */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>{getGreeting()}，</Text>
            {/* <PulseDot /> */}
          </View>
          <Text style={styles.greetingName}>收藏家！</Text>
          <Text style={styles.greetingSub}>问问AI，发现你的专属潮玩灵感</Text>
        </View>

        {/* 「问问AI」入口 - 点击进入对话页 */}
        <TouchableOpacity
          style={styles.searchBox}
          onPress={handleAskAI}
          activeOpacity={0.85}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
            <Circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
            <Path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.searchPlaceholder}>问问AI，今天有什么惊喜？</Text>
          <View style={styles.askBtn}>
            <Text style={styles.askBtnText}>提问</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ---- 快捷标签 ---- */}
          <View style={styles.tagsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
              {quickTags.map((tag, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.tag, { backgroundColor: tag.color + '15', borderColor: tag.color + '40' }]}
                  onPress={() => handleTagPress(tag.text)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, { color: tag.color }]}>#{tag.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ---- 为你独家解读：智能推荐卡片 ---- */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionLine, { backgroundColor: '#8069E1' }]} />
            <Text style={styles.sectionTitle}>为你独家解读</Text>
            <View style={[styles.sectionLine, { backgroundColor: '#8069E1' }]} />
          </View>
          <Text style={styles.sectionSub}>基于你的行为，AI为你精准推荐</Text>

          <View style={styles.recommendCard}>
            <LinearGradient
              colors={['#8069E1', '#9B7FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recommendCardBar}
            />
            <View style={styles.recommendCardBadge}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" style={{ marginRight: 3 }}>
                <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#8069E1" />
              </Svg>
              <Text style={styles.recommendCardBadgeText}>AI推荐</Text>
            </View>
            <View style={styles.recommendCardHeader}>
              <View style={styles.recommendCardTitleWrap}>
                <Text style={styles.recommendCardTitle}>猜你喜欢</Text>
                <Text style={styles.recommendCardSub}>根据你的浏览与收藏智能筛选</Text>
              </View>
            </View>

            {recommendLoading ? (
              <View style={styles.recommendLoading}>
                <ActivityIndicator size="small" color="#8069E1" />
                <Text style={styles.recommendLoadingText}>AI正在为你挑选...</Text>
              </View>
            ) : recommendList.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendScroll}>
                {recommendList.slice(0, 4).map((item, idx) => (
                  <TouchableOpacity
                    key={item.seriesId || idx}
                    style={styles.recommendItem}
                    onPress={() => router.push(`/series/${item.seriesId}`)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: getCoverImage(item) }} style={styles.recommendItemImage} resizeMode="cover" />
                    <Text style={styles.recommendItemName} numberOfLines={2}>{item.seriesName}</Text>
                    <Text style={styles.recommendItemPrice}>¥{item.minPrice || '0.00'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.recommendEmpty}>
                <Text style={styles.recommendEmptyText}>多浏览收藏后推荐更精准哦</Text>
              </View>
            )}

            <View style={styles.recommendCardActions}>
              <TouchableOpacity
                style={styles.recommendActionBtn}
                onPress={() => router.push('/shop' as any)}
                activeOpacity={0.7}
              >
                <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
                  <Path
                    d="M750.858 143.19c10.64 0 21 2.1 30.74 6.302 9.33 4.072 17.89 9.852 25.15 17.202 7.27 7.35 12.97 15.885 16.99 25.47 4.15 9.845 6.24 20.352 6.24 31.117 0 0.917 0 1.837 0.12 2.627l39.3 598.858c-0.13 10.37-2.21 20.49-6.23 29.94-4.02 9.59-9.73 18.12-16.99 25.47-7.26 7.35-15.69 13.13-25.16 17.2-9.73 4.21-20.1 6.3-30.74 6.3L236.857 903.676c-10.635 0-21.012-2.09-30.742-6.3-9.465-4.07-17.9-9.85-25.157-17.2-7.267-7.35-12.972-15.88-16.992-25.47-4.02-9.45-6.095-19.57-6.225-29.94l39.43-598.988c0-0.92 0.13-1.84 0.13-2.627 0-10.767 2.07-21.27 6.225-31.117 4.02-9.582 9.725-18.12 16.99-25.472 7.26-7.352 15.692-13.127 25.16-17.202 9.727-4.195 20.105-6.3 30.737-6.3l474.446 0M513.634 491.154c-60.875 0-118.11-23.997-161.155-67.575-43.045-43.58-66.752-101.515-66.752-163.142 0-0.275 0.003-0.547 0.008-0.82l0 0.15 56.045 0.13c0 0.23 0 0.455-0.003 0.685 0.073 95.865 77.14 173.832 171.857 173.832 94.71 0 171.77-77.952 171.855-173.812-0.005-0.233-0.01-0.435-0.01-0.64l56.05-0.257 0-0.19c0.005 0.335 0.005 0.625 0.005 0.922 0 61.627-23.7 119.562-66.745 163.142C631.738 467.154 574.509 491.154 513.634 491.154zM760.768 85.535 266.489 85.535c-68.26 0-123.572 55.995-123.572 125.097l-41.23 625.476c0 69.11 55.312 125.1 123.572 125.1l576.749 0c68.26 0 123.57-55.99 123.57-125.1l-41.24-625.476C884.338 141.53 829.028 85.535 760.768 85.535L760.768 85.535 760.768 85.535z"
                    fill="#8069E1"
                  />
                </Svg>
                <Text style={styles.recommendActionText}>去逛逛</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.recommendActionBtn}
                onPress={fetchRecommendations}
                activeOpacity={0.7}
              >
                <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
                  <Path
                    d="M797.952 154.304a48 48 0 0 0-94.208 18.432l3.008 15.424a385.792 385.792 0 0 0-582.4 344.96 48 48 0 0 0 95.936-3.328 289.792 289.792 0 0 1 450.496-250.88l-34.496 10.24a48 48 0 0 0 27.52 92.032l126.976-38.016a48 48 0 0 0 32.768-57.728l-25.6-131.136z m48 306.304a48 48 0 0 1 49.6 46.272 385.792 385.792 0 0 1-612.352 325.376l-0.32 19.456a48 48 0 1 1-96-1.856l2.624-135.936a48 48 0 0 1 45.056-46.976l131.392-10.368a48 48 0 0 1 7.488 95.68l-33.28 2.624a289.792 289.792 0 0 0 459.52-244.672 48 48 0 0 1 46.272-49.6z"
                    fill="#8069E1"
                  />
                </Svg>
                <Text style={styles.recommendActionText}>换一批</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// 灵感卡片组件
function CardItem({ card, onAction, index }: any) {
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.timing(cardSlideAnim, { toValue: 0, duration: 500, delay: index * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: cardFadeAnim, transform: [{ translateY: cardSlideAnim }], marginBottom: 14 }}>
      <View style={styles.card}>
        <LinearGradient colors={[card.gradient[0], card.gradient[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardTopBar} />
        <View style={[styles.cardBadge, { backgroundColor: card.accent + '15' }]}>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" style={{ marginRight: 3 }}>
            <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={card.accent} />
          </Svg>
          <Text style={[styles.cardBadgeText, { color: card.accent }]}>AI</Text>
        </View>
        <View style={styles.cardHeader}>
          <LinearGradient colors={[card.gradient[0] + '20', card.gradient[1] + '20']} style={styles.cardIcon}>
            <Text style={styles.cardIconText}>{card.icon}</Text>
          </LinearGradient>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={[styles.cardContentAccent, { backgroundColor: card.accent }]} />
          <Text style={styles.cardContentText}>{card.content}</Text>
        </View>
        <View style={styles.cardActions}>
          {card.actions.map((action: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={[styles.cardActionBtn, { borderColor: card.gradient[0] + '40', backgroundColor: card.gradient[0] + '10' }]}
              onPress={() => onAction(card.id, i)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardActionIcon}>{action.icon}</Text>
              <Text style={[styles.cardActionText, { color: card.gradient[0] }]}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F8' },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  decorCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -80, right: -50 },
  decorCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)', top: 30, left: -40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  greetingSection: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 18 },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  pulseContainer: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  pulseDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  pulseDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  greetingName: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, height: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchIcon: { marginRight: 8 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  askBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginLeft: 6 },
  askBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  scrollView: { flex: 1 },

  // 快捷标签
  tagsSection: { paddingTop: 16, paddingBottom: 14 },
  tagsRow: { paddingHorizontal: 16, gap: 10 },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },

  // 区块标题
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 4 },
  sectionLine: { width: 30, height: 2, borderRadius: 1, marginHorizontal: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  sectionSub: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4, marginBottom: 12 },

  // 推荐卡片
  recommendCard: { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, position: 'relative' },
  recommendCardBar: { height: 4, width: '100%' },
  recommendCardBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#8069E115' },
  recommendCardBadgeText: { fontSize: 10, fontWeight: '700', color: '#8069E1' },
  recommendCardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  recommendCardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recommendCardIconText: { fontSize: 20 },
  recommendCardTitleWrap: { flex: 1 },
  recommendCardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  recommendCardSub: { fontSize: 12, color: '#999', marginTop: 2 },
  recommendLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  recommendLoadingText: { fontSize: 12, color: '#999', marginLeft: 8 },
  recommendScroll: { paddingHorizontal: 12, gap: 10 },
  recommendItem: { width: 110, marginLeft: 6 },
  recommendItemImage: { width: 110, height: 110, borderRadius: 10, backgroundColor: '#f0f0f0' },
  recommendItemName: { fontSize: 12, color: '#333', fontWeight: '500', marginTop: 6, lineHeight: 16 },
  recommendItemPrice: { fontSize: 14, color: '#FF4D4F', fontWeight: 'bold', marginTop: 2 },
  recommendEmpty: { alignItems: 'center', paddingVertical: 20 },
  recommendEmptyText: { fontSize: 13, color: '#999' },
  recommendCardActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  recommendActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#8069E140', backgroundColor: '#8069E110' },
  recommendActionIcon: { fontSize: 13, marginRight: 4 },
  recommendActionText: { fontSize: 12, fontWeight: '600', color: '#8069E1' },

  // 灵感卡片
  cardsSection: { paddingHorizontal: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, position: 'relative' },
  cardTopBar: { height: 4, width: '100%' },
  cardBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  cardBadgeText: { fontSize: 10, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardIconText: { fontSize: 20 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  cardContent: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14 },
  cardContentAccent: { width: 3, borderRadius: 1.5, marginRight: 10, marginTop: 2 },
  cardContentText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  cardActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  cardActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  cardActionIcon: { fontSize: 13, marginRight: 4 },
  cardActionText: { fontSize: 12, fontWeight: '600' },

  // 底部
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 30 },
  footerDot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 6 },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center' },
});
