import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { getActivityList } from '../../services/activityService';
import { getUserInfo } from '../../services/userService';
import type { SocialActivity } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;

const activityTypes = [
  { key: 'all', label: '全部' },
  { key: '开箱', label: '开箱' },
  { key: '展示', label: '展示' },
  { key: '评测', label: '评测' },
  { key: '分享', label: '分享' },
];

export default function ActivityListScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activityList, setActivityList] = useState<SocialActivity[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities(true);
  }, [activeTab]);

  const fetchActivities = async (isRefresh: boolean = false) => {
    if (loading) return;
    
    if (isRefresh) {
      setPage(1);
      setHasMore(true);
    }

    setLoading(true);
    try {
      const response = await getActivityList({
        page: isRefresh ? 1 : page,
        size: 20,
        activityType: activeTab === 'all' ? undefined : activeTab
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
      
      const activities = rawActivities.map((item: any) => {
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
          imageList
        };
      });

      if (isRefresh) {
        setActivityList(activities);
      } else {
        setActivityList([...activityList, ...activities]);
      }

      setHasMore(activities.length >= 20);
      if (!isRefresh) {
        setPage(page + 1);
      }
    } catch (error) {
      console.error('获取动态列表失败:', error);
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMockData = () => {
    const mockActivities: SocialActivity[] = [
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
        }
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
        }
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
        }
      }
    ];
    setActivityList(mockActivities);
    setHasMore(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities(true);
  };

  const onLoadMore = () => {
    if (hasMore && !loading) {
      fetchActivities(false);
    }
  };

  const goToDetail = (activityId: string) => {
    router.push(`/activity/${activityId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderActivityItem = ({ item }: { item: SocialActivity }) => (
    <TouchableOpacity style={styles.activityItem} onPress={() => goToDetail(item.activityId)}>
      <View style={styles.activityHeader}>
        <Image
          source={{ uri: item.userInfo?.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{item.userInfo?.username || '用户'}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{item.activityType}</Text>
            </View>
            <Text style={styles.time}>{formatDate(item.publishedAt)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
      
      {item.coverImage && (
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
      )}
      
      <View style={styles.activityFooter}>
        <View style={styles.statItem}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#999" />
          </Svg>
          <Text style={styles.statText}>{item.viewCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B9C" />
          </Svg>
          <Text style={styles.statText}>{item.likeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" fill="#999" />
          </Svg>
          <Text style={styles.statText}>{item.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#8069E1" />
        <Text style={styles.footerText}>加载中...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#333" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>动态广场</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={activityTypes}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.key && styles.activeTab]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.activeTabText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabList}
        />
      </View>

      <FlatList
        data={activityList}
        keyExtractor={(item) => item.activityId}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#8069E1',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typeTag: {
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  typeText: {
    fontSize: 11,
    color: '#8069E1',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  activityFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 10,
  },
});
