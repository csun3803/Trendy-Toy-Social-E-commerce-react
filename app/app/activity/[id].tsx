import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { getActivityDetail, likeActivity, unlikeActivity } from '../../services/activityService';
import { getCommentList, createComment, likeComment, unlikeComment } from '../../services/commentService';
import { getUserInfo } from '../../services/userService';
import { getUserIdFromToken, getUserInfo as getCurrentUserInfo } from '../../utils/jwtHelper';
import { getSeriesByActivity } from '../../services/activitySeriesService';
import { toggleFollow, toggleLike as toggleInteractionLike, toggleFavorite as toggleInteractionFavorite } from '../../services/interactionService';
import type { SocialActivity, Comment, SeriesDetail } from '../../types';
import { config } from '../../config';

const BASE_URL = config.RESOURCE_BASE_URL;
const { width } = Dimensions.get('window');

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<SocialActivity | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [relatedSeries, setRelatedSeries] = useState<SeriesDetail[]>([]);
  const [isSelf, setIsSelf] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchActivityDetail();
      fetchComments();
      fetchRelatedSeries();
    }
  }, [id]);

  const fetchRelatedSeries = async () => {
    if (!id) return;
    setSeriesLoading(true);
    try {
      console.log('[动态详情] 开始获取关联系列，activityId:', id);
      const response = await getSeriesByActivity(id as string);
      console.log('[动态详情] 关联系列响应:', response);
      if (response.code === 200 || response.message === 'success') {
        const data = response.data;
        console.log('[动态详情] 关联系列数据:', data);
        const seriesList = data.records || data.list || data.items || data || [];
        console.log('[动态详情] 处理后的系列列表:', seriesList);
        setRelatedSeries(seriesList);
      }
    } catch (error) {
      console.error('[动态详情] 获取关联系列失败:', error);
      loadMockRelatedSeries();
    } finally {
      setSeriesLoading(false);
    }
  };

  const loadMockRelatedSeries = () => {
    const mockSeries: SeriesDetail[] = [
      {
        seriesId: 'series_001',
        seriesName: 'Dimoo梦境之旅',
        description: 'Dimoo带你进入梦幻世界',
        coverImage: `${BASE_URL}/images/jrtj/1.jpg`,
        minPrice: 69,
        fullsetPrice: 828,
        status: 'ON_SALE',
        ipAlbumId: '',
        theme: 'Dimoo',
        releaseYear: '2024',
        regularVariants: 12,
        hiddenVariants: 2,
        totalVariants: 14,
        seriesHotness: 9560,
        startDate: '2024-01-15',
        salesCount: 3250,
        products: []
      }
    ];
    setRelatedSeries(mockSeries);
  };

  const fetchComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const response = await getCommentList(id as string, { page: 1, size: 50 });
      if (response.code === 200 || response.message === 'success') {
        const data = response.data;
        setComments(data.records || data.list || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      loadMockComments();
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadMockComments = () => {
    const mockComments: Comment[] = [
      {
        commentId: '1',
        activityId: id as string,
        userId: 'user2',
        content: '这个开箱视频太棒了！',
        auditStatus: '已通过',
        likeCount: 15,
        replyCount: 2,
        commentedAt: new Date(Date.now() - 3600000).toISOString(),
        userInfo: {
          userId: 'user2',
          username: '玩具收藏家',
          avatarUrl: `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
        },
        replies: [
          {
            commentId: '2',
            activityId: id as string,
            userId: 'user3',
            parentCommentId: '1',
            rootCommentId: '1',
            content: '同意！我也买了这个系列',
            auditStatus: '已通过',
            likeCount: 5,
            replyCount: 0,
            commentedAt: new Date(Date.now() - 1800000).toISOString(),
            userInfo: {
              userId: 'user3',
              username: '潮玩爱好者',
              avatarUrl: `${BASE_URL}/images/avatar/3af1b8e1-636f-4673-b42f-59db768dd7b9.jpg`
            }
          }
        ]
      },
      {
        commentId: '3',
        activityId: id as string,
        userId: 'user4',
        content: '这个隐藏款太好看了！羡慕！',
        auditStatus: '已通过',
        likeCount: 8,
        replyCount: 0,
        commentedAt: new Date(Date.now() - 7200000).toISOString(),
        userInfo: {
          userId: 'user4',
          username: '盲盒控',
          avatarUrl: `${BASE_URL}/images/avatar/3d08ed58-85b9-4c69-9376-b991fcff737.jpg`
        }
      }
    ];
    setComments(mockComments);
  };

  const fetchActivityDetail = async () => {
    setLoading(true);
    try {
      const response = await getActivityDetail(id as string);
      const data = response.data as any;
      let activityData = data;
      
      if (activityData.coverImage && !activityData.coverImage.startsWith('http')) {
        activityData.coverImage = `${BASE_URL}${activityData.coverImage}`;
      }
      
      let imageList: string[] = [];
      try {
        const parsed = typeof activityData.imageList === 'string' 
          ? JSON.parse(activityData.imageList) 
          : activityData.imageList;
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
      activityData.imageList = imageList;
      
      let userInfo = activityData.userInfo || activityData.user || activityData.author || null;
      
      if (!userInfo || (!userInfo.avatarUrl && !userInfo.avatar && !userInfo.username)) {
        if (activityData.userId) {
          const fetchedUserInfo = await getUserInfo(activityData.userId);
          if (fetchedUserInfo) {
            userInfo = fetchedUserInfo;
          }
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
      activityData.userInfo = userInfo;
      
      // 读取后端返回的点赞和关注状态
      if (activityData.isLiked !== undefined) {
        setIsLiked(activityData.isLiked);
      }
      if (activityData.isFavorited !== undefined) {
        setIsFavorited(activityData.isFavorited);
      }
      if (activityData.isFollowing !== undefined) {
        setIsFollowing(activityData.isFollowing);
      }
      // 判断是否是自己发的帖
      const currentUserId = await getUserIdFromToken();
      if (currentUserId && activityData.userId === currentUserId) {
        setIsSelf(true);
      }
      // 使用真实统计数据
      if (activityData.realViewCount !== undefined) {
        activityData.viewCount = activityData.realViewCount;
      }
      if (activityData.realLikeCount !== undefined) {
        activityData.likeCount = activityData.realLikeCount;
      }
      if (activityData.realFavoriteCount !== undefined) {
        activityData.favoriteCount = activityData.realFavoriteCount;
      }
      
      setActivity(activityData);
    } catch (error) {
      console.error('获取动态详情失败:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockActivity: SocialActivity = {
      activityId: id as string,
      userId: 'user_001',
      activityType: '开箱',
      title: 'Dimoo梦境之旅开箱分享',
      content: '今天收到了期待已久的Dimoo梦境之旅系列，分享一下开箱体验。包装非常精美，每个盲盒都很有质感。抽到了隐藏款，太开心了！\n\n分享一下开箱感受：\n1. 包装设计很用心，每个盒子都有独特的图案\n2. 手办做工精细，没有瑕疵\n3. 隐藏款的设计非常特别，值得收藏\n\n推荐大家入手这个系列，性价比很高！',
      coverImage: `${BASE_URL}/images/jrtj/1.jpg`,
      imageList: [
        `${BASE_URL}/images/jrtj/1.jpg`,
        `${BASE_URL}/images/jrtj/2.jpg`,
        `${BASE_URL}/images/jrtj/3.jpg`
      ],
      location: '上海市',
      publishStatus: 'published',
      auditStatus: '已通过',
      viewCount: 325,
      likeCount: 45,
      commentCount: 12,
      favoriteCount: 8,
      shareCount: 3,
      publishedAt: '2024-04-15 14:20:00',
      updatedAt: '2024-04-15 14:20:00',
      userInfo: {
        userId: 'user_001',
        username: '潮玩达人',
        avatarUrl: `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
      }
    };
    setActivity(mockActivity);
  };

  const handleLike = async () => {
    if (!activity) return;

    try {
      const data = await toggleInteractionLike('ACTIVITY', activity.activityId);
      setIsLiked(data.liked);
      setActivity({ ...activity, likeCount: data.likeCount });
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleFavorite = async () => {
    if (!activity) return;

    try {
      const data = await toggleInteractionFavorite('ACTIVITY', activity.activityId);
      setIsFavorited(data.favorited);
      setActivity({ ...activity, favoriteCount: data.favoriteCount });
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  const handleFollow = async () => {
    if (!activity?.userId) return;
    try {
      const data = await toggleFollow(activity.userId);
      setIsFollowing(data.following);
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };

  const handleCommentLike = async (comment: Comment) => {
    try {
      if (likedComments.has(comment.commentId)) {
        await unlikeComment(comment.commentId);
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(comment.commentId);
          return newSet;
        });
        updateCommentLikeCount(comment.commentId, -1);
      } else {
        await likeComment(comment.commentId);
        setLikedComments(prev => new Set(prev).add(comment.commentId));
        updateCommentLikeCount(comment.commentId, 1);
      }
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const updateCommentLikeCount = (commentId: string, delta: number) => {
    const updateCommentInList = (list: Comment[]): Comment[] => {
      return list.map(comment => {
        if (comment.commentId === commentId) {
          return { ...comment, likeCount: comment.likeCount + delta };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentInList(comment.replies) };
        }
        return comment;
      });
    };
    setComments(updateCommentInList(comments));
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !id) return;
    
    try {
      const userId = await getUserIdFromToken();
      const currentUser = await getCurrentUserInfo();
      
      const response = await createComment({
        activityId: id as string,
        userId: userId || '',
        content: commentInput,
        parentCommentId: replyTo?.commentId,
        rootCommentId: replyTo?.rootCommentId || replyTo?.commentId
      });
      
      if (response.code === 200 || response.message === 'success') {
        let newComment = response.data;
        if (!newComment.userInfo && currentUser) {
          newComment = {
            ...newComment,
            userInfo: {
              userId: currentUser.userId || userId || '',
              username: currentUser.username || '我',
              avatarUrl: currentUser.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
            }
          };
        }
        if (replyTo) {
          setComments(comments.map(c => {
            if (c.commentId === (replyTo.rootCommentId || replyTo.commentId)) {
              return {
                ...c,
                replyCount: c.replyCount + 1,
                replies: [...(c.replies || []), newComment]
              };
            }
            return c;
          }));
        } else {
          setComments([newComment, ...comments]);
          if (activity) {
            setActivity({ ...activity, commentCount: activity.commentCount + 1 });
          }
        }
        setCommentInput('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      addMockComment();
    }
  };

  const addMockComment = async () => {
    const userId = await getUserIdFromToken();
    const currentUser = await getCurrentUserInfo();
    
    const newComment: Comment = {
      commentId: Date.now().toString(),
      activityId: id as string,
      userId: userId || 'currentUser',
      content: commentInput,
      auditStatus: '已通过',
      likeCount: 0,
      replyCount: 0,
      commentedAt: new Date().toISOString(),
      userInfo: {
        userId: userId || 'currentUser',
        username: currentUser?.username || '我',
        avatarUrl: currentUser?.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg`
      }
    };
    
    if (replyTo) {
      setComments(comments.map(c => {
        if (c.commentId === (replyTo.rootCommentId || replyTo.commentId)) {
          return {
            ...c,
            replyCount: c.replyCount + 1,
            replies: [...(c.replies || []), { ...newComment, replyToUserInfo: replyTo.userInfo }]
          };
        }
        return c;
      }));
    } else {
      setComments([newComment, ...comments]);
      if (activity) {
        setActivity({ ...activity, commentCount: activity.commentCount + 1 });
      }
    }
    setCommentInput('');
    setReplyTo(null);
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
        return `${Math.max(1, minutes)}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSeriesImageUrl = (imageUrl: string | string[] | null | undefined): string => {
    if (!imageUrl) return DEFAULT_PLACEHOLDER;
    
    let url: string;
    if (Array.isArray(imageUrl)) {
      url = imageUrl[0];
    } else if (typeof imageUrl === 'string') {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) {
          url = parsed[0];
        } else {
          url = imageUrl;
        }
      } catch (e) {
        url = imageUrl;
      }
    } else {
      return DEFAULT_PLACEHOLDER;
    }
    
    if (!url) return DEFAULT_PLACEHOLDER;
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      url = `${BASE_URL}${url}`;
    }
    return url;
  };

  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.commentId} style={[styles.commentItem, isReply && styles.replyItem]}>
      <Image
        source={{ uri: comment.userInfo?.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{comment.userInfo?.username || '用户'}</Text>
          <Text style={styles.commentTime}>{formatDate(comment.commentedAt)}</Text>
        </View>
        <View style={styles.commentTextContainer}>
          {comment.replyToUserInfo && (
            <Text style={styles.replyToText}>
              回复 {comment.replyToUserInfo.username}：
            </Text>
          )}
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => handleCommentLike(comment)}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={likedComments.has(comment.commentId) ? '#FF6B9C' : '#999'}
              />
            </Svg>
            <Text style={[styles.commentActionText, likedComments.has(comment.commentId) && styles.likedCommentText]}>
              {comment.likeCount}
            </Text>
          </TouchableOpacity>
          {!isReply && (
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => setReplyTo(comment)}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" fill="#999" />
              </Svg>
              <Text style={styles.commentActionText}>回复</Text>
            </TouchableOpacity>
          )}
        </View>
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>动态不存在或已删除</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = activity.imageList && Array.isArray(activity.imageList) && activity.imageList.length > 0
    ? activity.imageList
    : [activity.coverImage];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#333" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>动态详情</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activity.auditStatus && activity.auditStatus !== '审核通过' && (
          <View style={[
            styles.auditStatusBar,
            activity.auditStatus === '待审核' ? styles.auditStatusPending : styles.auditStatusRejected
          ]}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              {activity.auditStatus === '待审核' ? (
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#2196F3" />
              ) : (
                <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#F44336" />
              )}
            </Svg>
            <Text style={[
              styles.auditStatusText,
              activity.auditStatus === '待审核' ? styles.auditStatusPendingText : styles.auditStatusRejectedText
            ]}>
              {activity.auditStatus === '待审核' ? '审核中' : '审核未通过'}
            </Text>
            {activity.auditStatus === '审核拒绝' && activity.auditNotes && (
              <Text style={styles.auditNotesText}>原因：{activity.auditNotes}</Text>
            )}
          </View>
        )}
        <View style={styles.authorInfo}>
          <Image
            source={{ uri: activity.userInfo?.avatarUrl || `${BASE_URL}/images/avatar/2b054883-e5b1-41d1-be00-4dd8391a20c6.jpg` }}
            style={styles.authorAvatar}
          />
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{activity.userInfo?.username || '用户'}</Text>
            <Text style={styles.publishTime}>{formatDate(activity.publishedAt)}</Text>
          </View>
          {!isSelf && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? '已关注' : '+ 关注'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>{activity.title}</Text>

        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 30));
                setCurrentImageIndex(index);
              }}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.contentImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.indicatorText}>
                  {currentImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.contentText}>{activity.content}</Text>

        {activity.location && (
          <View style={styles.locationContainer}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#999" />
            </Svg>
            <Text style={styles.locationText}>{activity.location}</Text>
          </View>
        )}

        {/* 相关系列 */}
        <View style={styles.relatedSeriesSection}>
          <View style={styles.relatedSeriesHeader}>
            <Text style={styles.relatedSeriesTitle}>相关系列</Text>
            <TouchableOpacity style={styles.viewMoreBtn}>
              <Text style={styles.viewMoreText}>查看更多</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="#999" />
              </Svg>
            </TouchableOpacity>
          </View>
          {seriesLoading ? (
            <View style={styles.seriesLoadingContainer}>
              <ActivityIndicator size="small" color="#8069E1" />
            </View>
          ) : relatedSeries.length > 0 ? (
            <View style={styles.seriesListVertical}>
              {relatedSeries.map((series) => (
                <TouchableOpacity
                  key={series.seriesId}
                  style={styles.seriesCardVertical}
                  onPress={() => router.push(`/series/${series.seriesId}` as any)}
                >
                  <Image
                    source={{ uri: getSeriesImageUrl(series.coverImage) }}
                    style={styles.seriesCoverVertical}
                    resizeMode="cover"
                  />
                  <View style={styles.seriesInfoContainer}>
                    <Text style={styles.seriesNameVertical} numberOfLines={2}>
                      {series.seriesName}
                    </Text>
                    <Text style={styles.seriesDescVertical} numberOfLines={1}>
                      {series.description || '盲盒系列'}
                    </Text>
                    <View style={styles.seriesMetaContainer}>
                      <Text style={styles.seriesPriceVertical}>¥{series.minPrice}</Text>
                      <Text style={styles.seriesStatsVertical}>
                        {Math.floor(Math.random() * 5000) + 1000}人想要
                      </Text>
                    </View>
                  </View>
                  <View style={styles.seriesActionContainer}>
                    <TouchableOpacity style={styles.seriesLikeBtn}>
                      <Svg width={20} height={20} viewBox="0 0 24 24">
                        <Path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          fill="#999"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <Text style={styles.seriesWantText}>想要</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.seriesEmptyContainer}>
              <Text style={styles.seriesEmptyText}>暂无相关系列</Text>
            </View>
          )}
        </View>

        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>评论 {comments.length}</Text>
          </View>
          
          {commentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8069E1" />
            </View>
          ) : (
            comments.map(renderComment)
          )}
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.bottomBar}>
          {replyTo && (
            <View style={styles.replyBar}>
              <Text style={styles.replyText}>回复 {replyTo.userInfo?.username}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={styles.cancelReplyText}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder={replyTo ? `回复 ${replyTo.userInfo?.username}...` : '说点什么...'}
            value={commentInput}
            onChangeText={setCommentInput}
            multiline
          />
          {commentInput.trim().length > 0 && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSubmitComment}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#8069E1" />
              </Svg>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M934.176 168.48c-116.128-115.072-301.824-117.472-422.112-9.216-120.32-108.256-305.952-105.856-422.144 9.216a301.44 301.44 0 0 0 0 429.28l353.696 350.112a97.344 97.344 0 0 0 136.896 0L934.208 597.76a301.376 301.376 0 0 0-0.032-429.28z m-45.6 384.096L534.88 902.688a32.384 32.384 0 0 1-45.6 0L135.584 552.576a238.176 238.176 0 0 1 0-338.912c91.008-90.08 237.312-93.248 333.088-7.104l43.392 39.04 43.36-39.04c95.808-86.144 242.112-83.008 333.12 7.104a238.208 238.208 0 0 1 0.032 338.912z"
                fill={isLiked ? '#FF6B9C' : '#999'}
              />
              {isLiked && (
                <Path
                  d="M512 226.744l-43.392-39.04c-95.776-86.144-242.08-83.008-333.088 7.104a238.176 238.176 0 0 0 0 338.912L489.28 902.688a32.384 32.384 0 0 0 45.6 0l353.696-350.112a238.208 238.208 0 0 0 0.032-338.912c-91.008-90.08-237.312-93.248-333.12-7.104L512 226.744z"
                  fill="#FF6B9C"
                />
              )}
            </Svg>
            <Text style={[styles.actionText, isLiked && styles.likedText]}>{activity.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleFavorite}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M781.186088 616.031873q17.338645 80.573705 30.59761 145.848606 6.119522 27.537849 11.219124 55.075697t9.689243 49.976096 7.649402 38.247012 4.079681 19.888446q3.059761 20.398406-9.179283 27.027888t-27.537849 6.629482q-5.099602 0-14.788845-3.569721t-14.788845-5.609562l-266.199203-155.027888q-72.414343 42.836653-131.569721 76.494024-25.498008 14.278884-50.486056 28.557769t-45.386454 26.517928-35.187251 20.398406-19.888446 10.199203q-10.199203 5.099602-20.908367 3.569721t-19.378486-7.649402-12.749004-14.788845-2.039841-17.848606q1.01992-4.079681 5.099602-19.888446t9.179283-37.737052 11.729084-48.446215 13.768924-54.055777q15.298805-63.23506 34.677291-142.788845-60.175299-52.015936-108.111554-92.812749-20.398406-17.338645-40.286853-34.167331t-35.697211-30.59761-26.007968-22.438247-11.219124-9.689243q-12.239044-11.219124-20.908367-24.988048t-6.629482-28.047809 11.219124-22.438247 20.398406-10.199203l315.155378-28.557769 117.290837-273.338645q6.119522-16.318725 17.338645-28.047809t30.59761-11.729084q10.199203 0 17.848606 4.589641t12.749004 10.709163 8.669323 12.239044 5.609562 10.199203l114.231076 273.338645 315.155378 29.577689q20.398406 5.099602 28.557769 12.239044t8.159363 22.438247q0 14.278884-8.669323 24.988048t-21.928287 26.007968z"
                fill={isFavorited ? '#FFD700' : 'none'}
                stroke={isFavorited ? '#FFD700' : '#999'}
                strokeWidth={isFavorited ? "40" : "80"}
              />
            </Svg>
            <Text style={[styles.actionText, isFavorited && styles.favoritedText]}>{activity.favoriteCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => commentInputRef.current?.focus()}>
            <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
              <Path
                d="M722.3 874.32H522.93c-102.22 0-198.53-40.55-269.49-114.89S145.31 587.94 149.53 485.71c7.6-194.3 164.74-351.43 359.04-359.04 102.22-4.22 200.22 32.95 273.71 103.91S897.17 397 897.17 500.07c0 99.69-38.86 193.46-109.82 264.42v44.77c0 35.49-29.57 65.06-65.05 65.06z m-199.37-680.9H511.1c-158.82 5.91-288.08 135.17-293.99 293.99-3.38 84.48 27.03 164.74 85.32 224.72 58.29 60.83 136.86 93.77 220.49 93.77h196.84v-43.08c0-16.9 6.76-33.79 19.43-46.46 58.29-58.29 90.39-135.17 90.39-217.11 0-83.63-32.95-162.2-93.77-220.49-58.28-54.93-133.47-85.34-212.88-85.34z"
                fill="#999"
              />
              <Path
                d="M320.18 480.65c0 15.09 8.05 29.04 21.12 36.58a42.218 42.218 0 0 0 42.24 0 42.243 42.243 0 0 0 21.12-36.58 42.242 42.242 0 0 0-84.48 0zM480.69 480.65c0 23.33 18.91 42.24 42.24 42.24s42.24-18.91 42.24-42.24a42.242 42.242 0 0 0-84.48 0zM641.2 480.65c0 23.33 18.91 42.24 42.24 42.24s42.24-18.91 42.24-42.24c0-23.33-18.91-42.24-42.24-42.24s-42.24 18.91-42.24 42.24z"
                fill="#999"
              />
            </Svg>
            <Text style={styles.actionText}>{activity.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  auditStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  auditStatusPending: {
    backgroundColor: '#E3F2FD',
  },
  auditStatusRejected: {
    backgroundColor: '#FFEBEE',
  },
  auditStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  auditStatusPendingText: {
    color: '#2196F3',
  },
  auditStatusRejectedText: {
    color: '#F44336',
  },
  auditNotesText: {
    fontSize: 12,
    color: '#F44336',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
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
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  publishTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  typeTag: {
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#8069E1',
  },
  followBtn: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
  },
  followBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  followingBtnText: {
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 26,
  },
  imageContainer: {
    marginBottom: 15,
  },
  contentImage: {
    width: width - 30,
    height: (width - 30) * 0.75,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  statText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 15,
  },
  commentPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  actionBtn: {
    alignItems: 'center',
    marginLeft: 15,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  likedText: {
    color: '#FF6B9C',
  },
  favoritedText: {
    color: '#FFD700',
  },
  commentsSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsHeader: {
    marginBottom: 15,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  replyItem: {
    marginTop: 15,
    marginBottom: 0,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 10,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  replyToText: {
    fontSize: 14,
    color: '#8069E1',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentActionText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  likedCommentText: {
    color: '#FF6B9C',
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  replyText: {
    fontSize: 14,
    color: '#666',
  },
  cancelReplyText: {
    fontSize: 14,
    color: '#8069E1',
  },
  sendBtn: {
    padding: 10,
    marginLeft: 5,
  },
  relatedSeriesSection: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  relatedSeriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  relatedSeriesTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 13,
    color: '#999',
    marginRight: 2,
  },
  seriesList: {
    marginHorizontal: -5,
  },
  seriesCard: {
    width: 120,
    marginHorizontal: 5,
  },
  seriesCover: {
    width: 120,
    height: 160,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  seriesName: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    lineHeight: 18,
  },
  seriesPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B9C',
    marginTop: 4,
  },
  seriesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  seriesEmptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  seriesEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  seriesListVertical: {
    gap: 12,
  },
  seriesCardVertical: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  seriesCoverVertical: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  seriesInfoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  seriesNameVertical: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  seriesDescVertical: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  seriesMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seriesPriceVertical: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B9C',
  },
  seriesStatsVertical: {
    fontSize: 12,
    color: '#999',
  },
  seriesActionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  seriesLikeBtn: {
    padding: 4,
  },
  seriesWantText: {
    fontSize: 12,
    color: '#333',
  },
});
