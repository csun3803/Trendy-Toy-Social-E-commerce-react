import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { config } from '@/config';

const BASE_URL = config.RESOURCE_BASE_URL;

interface Conversation {
  conversationId: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  lastMessageAt: string;
  userAReadAt: string | null;
  userBReadAt: string | null;
  status: string;
  lastMessage?: string;
  lastMessageSentAt?: string;
}

interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  status: string;
  productId: string | null;
}

interface User {
  userId: string;
  username: string;
  avatarUrl: string;
}

const Message = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState('user_001'); // 假设当前用户是user_001

  // 导航到设置页面
  const goToSettings = () => {
    console.log('跳转到设置页面');
  };

  // 导航到搜索页面
  const goToSearch = () => {
    console.log('跳转到搜索页面');
  };

  // 标记所有消息为已读
  const markAllAsRead = async () => {
    try {
      console.log('开始标记所有消息为已读，用户ID:', currentUserId);
      console.log('请求URL:', `${config.API_BASE_URL}/messages/read-all?userId=${currentUserId}`);

      const response = await fetch(`${config.API_BASE_URL}/messages/read-all?userId=${currentUserId}`, {
        method: 'POST',
      });
      
      console.log('响应状态:', response.status);
      console.log('响应状态文本:', response.statusText);
      
      if (response.ok) {
        console.log('标记所有消息为已读成功');
        fetchConversations();
      } else {
        console.error('标记已读失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误信息:', errorText);
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error);
    }
  };

  // 导航到消息详情页面
  const goToMessageDetail = (conversationId: string) => {
    console.log(`跳转到与${conversationId}的消息详情`);
    router.push(`/message/${conversationId}`);
  };

  // 获取用户信息
  const fetchUserInfo = async (userId: string) => {
    try {
      console.log('开始获取用户信息，用户ID:', userId);
      console.log('请求URL:', `${config.API_BASE_URL}/user/${userId}`);

      const response = await fetch(`${config.API_BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('获取用户信息响应状态:', response.status);
      
      if (response.ok) {
        const user = await response.json();
        console.log('用户信息:', user);
        setUsers(prev => ({ ...prev, [userId]: user.data }));
      } else {
        console.error('获取用户信息失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误信息:', errorText);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 获取会话的最后一条消息
  const fetchLastMessage = async (conversationId: string) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/messages/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const messages = data.data;
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setConversations(prev => prev.map(conv => {
            if (conv.conversationId === conversationId) {
              return { 
                ...conv, 
                lastMessage: lastMessage.content,
                lastMessageSentAt: lastMessage.sentAt 
              };
            }
            return conv;
          }));
        }
      }
    } catch (error) {
      console.error('获取最后一条消息失败:', error);
    }
  };

  // 获取会话列表
  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('开始获取会话列表，用户ID:', currentUserId);
      console.log('请求URL:', `${config.API_BASE_URL}/messages/conversations?userId=${currentUserId}`);

      const response = await fetch(`${config.API_BASE_URL}/messages/conversations?userId=${currentUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('响应状态:', response.status);
      console.log('响应状态文本:', response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('响应数据:', data);
        setConversations(data.data);
        
        // 获取相关用户信息
        const userIds = new Set<string>();
        data.data.forEach((conv: Conversation) => {
          if (conv.userAId !== currentUserId) userIds.add(conv.userAId);
          if (conv.userBId !== currentUserId) userIds.add(conv.userBId);
        });
        userIds.forEach(fetchUserInfo);
        
        // 获取每个会话的最后一条消息
        data.data.forEach((conv: Conversation) => {
          fetchLastMessage(conv.conversationId);
        });
      } else {
        console.error('请求失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误信息:', errorText);
      }
    } catch (error) {
      console.error('获取会话失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error);
      // 使用模拟数据作为 fallback
      setConversations([
        {
          conversationId: 'conv_001',
          userAId: 'user_001',
          userBId: 'user_002',
          createdAt: '2026-02-04T18:39:03',
          lastMessageAt: '2026-02-04T18:39:03',
          userAReadAt: '2026-02-04T18:40:00',
          userBReadAt: null,
          status: 'active',
          lastMessage: '当然可以！我也很喜欢Dimoo系列'
        },
        {
          conversationId: 'conv_002',
          userAId: 'user_001',
          userBId: 'user_003',
          createdAt: '2026-02-04T18:39:03',
          lastMessageAt: '2026-02-04T18:39:03',
          userAReadAt: null,
          userBReadAt: null,
          status: 'active',
          lastMessage: '你的开箱视频拍得真好'
        }
      ]);
      // 模拟用户信息
      setUsers({
        'user_002': { userId: 'user_002', username: 'Lucky', avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square' },
        'user_003': { userId: 'user_003', username: '小远', avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20puppy%20avatar%20with%20cute%20expression&image_size=square' }
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchConversations();
  }, []);

  // 获取对方用户信息
  const getOtherUser = (conv: Conversation) => {
    try {
      const otherUserId = conv.userAId === currentUserId ? conv.userBId : conv.userAId;
      const user = users[otherUserId];
      if (user) {
        return user;
      }
      return { userId: otherUserId, username: '未知用户', avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square' };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { userId: 'unknown', username: '未知用户', avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square' };
    }
  };

  // 格式化时间
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '刚刚';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (hours < 1) return '刚刚';
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return `${Math.floor(days / 7)}周前`;
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '刚刚';
    }
  };

  // 检查是否有未读消息
  const hasUnreadMessages = (conv: Conversation) => {
    try {
      if (conv.userAId === currentUserId) {
        return !conv.userAReadAt || (conv.userAReadAt && new Date(conv.lastMessageAt) > new Date(conv.userAReadAt));
      } else {
        return !conv.userBReadAt || (conv.userBReadAt && new Date(conv.lastMessageAt) > new Date(conv.userBReadAt));
      }
    } catch (error) {
      console.error('检查未读消息失败:', error);
      return false;
    }
  };

  return (
    <View style={styles.messagePage}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToSearch}>
          <Svg width={20} height={20} viewBox="0 0 1026 1024">
            <Path 
              d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
              fill="#2c2c2c" 
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息</Text>
        <TouchableOpacity onPress={goToSettings}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
            <Path 
              d="M543.711 80.574l325.712 188.05a64 64 0 0 1 32 55.426v376.099a64 64 0 0 1-32 55.425L543.71 943.624a64 64 0 0 1-64 0L154 755.574a64 64 0 0 1-32-55.425v-376.1a64 64 0 0 1 32-55.425l325.711-188.05a64 64 0 0 1 64 0z m-32 60.044L190 326.358V697.84l321.712 185.74 321.711-185.74V326.36l-321.71-185.74z m0 211.481c88.366 0 160 71.635 160 160 0 88.366-71.634 160-160 160-88.365 0-160-71.634-160-160 0-88.365 71.635-160 160-160z m0 64c-53.019 0-96 42.98-96 96s42.981 96 96 96c53.02 0 96-42.98 96-96s-42.98-96-96-96z" 
              fill="#2c2c2c" 
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 消息分类标签 */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/notifications/likes' as any)}>
            <View style={[styles.tabIcon, { backgroundColor: '#e8e1fe' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path
                  d="M663.018667 121.856l18.474666 10.666667A149.354667 149.354667 0 0 1 744.384 320h110.698667a128 128 0 0 1 126.72 146.112l-48.768 341.333333A128 128 0 0 1 806.314667 917.333333H469.333333a128 128 0 0 1-128-128V448c0-35.733333 14.634667-68.053333 38.250667-91.264l108.586667-188.032a128 128 0 0 1 174.848-46.848zM170.666667 915.349333h21.333333a85.333333 85.333333 0 0 0 85.333333-85.333333v-320a85.333333 85.333333 0 0 0-85.333333-85.333333H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333333v320a85.333333 85.333333 0 0 0 85.333334 85.333333z"
                  fill="#b178fd"
                />
              </Svg>
            </View>
            <Text style={styles.tabText}>赞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/notifications/follows' as any)}>
            <View style={[styles.tabIcon, { backgroundColor: '#fff1ee' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path
                  d="M512 85.333333c117.824 0 213.333333 95.509333 213.333333 213.333334s-95.509333 213.333333-213.333333 213.333333-213.333333-95.509333-213.333333-213.333333S394.176 85.333333 512 85.333333z m234.666667 469.333334a170.666667 170.666667 0 1 1 0 341.333333H277.333333a170.666667 170.666667 0 1 1 0-341.333333h469.333334z"
                  fill="#ff575d"
                />
              </Svg>
            </View>
            <Text style={styles.tabText}>新增关注</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/notifications/comments' as any)}>
            <View style={[styles.tabIcon, { backgroundColor: '#fff1df' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path
                  d="M810.666667 149.333333a128 128 0 0 1 128 128v362.666667a128 128 0 0 1-128 128h-184.896l-92.48 138.709333a25.6 25.6 0 0 1-5.056 5.610667l-2.026667 1.493333a25.6 25.6 0 0 1-33.834667-4.864l-1.664-2.24L398.229333 768H213.333333a128 128 0 0 1-128-128V277.333333a128 128 0 0 1 128-128h597.333334zM341.333333 426.666667h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z m192 0h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z m192 0h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z"
                  fill="#ffc500"
                />
              </Svg>
            </View>
            <Text style={styles.tabText}>评论互动</Text>
          </TouchableOpacity>
        </View>

        {/* 一键已读 */}
        <TouchableOpacity style={styles.readAllButton} onPress={markAllAsRead}>
          <Text style={styles.readAllText}>一键已读</Text>
        </TouchableOpacity>

        {/* 消息列表 */}
        <View style={styles.messageList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8069E1" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无消息</Text>
            </View>
          ) : (
            conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const unread = hasUnreadMessages(conversation);
              
              return (
                <TouchableOpacity 
                  key={conversation.conversationId} 
                  style={styles.messageItem} 
                  onPress={() => goToMessageDetail(conversation.conversationId)}
                >
                  <Image 
                    source={{ 
                      uri: `${BASE_URL}${otherUser.avatarUrl}` || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square` 
                    }} 
                    style={styles.avatar} 
                  />
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.userName}>{otherUser.username}</Text>
                      <Text style={styles.messageTime}>{formatTime(conversation.lastMessageSentAt || conversation.lastMessageAt)}</Text>
                    </View>
                    <Text style={styles.messageText} numberOfLines={1} ellipsizeMode="tail">{conversation.lastMessage || '暂无消息'}</Text>
                  </View>
                  {unread && <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  messagePage: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  readAllButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  readAllText: {
    fontSize: 14,
    color: '#8069E1',
    textAlign: 'right',
  },
  messageList: {
    backgroundColor: '#fff',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#FF4757',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  robotButton: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8069E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default Message;