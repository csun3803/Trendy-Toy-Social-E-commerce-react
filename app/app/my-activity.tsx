import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyActivities, deleteActivity } from '../services/activityService';
import type { SocialActivity } from '../types';
import { config } from '../config';

const BASE_URL = config.RESOURCE_BASE_URL;

const activityTypes = [
  { key: 'all', label: '全部' },
  { key: '开箱', label: '开箱' },
  { key: '展示', label: '展示' },
  { key: '评测', label: '评测' },
  { key: '分享', label: '分享' },
];

const getStatusInfo = (item: SocialActivity) => {
  if (item.publishStatus === 'draft' || (!item.auditStatus && item.publishStatus !== 'published')) {
    return { text: '编辑中', color: '#FF9800', bgColor: '#FFF3E0' };
  }
  if (item.auditStatus === '待审核') {
    return { text: '审核中', color: '#2196F3', bgColor: '#E3F2FD' };
  }
  if (item.auditStatus === '审核通过') {
    return { text: '已通过', color: '#4CAF50', bgColor: '#E8F5E9' };
  }
  if (item.auditStatus === '审核拒绝') {
    return { text: '未通过', color: '#F44336', bgColor: '#FFEBEE' };
  }
  return { text: '编辑中', color: '#FF9800', bgColor: '#FFF3E0' };
};

export default function MyActivityScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activityList, setActivityList] = useState<SocialActivity[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [userInfo, setUserInfo] = useState<any>(null);

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
        Alert.alert('提示', '请先登录', [
          { text: '确定', onPress: () => router.push('/login') }
        ]);
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
        activityType: activeTab === 'all' ? undefined : activeTab
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
        updatedAt: '2026-02-04 18:39:03'
      },
      {
        activityId: 'act_002',
        userId: 'user_001',
        activityType: '展示',
        title: '我的收藏展示',
        content: '展示一下我的收藏品...',
        coverImage: `${BASE_URL}/images/jrtj/2.jpg`,
        imageList: [`${BASE_URL}/images/jrtj/2.jpg`],
        location: '北京市',
        publishStatus: 'draft',
        auditStatus: '待审核',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        publishedAt: '2026-02-04 18:39:03',
        updatedAt: '2026-02-04 18:39:03'
      }
    ];
    setActivityList(mockActivities);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleDelete = (activityId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条动态吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(activityId);
              Alert.alert('成功', '动态已删除');
              fetchActivities();
            } catch (error) {
              console.error('删除动态失败:', error);
              Alert.alert('错误', '删除失败，请重试');
            }
          }
        }
      ]
    );
  };

  const goToEdit = (activityId?: string) => {
    if (activityId) {
      router.push(`/activity/edit/${activityId}`);
    } else {
      router.push('/activity/edit');
    }
  };

  const goToDetail = (activityId: string) => {
    router.push(`/activity/${activityId}`);
  };

  const renderActivityItem = ({ item }: { item: SocialActivity }) => {
    const statusInfo = getStatusInfo(item);
    const isRejected = item.auditStatus === '审核拒绝';
    const isPending = item.auditStatus === '待审核';
    const isApproved = item.auditStatus === '审核通过';
    const isDraft = item.publishStatus === 'draft' || (!item.auditStatus && item.publishStatus !== 'published');

    return (
      <TouchableOpacity style={styles.activityItem} onPress={() => goToDetail(item.activityId)}>
        <Image source={{ uri: item.coverImage }} style={styles.activityImage} />
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <View style={[styles.statusTag, { backgroundColor: statusInfo.bgColor }]}>
              <Text style={[styles.statusTagText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>
            <View style={[styles.typeTag, isDraft && styles.draftTag]}>
              <Text style={[styles.typeText, isDraft && styles.draftTypeText]}>
                {item.activityType}
              </Text>
            </View>
            <Text style={styles.activityDate}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.activityContentText} numberOfLines={2}>{item.content}</Text>
          {isRejected && item.auditNotes ? (
            <View style={styles.rejectInfo}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#F44336" />
              </Svg>
              <Text style={styles.rejectReason} numberOfLines={1}>拒绝原因：{item.auditNotes}</Text>
            </View>
          ) : null}
          {isPending ? (
            <View style={styles.pendingInfo}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#2196F3" />
              </Svg>
              <Text style={styles.pendingText}>正在审核中，请耐心等待</Text>
            </View>
          ) : null}
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
          <View style={styles.activityActions}>
            {(isDraft || isRejected) && (
              <TouchableOpacity style={styles.actionButton} onPress={() => goToEdit(item.activityId)}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#8069E1" />
                </Svg>
                <Text style={styles.actionText}>{isRejected ? '修改重提' : '编辑'}</Text>
              </TouchableOpacity>
            )}
            {isApproved && (
              <TouchableOpacity style={styles.actionButton} onPress={() => goToEdit(item.activityId)}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#8069E1" />
                </Svg>
                <Text style={styles.actionText}>编辑</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.activityId)}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#FF4444" />
              </Svg>
              <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>我的动态</Text>
        <TouchableOpacity onPress={() => goToEdit()} style={styles.addButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#8069E1" />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {activityTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.tab, activeTab === type.key && styles.activeTab]}
              onPress={() => setActiveTab(type.key)}
            >
              <Text style={[styles.tabText, activeTab === type.key && styles.activeTabText]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#8069E1" size="large" />
      ) : (
        <FlatList
          data={activityList}
          keyExtractor={(item) => item.activityId}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8069E1']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Svg width={80} height={80} viewBox="0 0 24 24">
                <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#ccc" />
              </Svg>
              <Text style={styles.emptyText}>暂无动态</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => goToEdit()}>
                <Text style={styles.emptyButtonText}>发布第一条动态</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  addButton: {
    padding: 5,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  draftTag: {
    backgroundColor: '#FFF3E0',
  },
  typeText: {
    fontSize: 11,
    color: '#8069E1',
  },
  draftTypeText: {
    color: '#FF9800',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  rejectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    gap: 4,
  },
  rejectReason: {
    fontSize: 11,
    color: '#F44336',
    flex: 1,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    color: '#2196F3',
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
    marginBottom: 8,
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
  activityActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 13,
    color: '#8069E1',
    marginLeft: 4,
  },
  deleteText: {
    color: '#FF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});
