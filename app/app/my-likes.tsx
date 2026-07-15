import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { config } from '../config';
import api from '../utils/api';

const BASE_URL = config.RESOURCE_BASE_URL;

interface LikedActivity {
  activityId: string;
  title: string;
  coverImage: string;
  username?: string;
  avatarUrl?: string;
  likeCount?: number;
  viewCount?: number;
}

export default function MyLikesScreen() {
  const [activities, setActivities] = useState<LikedActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLikedActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interaction/likes/ACTIVITY');
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.records || data?.items || []);
      const mapped: LikedActivity[] = items.map((item: any) => {
        let coverImage = item.coverImage || '';
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = `${BASE_URL}${coverImage}`;
        }
        let avatarUrl = item.userInfo?.avatarUrl || item.avatarUrl || '';
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          avatarUrl = `${BASE_URL}${avatarUrl}`;
        }
        return {
          activityId: item.activityId || item.targetId || '',
          title: item.title || '',
          coverImage,
          username: item.userInfo?.username || item.username || '用户',
          avatarUrl,
          likeCount: item.likeCount || item.realLikeCount || 0,
          viewCount: item.viewCount || item.realViewCount || 0,
        };
      });
      setActivities(mapped);
    } catch (error) {
      console.error('获取点赞列表失败:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedActivities();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLikedActivities().finally(() => setRefreshing(false));
  }, []);

  const renderItem = (item: LikedActivity) => (
    <TouchableOpacity
      key={item.activityId}
      style={styles.activityItem}
      onPress={() => router.push(`/activity/${item.activityId}` as any)}
    >
      <Image
        source={{ uri: item.coverImage || `${BASE_URL}/images/placeholder.png` }}
        style={styles.activityImage}
        resizeMode="cover"
      />
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.activityMeta}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.activityAvatar} />
          ) : null}
          <Text style={styles.activityAuthor}>{item.username}</Text>
        </View>
        <View style={styles.activityStats}>
          <Text style={styles.activityStatText}>{item.likeCount} 赞</Text>
          <Text style={styles.activityStatText}>{item.viewCount} 浏览</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
              fill="#333"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的点赞</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
        }
      >
        {activities.length > 0 ? (
          activities.map(renderItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无点赞的动态</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  activityAuthor: {
    fontSize: 12,
    color: '#666',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  activityStatText: {
    fontSize: 11,
    color: '#999',
  },
});
