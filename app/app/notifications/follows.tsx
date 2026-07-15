import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { config } from '../../config';
import api from '../../utils/api';

const BASE_URL = config.RESOURCE_BASE_URL;

interface FollowNotification {
  interaction_id: string;
  user_id: string;
  target_id: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export default function FollowNotificationsScreen() {
  const [notifications, setNotifications] = useState<FollowNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interaction/notifications/follows');
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.records || data?.items || []);
      setNotifications(items);
    } catch (error) {
      console.error('获取关注通知失败:', error);
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

  const renderItem = (item: FollowNotification) => {
    let avatarUrl = item.avatar_url || '';
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${BASE_URL}${avatarUrl}`;
    }
    return (
      <TouchableOpacity
        key={item.interaction_id}
        style={styles.notificationItem}
        onPress={() => router.push(`/profile?userId=${item.user_id}` as any)}
      >
        <Image
          source={{ uri: avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
          style={styles.avatar}
        />
        <View style={styles.content}>
          <Text style={styles.username}>{item.username || '用户'}</Text>
          <Text style={styles.actionText}>关注了你</Text>
          <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        </View>
        <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
          <Path
            d="M512 85.333333c117.824 0 213.333333 95.509333 213.333333 213.333334s-95.509333 213.333333-213.333333 213.333333-213.333333-95.509333-213.333333-213.333333S394.176 85.333333 512 85.333333z m234.666667 469.333334a170.666667 170.666667 0 1 1 0 341.333333H277.333333a170.666667 170.666667 0 1 1 0-341.333333h469.333334z"
            fill="#FF575D"
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
        <Text style={styles.headerTitle}>新增关注</Text>
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
            <Text style={styles.emptyText}>暂无新增关注</Text>
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
