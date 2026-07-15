import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Dimensions, FlatList, ImageBackground, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import { Link, router } from 'expo-router';
import { getSeriesList, getSeriesDetail } from '../../services/seriesService';
import { getActivityList } from '../../services/activityService';
import { getUserInfo } from '../../services/userService';
import { getBlindBoxMachines } from '../../services/blindBoxService';
import { getBannerList, type BannerItem } from '../../services/bannerService';
import type { SeriesItem, SocialActivity, BlindBoxMachine } from '../../types';
import { config } from '../../config';


const BASE_URL = config.RESOURCE_BASE_URL;

const { width } = Dimensions.get('window');

interface WaterfallItem extends SocialActivity {
  imageHeight: number;
}

export default function Index() {
  const [bannerList, setBannerList] = useState<BannerItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [tujianSeriesName, setTujianSeriesName] = useState<string>('');
  const [tujianVariantCount, setTujianVariantCount] = useState<number>(0);
  const [blindBoxMachine, setBlindBoxMachine] = useState<BlindBoxMachine | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityList, setActivityList] = useState<WaterfallItem[]>([]);
  const [leftColumn, setLeftColumn] = useState<WaterfallItem[]>([]);
  const [rightColumn, setRightColumn] = useState<WaterfallItem[]>([]);
  const [leftColumnHeight, setLeftColumnHeight] = useState(0);
  const [rightColumnHeight, setRightColumnHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // 轮播图点击跳转
  const handleBannerPress = (banner: BannerItem) => {
    switch (banner.jumpType) {
      case 'PRODUCT':
        if (banner.jumpValue) {
          router.push(`/shop/${banner.jumpValue}`);
        }
        break;
      case 'ACTIVITY':
        if (banner.jumpValue) {
          router.push(`/activity/${banner.jumpValue}`);
        }
        break;
      case 'BLIND_BOX':
        if (banner.jumpValue) {
          router.push(`/blind-box/${banner.jumpValue}`);
        }
        break;
      case 'EXTERNAL_LINK':
        if (banner.jumpValue) {
          Linking.openURL(banner.jumpValue);
        }
        break;
      case 'NONE':
      default:
        break;
    }
  };

  const fetchSeriesData = async () => {
    setLoading(true);
    // 获取轮播图数据
    try {
      const bannerRes = await getBannerList();
      if (Array.isArray(bannerRes)) {
        setBannerList(bannerRes);
      }
    } catch (error) {
      console.error('获取轮播图失败:', error);
    }
    try {
      const response = await getSeriesList({
        page: 1,
        size: 10
      });

      const responseData = response.data as any;
      const seriesData = (responseData.records || responseData.list || responseData.items || []).map((item: any) => {
        let coverImage = '';
        try {
          const coverImages = JSON.parse(item.coverImage || '[]');
          if (Array.isArray(coverImages) && coverImages.length > 0) {
            coverImage = coverImages[0];
            if (coverImage && !coverImage.startsWith('http')) {
              coverImage = `${BASE_URL}${coverImage}`;
            }
          }
        } catch (e) {
          coverImage = item.coverImage || '';
          if (coverImage && !coverImage.startsWith('http')) {
            coverImage = `${BASE_URL}${coverImage}`;
          }
        }

        return {
          series_id: item.seriesId || item.series_id,
          series_name: item.seriesName || item.series_name,
          cover_image: coverImage,
          min_price: item.minPrice?.toString() || item.min_price || '0.00',
          sales_count: item.salesCount || item.sales_count || 0,
          description: item.description || ''
        };
      });

      setSeriesList(seriesData);

      // 获取第一个系列的详情用于图鉴入口卡片
      if (seriesData.length > 0) {
        try {
          const detailResp = await getSeriesDetail(
            seriesData[0].series_id
          );
          const detailData = (detailResp.data as any)?.data || (detailResp.data as any);
          setTujianSeriesName(
            detailData?.seriesName || seriesData[0].series_name
          );
          setTujianVariantCount(detailData?.totalVariants || 0);
        } catch (e) {
          setTujianSeriesName(seriesData[0].series_name);
        }
      }
    } catch (error) {
      console.error('获取系列数据失败:', error);
      loadMockSeriesData();
    } finally {
      setLoading(false);
    }
  };

  const fetchBlindBoxMachine = async () => {
    try {
      const response = await getBlindBoxMachines();
      const data = response.data as any;
      let list: BlindBoxMachine[] = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.data)) list = data.data;
      else if (data && Array.isArray(data.records)) list = data.records;
      else if (data && Array.isArray(data.list)) list = data.list;
      else if (data && Array.isArray(data.items)) list = data.items;

      if (list.length > 0) {
        setBlindBoxMachine(list[0]);
      }
    } catch (error) {
      console.error('获取抽盒机数据失败:', error);
    }
  };

  const loadMockSeriesData = () => {
    const mockSeries: SeriesItem[] = [
      {
        series_id: 'series_001',
        series_name: 'SKULLPANDA温度系列',
        cover_image: require('../../assets/images/shop/popmart/warmth/1.jpg'),
        min_price: '69.00',
        sales_count: 15234,
        description: ''
      },
      {
        series_id: 'series_002',
        series_name: 'DIMOO梦境系列',
        cover_image: require('../../assets/images/shop/popmart/warmth/2.jpg'),
        min_price: '79.00',
        sales_count: 8921,
        description: ''
      },
      {
        series_id: 'series_003',
        series_name: 'MOLLY幻想流浪记',
        cover_image: require('../../assets/images/shop/popmart/warmth/3.jpg'),
        min_price: '59.00',
        sales_count: 12345,
        description: ''
      },
      {
        series_id: 'series_004',
        series_name: 'HACIPUPU成长日记',
        cover_image: require('../../assets/images/shop/popmart/warmth/4.jpg'),
        min_price: '69.00',
        sales_count: 7890,
        description: ''
      },
      {
        series_id: 'series_005',
        series_name: 'Labubu精灵动物',
        cover_image: require('../../assets/images/shop/popmart/warmth/5.jpg'),
        min_price: '69.00',
        sales_count: 23456,
        description: ''
      }
    ];
    setSeriesList(mockSeries);
  };

  const goToSeriesDetail = (seriesId: string) => {
    router.push(`/series/${seriesId}`);
  };

  const getRandomHeight = () => {
    const heights = [120, 140, 160, 180, 200];
    return heights[Math.floor(Math.random() * heights.length)];
  };

  const distributeToColumns = (items: WaterfallItem[]) => {
    const left: WaterfallItem[] = [];
    const right: WaterfallItem[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    items.forEach((item) => {
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += item.imageHeight + 80;
      } else {
        right.push(item);
        rightHeight += item.imageHeight + 80;
      }
    });

    setLeftColumn(left);
    setRightColumn(right);
    setLeftColumnHeight(leftHeight);
    setRightColumnHeight(rightHeight);
  };

  const fetchActivityData = async () => {
    setActivityLoading(true);
    try {
      const response = await getActivityList({
        page: 1,
        size: 20
      });
      const responseData = response.data as any;
      const rawActivities = responseData.records || responseData.list || responseData.items || [];
      
      const userIdsToFetch: string[] = [];
      rawActivities.forEach((item: any) => {
        const userInfo = item.userInfo || item.user || item.author || null;
        if (!userInfo || (!userInfo.avatarUrl && !userInfo.avatar && !userInfo.username)) {
          if (item.userId && !userIdsToFetch.includes(item.userId)) {
            userIdsToFetch.push(item.userId);
          }
        }
      });
      
      const userInfos = new Map<string, any>();
      for (const userId of userIdsToFetch) {
        const info = await getUserInfo(userId);
        if (info) {
          userInfos.set(userId, info);
        }
      }
      
      const activities: WaterfallItem[] = rawActivities.map((item: any) => {
        let coverImage = item.coverImage || '';
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = `${BASE_URL}${coverImage}`;
        }
        let imageList: string[] = [];
        try {
          const parsed = typeof item.imageList === 'string' ? JSON.parse(item.imageList) : item.imageList;
          if (Array.isArray(parsed)) {
            imageList = parsed.map((img: string) => {
              if (img && !img.startsWith('http')) {
                return `${BASE_URL}${img}`;
              }
              return img;
            });
          }
        } catch (e) {
          imageList = [];
        }
        
        let userInfo = item.userInfo || item.user || item.author || null;
        
        if (!userInfo || (!userInfo.avatarUrl && !userInfo.avatar && !userInfo.username)) {
          if (item.userId && userInfos.has(item.userId)) {
            userInfo = userInfos.get(item.userId);
          }
        }
        
        if (!userInfo) {
          userInfo = {};
        }
        
        const avatarUrl = userInfo.avatarUrl || userInfo.avatar || userInfo.avatar_url || userInfo.headImg || '';
        const username = userInfo.username || userInfo.userName || userInfo.nickname || userInfo.nickName || '用户';
        
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          userInfo.avatarUrl = `${BASE_URL}${avatarUrl}`;
        } else {
          userInfo.avatarUrl = avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`;
        }
        userInfo.username = username;
        item.userInfo = userInfo;
        
        return {
          ...item,
          coverImage,
          imageList,
          imageHeight: getRandomHeight()
        };
      });
      setActivityList(activities);
      distributeToColumns(activities);
    } catch (error) {
      console.error('获取动态数据失败:', error);
      loadMockActivityData();
    } finally {
      setActivityLoading(false);
    }
  };

  const loadMockActivityData = () => {
    const mockActivities: WaterfallItem[] = [
      {
        activityId: 'act_001',
        userId: 'user_001',
        activityType: '开箱',
        title: 'Dimoo梦境之旅开箱分享',
        content: '今天收到了期待已久的Dimoo梦境之旅系列，分享一下开箱体验...',
        coverImage: `${BASE_URL}/images/jrtj/1.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/1.jpg`, `${BASE_URL}/images/jrtj/2.jpg`],
        location: '上海市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 125,
        likeCount: 23,
        commentCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        publishedAt: '2026-02-04 18:39:03',
        updatedAt: '2026-02-04 18:39:03',
        userInfo: {
          userId: 'user_001',
          username: '潮玩达人',
          avatarUrl: `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
        },
        imageHeight: 160
      },
      {
        activityId: 'act_002',
        userId: 'user_002',
        activityType: '展示',
        title: '我的Sonny Angel收藏',
        content: '收集了各种Sonny Angel，最喜欢的是兔子款...',
        coverImage: `${BASE_URL}/images/jrtj/2.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/2.jpg`],
        location: '北京市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 89,
        likeCount: 15,
        commentCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        publishedAt: '2026-02-04 18:39:03',
        updatedAt: '2026-02-04 18:39:03',
        userInfo: {
          userId: 'user_002',
          username: '收藏家小王',
          avatarUrl: `${BASE_URL}/images/avatar/3af1b8e1-636f-4673-b42f-59db768dd7b9.jpg`
        },
        imageHeight: 140
      },
      {
        activityId: 'act_003',
        userId: 'user_003',
        activityType: '评测',
        title: '泡泡玛特盲盒质量评测',
        content: '对比了几个系列的泡泡玛特产品，分享一下质量感受...',
        coverImage: `${BASE_URL}/images/jrtj/3.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/3.jpg`, `${BASE_URL}/images/jrtj/4.jpg`],
        location: '广州市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 325,
        likeCount: 45,
        commentCount: 12,
        favoriteCount: 8,
        shareCount: 3,
        publishedAt: '2024-04-15 14:20:00',
        updatedAt: '2026-02-10 21:50:15',
        userInfo: {
          userId: 'user_003',
          username: '评测专家',
          avatarUrl: `${BASE_URL}/images/avatar/3d08ed58-8549-4c69-9376-b991fcff737f.jpg`
        },
        imageHeight: 180
      },
      {
        activityId: 'act_004',
        userId: 'user_004',
        activityType: '分享',
        title: '新入手的限量版手办',
        content: '终于抢到了这款限量版手办，太开心了！',
        coverImage: `${BASE_URL}/images/jrtj/4.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/4.jpg`],
        location: '深圳市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 256,
        likeCount: 67,
        commentCount: 8,
        favoriteCount: 12,
        shareCount: 5,
        publishedAt: '2024-04-16 10:30:00',
        updatedAt: '2024-04-16 10:30:00',
        userInfo: {
          userId: 'user_004',
          username: '手办收藏家',
          avatarUrl: `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
        },
        imageHeight: 150
      },
      {
        activityId: 'act_005',
        userId: 'user_005',
        activityType: '开箱',
        title: 'SKULLPANDA新品开箱',
        content: 'SKULLPANDA的新款太可爱了，分享一下开箱过程',
        coverImage: `${BASE_URL}/images/jrtj/5.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/5.jpg`],
        location: '杭州市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 189,
        likeCount: 34,
        commentCount: 5,
        favoriteCount: 6,
        shareCount: 2,
        publishedAt: '2024-04-17 15:20:00',
        updatedAt: '2024-04-17 15:20:00',
        userInfo: {
          userId: 'user_005',
          username: '潮玩爱好者',
          avatarUrl: `${BASE_URL}/images/avatar/3af1b8e1-636f-4673-b42f-59db768dd7b9.jpg`
        },
        imageHeight: 170
      },
      {
        activityId: 'act_006',
        userId: 'user_006',
        activityType: '展示',
        title: '我的盲盒收藏展示',
        content: '分享一下我收集的盲盒，有几百个了！',
        coverImage: `${BASE_URL}/images/jrtj/1.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/1.jpg`],
        location: '成都市',
        publishStatus: 'published',
        auditStatus: '已通过',
        viewCount: 412,
        likeCount: 89,
        commentCount: 15,
        favoriteCount: 23,
        shareCount: 8,
        publishedAt: '2024-04-18 09:45:00',
        updatedAt: '2024-04-18 09:45:00',
        userInfo: {
          userId: 'user_006',
          username: '盲盒达人',
          avatarUrl: `${BASE_URL}/images/avatar/3d08ed58-8549-4c69-9376-b991fcff737f.jpg`
        },
        imageHeight: 130
      }
    ];
    setActivityList(mockActivities);
    distributeToColumns(mockActivities);
  };

  const goToActivityDetail = (activityId: string) => {
    router.push(`/activity/${activityId}`);
  };

  useEffect(() => {
    fetchSeriesData();
    fetchActivityData();
    fetchBlindBoxMachine();
  }, []);

  const renderWaterfallItem = (item: WaterfallItem) => (
    <TouchableOpacity
      key={item.activityId}
      style={styles.waterfallItem}
      onPress={() => goToActivityDetail(item.activityId)}
    >
      <Image
        source={{ uri: item.coverImage }}
        style={[styles.waterfallImage, { height: item.imageHeight }]}
        resizeMode="cover"
      />
      <View style={styles.waterfallInfo}>
        <Text style={styles.waterfallTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.waterfallMeta}>
          <View style={styles.waterfallAuthor}>
            <Image
              source={{ uri: item.userInfo?.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
              style={styles.waterfallAvatar}
            />
            <Text style={styles.waterfallAuthorName} numberOfLines={1}>
              {item.userInfo?.username || '用户'}
            </Text>
          </View>
          <View style={styles.waterfallStats}>
            <Svg width={13} height={13} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M934.176 168.48c-116.128-115.072-301.824-117.472-422.112-9.216-120.32-108.256-305.952-105.856-422.144 9.216a301.44 301.44 0 0 0 0 429.28l353.696 350.112a97.344 97.344 0 0 0 136.896 0L934.208 597.76a301.376 301.376 0 0 0-0.032-429.28z m-45.6 384.096L534.88 902.688a32.384 32.384 0 0 1-45.6 0L135.584 552.576a238.176 238.176 0 0 1 0-338.912c91.008-90.08 237.312-93.248 333.088-7.104l43.392 39.04 43.36-39.04c95.808-86.144 242.112-83.008 333.12 7.104a238.208 238.208 0 0 1 0.032 338.912z"
                fill="#999"
              />
              <Path
                d="M296.096 240.032l-0.128 0.032a136 136 0 0 0-135.872 135.968 16 16 0 0 0 32 0v-0.032a104 104 0 0 1 103.968-103.968h0.032a16 16 0 0 0 0-32z"
                fill="#999"
              />
            </Svg>
            <Text style={styles.waterfallStatText}>{item.likeCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.page}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <ImageBackground 
          source={{ uri: `${BASE_URL}/images/index/back.png` }}
          resizeMode="stretch"
        >
          <View style={styles.container}>
            <View style={styles.search1}>
              <Svg width={20} height={20} viewBox="0 0 1026 1024">
                <Path 
                  d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
                  fill="rgba(0,0,0,0.7)" 
                />
              </Svg>
              <TextInput
                style={styles.search}
                placeholder="搜索标签、款式..."
                placeholderTextColor="rgba(0,0,0,0.5)"
              />
            </View>
          </View>
        </ImageBackground>

        {bannerList.length > 0 && (
          <FlatList
            horizontal
            data={bannerList}
            keyExtractor={(item) => item.bannerId}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const imageUrl = item.imageUrl?.startsWith('http') ? item.imageUrl : `${BASE_URL}${item.imageUrl}`;
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleBannerPress(item)}
                  style={[styles.swiperItem, { width }]}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={[styles.swiperItem, { width }]}
                    resizeMode="stretch"
                  />
                </TouchableOpacity>
              );
            }}
            style={styles.swiperContainer}
          />
        )}

        <View style={styles.box1}>
          <View style={styles.trapezoidContainer}>
            <Link href="/ai-discover" style={styles.trapezoidLeft}>
              <LinearGradient
                colors={['#a2abfacc', '#2c35bbcc']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradientFullFill}
              >
                <View style={styles.trapezoidContent}>
                  <Text style={styles.trapezoidTitle}>AI发现</Text>
                  <View style={styles.trapezoidButton}>
                    <Text style={styles.trapezoidButtonText}>智能探索</Text>
                    <Svg width={11} height={11} viewBox="0 0 1024 1024" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
                      <Path
                        d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                        fill="#fff"
                      />
                    </Svg>
                  </View>
                </View>
                <Image
                  source={{ uri: `${BASE_URL}/images/index/1.png` }}
                  style={[styles.floatingImage, styles.floatingImageLeft]}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Link>
          </View>
          <View style={styles.trapezoidRight}>
            <Link href="/blind-box" style={styles.trapezoidRightTop}>
              <LinearGradient
                colors={['#FFD65CB3', '#FC5E0FCC']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientFullFill}
              >
                <View style={styles.trapezoidRightContentRow}>
                  <Image
                    source={{ uri: `${BASE_URL}/images/index/2.png` }}
                    style={styles.floatingImageInline}
                    resizeMode="contain"
                  />
                  <View style={styles.trapezoidRightText}>
                    <Text style={styles.trapezoidTitle}>抽盒机</Text>
                    <Text style={styles.trapezoidSubText}>在线抽盒</Text>
                  </View>
                </View>
              </LinearGradient>
            </Link>
            <Link href="/tujian" style={styles.trapezoidRightBottom}>
              <LinearGradient
                colors={['#FABEF0CC','#F046F0CC']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientFullFill}
              >
                <View style={styles.trapezoidRightContentRow}>
                  <Image
                    source={{ uri: `${BASE_URL}/images/index/3.png` }}
                    style={styles.floatingImageInline}
                    resizeMode="contain"
                  />
                  <View style={styles.trapezoidRightText}>
                    <Text style={styles.trapezoidTitle}>图鉴</Text>
                    <Text style={styles.trapezoidSubText}>款式大全</Text>
                  </View>
                </View>
              </LinearGradient>
            </Link>
          </View>
        </View>

        <View style={styles.recommendSeriesContainer}>
          <View style={styles.recommendSeriesHeader}>
            <Text style={styles.recommendSeriesTitle}>今日推荐系列</Text>
            <Link href="/shop" style={styles.moreLink}>
              <Text style={styles.moreText}>更多</Text>
              <Svg width={11} height={11} viewBox="0 0 1024 1024" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
                <Path
                  d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                  fill="#666666"
                />
              </Svg>
            </Link>
          </View>
          {loading ? (
            <ActivityIndicator style={styles.loading} color="#8069E1" />
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.seriesScrollView}
              contentContainerStyle={styles.seriesScrollContent}
            >
              {seriesList.map((item) => (
                <TouchableOpacity
                  key={item.series_id}
                  style={styles.recommendSeriesItem}
                  onPress={() => goToSeriesDetail(item.series_id)}
                >
                  <Image
                    source={typeof item.cover_image === 'string' ? { uri: item.cover_image } : item.cover_image}
                    style={styles.recommendSeriesImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.recommendSeriesName} numberOfLines={2}>
                    {item.series_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.activityContainer}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>推荐</Text>
            <Link href="/activity" style={styles.moreLink}>
              <Text style={styles.moreText}>更多</Text>
              <Svg width={11} height={11} viewBox="0 0 1024 1024" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
                <Path
                  d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                  fill="#666666"
                />
              </Svg>
            </Link>
          </View>
          {activityLoading ? (
            <ActivityIndicator style={styles.loading} color="#8069E1" />
          ) : (
            <View style={styles.waterfallContainer}>
              <View style={styles.waterfallColumn}>
                {leftColumn.map((item) => renderWaterfallItem(item))}
              </View>
              <View style={styles.waterfallColumn}>
                {rightColumn.map((item) => renderWaterfallItem(item))}
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 20
  },
  search1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  search: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  swiperContainer: {
    marginTop: -5,
  },
  swiperItem: {
    height: 160,
    borderRadius: 10,
  },
  // 三个入口卡片样式
  entryCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 15,
    height: 160,
    gap: 10,
  },
  entryCardLeft: {
    width: '40%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryCardLeftGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  entryCardEmoji: {
    fontSize: 28,
  },
  entryCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  entryCardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  entryCardsRight: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
  },
  entryCardRightTop: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryCardRightBottom: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryCardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  entryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryCardEmojiSmall: {
    fontSize: 18,
    marginRight: 6,
  },
  entryCardTitleSmall: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  entryCardInfo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  entryCardSubInfo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  box1: {
    flexDirection: 'row',
    marginTop: 20,
    height: 150,
    paddingHorizontal: 15,
  },
  aiRecommendEntry: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  aiRecommendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aiRecommendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiRecommendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
    marginRight: 12,
    overflow: 'hidden',
  },
  aiRecommendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiRecommendDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  recommendSeriesContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  recommendSeriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendSeriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  loading: {
    paddingVertical: 30,
  },
  seriesScrollView: {
    flexDirection: 'row',
  },
  seriesScrollContent: {
    paddingRight: 15,
  },
  recommendSeriesItem: {
    width: 90,
    marginRight: 12,
    alignItems: 'center',
  },
  recommendSeriesImage: {
    width: 90,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  recommendSeriesName: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  trapezoidContainer: {
    flex: 45,
    height: '100%',
  },
  trapezoidLeft: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  floatingImage: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  floatingImageLeft: {
    right: 10,
    bottom: 10,
  },
  floatingImageRightTop: {
    right: 5,
    bottom: 5,
  },
  floatingImageRightBottom: {
    right: 5,
    bottom: 5,
  },
  floatingImageInline: {
    width: 80,
    height: 80,
  },
  gradientFullFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  trapezoidContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  trapezoidTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  trapezoidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  trapezoidButtonText: {
    fontSize: 12,
    color: '#fff',
    marginRight: 5,
  },
  trapezoidRight: {
    flex: 55,
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  trapezoidRightContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  trapezoidRightText: {
    justifyContent: 'center',
  },
  trapezoidRightContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  trapezoidSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  trapezoidRightTop: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  trapezoidRightBottom: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  activityContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  waterfallContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterfallColumn: {
    width: '48.5%',
  },
  waterfallItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  waterfallImage: {
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  waterfallInfo: {
    padding: 10,
  },
  waterfallTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  waterfallMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterfallAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  waterfallAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
    backgroundColor: '#f5f5f5',
  },
  waterfallAuthorName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  waterfallStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterfallStatText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  bottomPadding: {
    height: 20,
  },
});
