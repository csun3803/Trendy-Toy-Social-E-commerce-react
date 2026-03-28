import { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Dimensions, FlatList, ImageBackground, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Link, router } from 'expo-router';
import { getSeriesList } from '../../services/seriesService';
import type { SeriesItem } from '../../types';
import { config } from '../../config';


const BASE_URL = config.RESOURCE_BASE_URL;

const { width } = Dimensions.get('window');

export default function Index() {
  const [swiperList] = useState([
    { image: { uri: `${BASE_URL}/images/lbt/3.jpg` } },
    { image: { uri: `${BASE_URL}/images/lbt/2.png` } },
    { image: { uri: `${BASE_URL}/images/lbt/1.png` } }
  ]);

  const [loading, setLoading] = useState(false);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);

  const fetchSeriesData = async () => {
    setLoading(true);
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
            // 如果图片路径不是完整URL，添加后端基础路径
            if (coverImage && !coverImage.startsWith('http')) {
              coverImage = `${BASE_URL}${coverImage}`;
            }
          }
        } catch (e) {
          coverImage = item.coverImage || '';
          // 如果图片路径不是完整URL，添加后端基础路径
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
    } catch (error) {
      console.error('获取系列数据失败:', error);
      loadMockSeriesData();
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchSeriesData();
  }, []);

  return (
    <View style={styles.page}>
    <ImageBackground 
      source={{ uri: `${BASE_URL}/images/index/back.png` }}
      // style={styles.container}
      resizeMode="stretch" // 'cover', 'contain', 'stretch', 'repeat', 'center'
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
    <View>
      <FlatList
        horizontal
        data={swiperList}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled  // 启用分页
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image
            source={item.image}  
            style={[styles.swiperItem, { width }]}  // 设置宽度为屏幕宽度
            resizeMode="stretch"
          />
        )}
      />
    </View>



      <View style={styles.box1}>
        <Link href="/shop" style={styles.trapezoidContainer}>
          <View style={styles.trapezoidLeft}>
            <View style={styles.trapezoidContent}>
              <Text style={styles.trapezoidTitle}>热卖榜</Text>
              <View style={styles.trapezoidButton}>
                <Text style={styles.trapezoidButtonText}>爆款榜单</Text>
                <Svg width={16} height={16} viewBox="0 0 1024 1024">
                  <Path 
                    d="M338.944 176.928L847.072 512 338.944 847.072c-27.328 27.328-71.808 27.328-99.136 0s-27.328-71.808 0-99.136l414.08-414.08-414.08-414.08c-27.328-27.328-27.328-71.808 0-99.136s71.808-27.328 99.136 0z" 
                    fill="#fff" 
                  />
                </Svg>
              </View>
            </View>
            <View style={styles.trapezoidImageContainer}>
              <Image 
                source={require('../../assets/images/jrtj/1.jpg')} 
                style={styles.trapezoidImage} 
                resizeMode="contain"
              />
            </View>
          </View>
        </Link>
        <View style={styles.trapezoidRight}>
          <Link href="/shop" style={styles.trapezoidRightTop}>
            <View style={styles.trapezoidContent}>
              <Text style={styles.trapezoidTitle}>品牌馆</Text>
              <Image 
                source={require('../../assets/images/jrtj/2.jpg')} 
                style={styles.trapezoidBrandImage} 
                resizeMode="contain"
              />
            </View>
          </Link>
          <Link href="/tujian" style={styles.trapezoidRightBottom}>
            <View style={styles.trapezoidContent}>
              <Text style={styles.trapezoidTitle}>图鉴</Text>
              <Image 
                source={require('../../assets/images/jrtj/3.jpg')} 
                style={styles.trapezoidBrandImage} 
                resizeMode="contain"
              />
            </View>
          </Link>
        </View>
      </View>

      {/* 今日推荐系列 */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingHorizontal: 15,
    paddingTop: 100,
    paddingBottom: 20
  },
  search1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  search: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  swiperContainer: {
    marginTop: -5,
    height: 150,
    zIndex: 999,
  },
  swiperItem: {
    // width: 400,
    height: 150,
    marginTop: -5,
    // marginHorizontal: 15,
    borderRadius: 10,
  },
  box1: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 15,
    height: 150,
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
    flex: 1,
    marginRight: 10,
  },
  trapezoidLeft: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FF9A42',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  trapezoidContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  trapezoidTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
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
  trapezoidImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trapezoidImage: {
    width: 80,
    height: 80,
  },
  trapezoidRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  trapezoidRightTop: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  trapezoidRightBottom: {
    flex: 1,
    backgroundColor: '#FF6B9C',
    borderRadius: 10,
    overflow: 'hidden',
  },
  trapezoidBrandImage: {
    width: 60,
    height: 40,
    alignSelf: 'center',
  },

});