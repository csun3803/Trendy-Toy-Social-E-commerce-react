import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { config } from '../../config';
import api from '../../utils/api';

const BASE_URL = config.RESOURCE_BASE_URL;

interface LikeNotification {
  interaction_id: string;
  user_id: string;
  target_id: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export default function LikeNotificationsScreen() {
  const [notifications, setNotifications] = useState<LikeNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interaction/notifications/likes');
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.records || data?.items || []);
      setNotifications(items);
    } catch (error) {
      console.error('获取点赞通知失败:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, []);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const renderItem = (item: LikeNotification) => {
    let avatarUrl = item.avatar_url || '';
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${BASE_URL}${avatarUrl}`;
    }
    return (
      <TouchableOpacity
        key={item.interaction_id}
        style={styles.notificationItem}
        onPress={() => router.push(`/activity/${item.target_id}` as any)}
      >
        <TouchableOpacity onPress={() => router.push(`/profile?userId=${item.user_id}` as any)}>
          <Image
            source={{ uri: avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.username}>{item.username || '用户'}</Text>
          <Text style={styles.actionText}>赞了你的动态</Text>
          <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        </View>
        <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
          <Path
            d="M934.176 168.48c-116.128-115.072-301.824-117.472-422.112-9.216-120.32-108.256-305.952-105.856-422.144 9.216a301.44 301.44 0 0 0 0 429.28l353.696 350.112a97.344 97.344 0 0 0 136.896 0L934.208 597.76a301.376 301.376 0 0 0-0.032-429.28z m-45.6 384.096L534.88 902.688a32.384 32.384 0 0 1-45.6 0L135.584 552.576a238.176 238.176 0 0 1 0-338.912c91.008-90.08 237.312-93.248 333.088-7.104l43.392 39.04 43.36-39.04c95.808-86.144 242.112-83.008 333.12 7.104a238.208 238.208 0 0 1 0.032 338.912z"
            fill="#FF6B9C"
          />
        </Svg>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>赞</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />}
      >
        {notifications.length > 0 ? (
          notifications.map(renderItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无点赞通知</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#999' },
  notificationItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  content: { flex: 1 },
  username: { fontSize: 15, fontWeight: '500', color: '#333' },
  actionText: { fontSize: 13, color: '#666', marginTop: 2 },
  time: { fontSize: 12, color: '#999', marginTop: 2 },
});
