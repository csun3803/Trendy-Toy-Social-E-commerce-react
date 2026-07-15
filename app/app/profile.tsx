import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyActivities } from '../services/activityService';
import type { SocialActivity, UserInfo } from '../types';
import { config } from '../config';

const BASE_URL = config.RESOURCE_BASE_URL;

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activityList, setActivityList] = useState<SocialActivity[]>([]);
  const [activeTab, setActiveTab] = useState('public');

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchActivities();
    }
  }, [userInfo, activeTab]);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('读取用户信息失败:', error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await getMyActivities({
        page: 1,
        size: 20,
        publishStatus: activeTab === 'public' ? 'published' : undefined
      });
      const responseData = response.data as any;
      const activities = (responseData.records || responseData.list || responseData.items || []).map((item: any) => {
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
        return {
          ...item,
          coverImage,
          imageList
        };
      });
      setActivityList(activities);
    } catch (error) {
      console.error('获取动态列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    loadUserInfo();
  };

  const goToEdit = () => {
    router.push('/activity/edit');
  };

  const goToDetail = (activityId: string) => {
    router.push(`/activity/${activityId}`);
  };

  const renderActivityItem = ({ item }: { item: SocialActivity }) => (
    <TouchableOpacity style={styles.activityItem} onPress={() => goToDetail(item.activityId)}>
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.activityImage} />
      ) : (
        <View style={[styles.activityImage, styles.activityImagePlaceholder]} />
      )}
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{item.activityType}</Text>
          </View>
          <Text style={styles.activityDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.activityContentText} numberOfLines={2}>{item.content}</Text>
        <View style={styles.activityStats}>
          <View style={styles.statItem}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#999" />
            </Svg>
            <Text style={styles.statText}>{item.viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B9C" />
            </Svg>
            <Text style={styles.statText}>{item.likeCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  let avatarUrl = userInfo?.avatarUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square';
  if (avatarUrl && !avatarUrl.startsWith('http')) {
    avatarUrl = `${BASE_URL}${avatarUrl}`;
  }
  avatarUrl = avatarUrl.replace(/http:\/\/localhost:8080/g, BASE_URL);
  avatarUrl = avatarUrl.replace(/http:\/\/10\.0\.2\.2:8080/g, BASE_URL);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
        }
      >
        <LinearGradient
          colors={['#957BDE', '#53428D', '#3A2C58','#2C263E']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerBg}
        />

        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path 
              d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
              fill="#FFF" 
            />
          </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
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
                  fill="#FFF"
                />
              </svg>
          </TouchableOpacity>
        </View>

        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{userInfo?.username || '用户'}</Text>
          <Text style={styles.userStatus}>IP地址 浙江 · 1分钟前来过</Text>
          <Text style={styles.bioHint}>点击添加简介，让更多人认识你</Text>

          <TouchableOpacity style={styles.tagsButton}>
            <Text style={styles.tagsText}>+展示我的个性标签</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.interestButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fff" opacity={0.7}>
              <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </Svg>
            <Text style={styles.interestText}>添加你的兴趣档案</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userInfo?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>关注</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userInfo?.followerCount || 0}</Text>
              <Text style={styles.statLabel}>粉丝</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userInfo?.postCount || 0}</Text>
              <Text style={styles.statLabel}>获赞</Text>
            </View>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>编辑资料</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'public' && styles.activeTab]}
              onPress={() => setActiveTab('public')}
            >
              <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>公开</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'private' && styles.activeTab]}
              onPress={() => setActiveTab('private')}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill={activeTab === 'private' ? '#8069E1' : '#666'}>
                <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </Svg>
              <Text style={[styles.tabText, activeTab === 'private' && styles.activeTabText]}>私密</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loading} color="#8069E1" size="large" />
          ) : activityList.length > 0 ? (
            <FlatList
              data={activityList}
              keyExtractor={(item) => item.activityId}
              renderItem={renderActivityItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20empty%20notebook%20illustration%20with%20stars%20and%20bubbles&image_size=square' }}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyText}>是时候发布帖子了</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={goToEdit}>
                <Text style={styles.emptyButtonText}>去发帖</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 540,
    backgroundColor: '#8069E1',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  navButton: {
    padding: 5,
  },
  userSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 48,
    // borderWidth: 4,
    // borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  userStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  bioHint: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  tagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  tagsText: {
    fontSize: 14,
    color: '#fff',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  interestText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    marginRight: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editProfileButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  contentSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8069E1',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#8069E1',
    fontWeight: '500',
  },
  loading: {
    paddingVertical: 60,
  },
  listContent: {
    padding: 15,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityImage: {
    width: 100,
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  activityImagePlaceholder: {
    backgroundColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    color: '#8069E1',
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  activityContentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  activityStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  emptyButton: {
    borderWidth: 1,
    borderColor: '#8069E1',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#8069E1',
    fontSize: 16,
  },
});
