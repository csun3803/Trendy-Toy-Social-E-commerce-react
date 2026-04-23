import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';
import { getCabinetDetail, getCabinetItems } from '@/services/cabinetService';
import { Svg, Path } from 'react-native-svg';

const BASE_URL = config.RESOURCE_BASE_URL;

interface Cabinet {
  cabinetId: string;
  userId: string;
  cabinetName: string;
  description: string;
  isPublic: number;
  totalItems: number;
  totalValuation: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  coverImage?: string;
}

interface CabinetItem {
  itemId: string;
  cabinetId: string;
  productId: string;
  customName: string;
  displayNote: string;
  acquisitionMethod: string;
  acquisitionDate: string;
  acquisitionPrice: number;
  displayImage: string;
  addedAt: string;
  customTags: string;
  itemType: string;
  quantity: number;
  attributes: string;
  dimensions: string;
  productName?: string;
  productImage?: string;
}

interface UserInfo {
  userId: string;
  username: string;
  avatar?: string;
}

export default function CabinetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserInfo(parsed);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cabinetRes, itemsRes] = await Promise.all([
        getCabinetDetail(id as string),
        getCabinetItems(id as string)
      ]);
      
      if (cabinetRes.code === 200) {
        setCabinet(cabinetRes.data);
      }
      
      if (itemsRes.code === 200) {
        setItems(itemsRes.data || []);
      }
    } catch (error) {
      console.error('获取盒柜详情失败', error);
      Alert.alert('错误', '获取盒柜详情失败');
    } finally {
      setLoading(false);
    }
  };

  const goToItemDetail = (itemId: string) => {
    router.push(`/cabinet/item/${itemId}`);
  };

  const goToAddItem = () => {
    setMenuVisible(true);
  };

  const handleMenuSelect = (type: string) => {
    setMenuVisible(false);
    Alert.alert('提示', `${type}功能开发中`);
  };

  const renderItem = (item: CabinetItem) => {
    const displayImage = item.displayImage 
      ? (item.displayImage.startsWith('http') ? item.displayImage : `${BASE_URL}${item.displayImage}`)
      : item.productImage 
        ? (item.productImage.startsWith('http') ? item.productImage : `${BASE_URL}${item.productImage}`)
        : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20doll%20toy&image_size=square';

    return (
      <TouchableOpacity 
        key={item.itemId}
        style={styles.itemCard}
        onPress={() => goToItemDetail(item.itemId)}
      >
        <Image source={{ uri: displayImage }} style={styles.itemImage} />
        <View style={styles.itemOwnedBadge}>
          <Text style={styles.itemOwnedText}>已拥有</Text>
        </View>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.customName || item.productName || '未命名'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const userAvatar = userInfo?.avatar 
    ? (userInfo.avatar.startsWith('http') ? userInfo.avatar : `${BASE_URL}${userInfo.avatar}`)
    : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20avatar&image_size=square';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024">
              <Path 
                d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
                fill="#3C3C3C" 
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <svg
                t="1776321473649"
                className="icon"
                viewBox="0 0 1236 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="6777"
                width={25}
                height={25}
              >
                <path
                  d="M741.743 1018.343c-28.287 0-50.917-11.315-73.547-28.288-22.63-22.63-39.602-50.917-39.602-84.862V792.044c-124.464 0-328.133 33.945-435.624 181.039-16.973 28.287-56.575 45.26-90.52 50.917H85.478C28.903 1012.685-5.042 961.768 0.616 905.193c28.287-243.27 113.15-418.652 260.243-537.458 107.492-84.862 231.956-130.122 367.735-141.437V118.807c0-50.917 22.63-96.177 67.89-113.15C736.086-5.657 781.345 0 815.29 33.945l362.077 367.735c28.288 22.63 45.26 56.574 50.918 96.176 5.657 39.603-5.658 79.205-33.945 107.492-5.658 5.658-11.315 16.972-22.63 22.63l-350.762 356.42c-22.63 22.63-50.918 33.945-79.205 33.945z m-90.52-339.448h90.52v226.298l356.42-367.734 5.658-5.658c5.657-5.657 5.657-16.972 5.657-22.63 0-11.315-5.657-16.972-11.315-22.63l-5.657-5.657-356.42-362.077V333.79l-79.205 5.658c-118.806 0-231.956 39.602-328.132 113.149-113.15 90.519-186.696 237.613-209.326 429.967 141.436-175.382 390.364-203.669 531.8-203.669z"
                  p-id="6778"
                />
              </svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <svg
                t="1776321028294"
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="5791"
                width={25}
                height={25}
              >
                <path
                  d="M744.5 544.4c-10.6 0-21.1-4-29.2-12.1-16.1-16.1-16.1-42.3 0-58.4l122.5-122.5L670.4 184 547.7 306.4c-16.1 16.1-42.3 16.1-58.4 0s-16.1-42.3 0-58.4l124.9-124.9c30.9-30.9 79-33.1 107.2-4.8l182 182c28.2 28.2 26 76.3-4.9 107.2L773.6 532.3c-8 8.1-18.6 12.1-29.1 12.1z"
                  fill="#333333"
                  p-id="5792"
                />
                <path
                  d="M746.5 542.3c-10.6 0-21.1-4-29.2-12.1L491.4 304.3c-16.1-16.1-16.1-42.3 0-58.4s42.3-16.1 58.4 0l225.9 225.9c16.1 16.1 16.1 42.3 0 58.4-8 8.1-18.6 12.1-29.2 12.1z"
                  fill="#333333"
                  p-id="5793"
                />
                <path
                  d="M153.9 924.1c-15 0-29.4-5.8-39.9-16.4-13.1-13.1-18.8-32.1-15.3-50.8l43.6-231.4c4.6-24.3 17-47.5 35-65.5l312.1-312c16.1-16.1 42.3-16.1 58.4 0s16.1 42.3 0 58.4L235.7 618.5c-6.4 6.4-10.7 14.3-12.2 22.4l-36.6 194 194-36.6c8.1-1.5 16-5.9 22.4-12.2L715.4 474c16.1-16.1 42.3-16.1 58.4 0s16.1 42.3 0 58.4l-312.2 312c-18 18-41.2 30.4-65.4 35L164.7 923c-3.6 0.7-7.2 1.1-10.8 1.1z"
                  fill="#333333"
                  p-id="5794"
                />
              </svg>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.cabinetInfo}>
            <Text style={styles.cabinetName}>{cabinet?.cabinetName || '盒柜'}</Text>
            <View style={styles.cabinetStats}>
              <Text style={styles.statText}>已收录 {cabinet?.totalItems || 0} 🎒</Text>
              <Text style={styles.statText}>总价 •••• 💰</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Image 
              source={{ uri: userAvatar }} 
              style={styles.userAvatar} 
            />
            <Text style={styles.userName}>{userInfo?.username || '用户'}</Text>
            <View style={styles.popularity}>
              <Text style={styles.popularityEmoji}>👯‍♀️</Text>
              <Text style={styles.popularityLabel}>人气值</Text>
              <Text style={styles.popularityValue}>0</Text>
              <Text style={styles.popularityArrow}>∨</Text>
            </View>
            <TouchableOpacity style={styles.chatButton}>
              <Text style={styles.chatButtonText}>💬</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemsContainer}>
            <View style={styles.itemsGrid}>
              {items.map(renderItem)}
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={goToAddItem}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.menuHandle} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuSelect('订单导入')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#4ECDC4' }]}>
                <Text style={styles.menuIconText}>📦</Text>
              </View>
              <Text style={styles.menuItemText}>订单导入</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuSelect('自由导入')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FF6B9D' }]}>
                <Text style={styles.menuIconText}>✨</Text>
              </View>
              <Text style={styles.menuItemText}>自由导入</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleMenuSelect('图鉴导入')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.menuIconText}>📚</Text>
              </View>
              <Text style={styles.menuItemText}>图鉴导入</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  decorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  decoration: {
    position: 'absolute',
  },
  decoration1: {
    top: 80,
    left: 80,
  },
  decoration2: {
    top: 70,
    right: 60,
  },
  decoration3: {
    top: 130,
    left: 120,
  },
  decoration4: {
    top: 110,
    right: 20,
  },
  decorationText: {
    fontSize: 40,
  },
  content: {
    padding: 16,
  },
  cabinetInfo: {
    marginBottom: 24,
  },
  cabinetName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  cabinetStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  popularity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginRight: 12,
  },
  popularityEmoji: {
    fontSize: 16,
  },
  popularityLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  popularityValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  popularityArrow: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chatButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 18,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    width: '46%',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  itemOwnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFB6C1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemOwnedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 64,
    height: 64,
    backgroundColor: '#FFB6C1',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});
