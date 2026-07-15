import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { getFollowingList, toggleFollow } from '../services/interactionService';
import { config } from '../config';

const BASE_URL = config.RESOURCE_BASE_URL;

interface FollowingUser {
  userId: string;
  username: string;
  avatarUrl: string;
  followerCount: number;
}

export default function MyFollowingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingList, setFollowingList] = useState<FollowingUser[]>([]);

  const fetchFollowingList = async () => {
    try {
      const data = await getFollowingList();
      if (Array.isArray(data)) {
        setFollowingList(data);
      }
    } catch (error) {
      console.error('获取关注列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowingList();
  }, []);

  const handleUnfollow = async (userId: string) => {
    try {
      const data = await toggleFollow(userId);
      if (!data.following) {
        // 取消关注后从列表移除
        setFollowingList(followingList.filter(u => u.userId !== userId));
      }
    } catch (error) {
      console.error('取消关注失败:', error);
    }
  };

  const renderUserItem = (user: FollowingUser) => {
    let avatarUri = user.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`;
    if (avatarUri && !avatarUri.startsWith('http')) {
      avatarUri = `${BASE_URL}${avatarUri}`;
    }
    return (
      <View key={user.userId} style={styles.userItem}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
        />
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1}>{user.username}</Text>
        <Text style={styles.followerCount}>{user.followerCount || 0} 粉丝</Text>
      </View>
      <TouchableOpacity
        style={styles.unfollowBtn}
        onPress={() => handleUnfollow(user.userId)}
      >
        <Text style={styles.unfollowBtnText}>已关注</Text>
      </TouchableOpacity>
    </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#333" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的关注</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={followingList}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => renderUserItem(item)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchFollowingList();
            }}
            colors={['#8069E1']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无关注的用户</Text>
          </View>
        }
        contentContainerStyle={followingList.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  headerBack: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  followerCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  unfollowBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unfollowBtnText: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});
