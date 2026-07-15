import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';

const BASE_URL = config.RESOURCE_BASE_URL;

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

const MessageDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('user_001');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUserId(user.userId);
          setCurrentUserAvatar(user.avatarUrl);
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // 获取消息列表
  const fetchMessages = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      setLoading(true);
      console.log('开始获取消息列表，会话ID:', id);
      console.log('请求URL:', `${config.API_BASE_URL}/messages/conversations/${id}/messages`);

      const response = await fetch(`${config.API_BASE_URL}/messages/conversations/${id}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('响应状态:', response.status);
      console.log('响应状态文本:', response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('响应数据:', data);
        setMessages(data.data);
        
        // 获取会话信息以确定对方用户ID
        const conversationResponse = await fetch(`${config.API_BASE_URL}/messages/conversations/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json();
          console.log('会话信息:', conversationData);
          const conversation = conversationData.data;
          const otherUserId = conversation.userAId === currentUserId ? conversation.userBId : conversation.userAId;
          
          // 获取对方用户信息
          try {
            const userResponse = await fetch(`${config.API_BASE_URL}/user/${otherUserId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            
            console.log('获取用户信息响应状态:', userResponse.status);
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log('用户信息:', userData);
              setOtherUser(userData.data);
            } else {
              console.error('获取用户信息失败，状态码:', userResponse.status);
              const errorText = await userResponse.text();
              console.error('错误信息:', errorText);
              // 使用默认用户信息
              setOtherUser({
                userId: otherUserId,
                username: '未知用户',
                avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square'
              });
            }
          } catch (error) {
            console.error('获取用户信息失败:', error);
            // 使用默认用户信息
            setOtherUser({
              userId: otherUserId,
              username: '未知用户',
              avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square'
            });
          }
        } else {
          console.error('获取会话信息失败，状态码:', conversationResponse.status);
          // 使用默认用户信息
          setOtherUser({
            userId: 'user_002',
            username: 'Lucky',
            avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square'
          });
        }
      } else {
        console.error('获取消息失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误信息:', errorText);
        
        // 使用模拟数据作为 fallback
        setMessages([
          {
            messageId: 'msg_001',
            conversationId: id as string,
            senderId: 'user_002',
            receiverId: 'user_001',
            content: '你好，我看到你的Dimoo收藏，可以交流一下吗？',
            messageType: 'text',
            sentAt: '2026-02-04T18:39:03',
            deliveredAt: '2026-02-04T18:39:05',
            readAt: '2026-02-04T18:40:00',
            status: 'read',
            productId: null
          },
          {
            messageId: 'msg_002',
            conversationId: id as string,
            senderId: 'user_001',
            receiverId: 'user_002',
            content: '当然可以！我也很喜欢Dimoo系列',
            messageType: 'text',
            sentAt: '2026-02-04T18:40:30',
            deliveredAt: '2026-02-04T18:40:32',
            readAt: null,
            status: 'delivered',
            productId: null
          }
        ]);
        
        // 使用模拟对方用户信息
        setOtherUser({
          userId: 'user_002',
          username: 'Lucky',
          avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square'
        });
      }
    } catch (error) {
      console.error('获取消息失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error);
      
      // 使用模拟数据作为 fallback
      setMessages([
        {
          messageId: 'msg_001',
          conversationId: id as string,
          senderId: 'user_002',
          receiverId: 'user_001',
          content: '你好，我看到你的Dimoo收藏，可以交流一下吗？',
          messageType: 'text',
          sentAt: '2026-02-04T18:39:03',
          deliveredAt: '2026-02-04T18:39:05',
          readAt: '2026-02-04T18:40:00',
          status: 'read',
          productId: null
        },
        {
          messageId: 'msg_002',
          conversationId: id as string,
          senderId: 'user_001',
          receiverId: 'user_002',
          content: '当然可以！我也很喜欢Dimoo系列',
          messageType: 'text',
          sentAt: '2026-02-04T18:40:30',
          deliveredAt: '2026-02-04T18:40:32',
          readAt: null,
          status: 'delivered',
          productId: null
        }
      ]);
      
      // 使用模拟对方用户信息
      setOtherUser({
        userId: 'user_002',
        username: 'Lucky',
        avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square'
      });
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      const messageContent = inputText.trim();
      const receiverId = otherUser?.userId || '';
      
      // 先添加到本地消息列表
      const tempMessage: Message = {
        messageId: `msg_${Date.now()}`,
        conversationId: id as string,
        senderId: currentUserId,
        receiverId: receiverId,
        content: messageContent,
        messageType: 'text',
        sentAt: new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
        status: 'sending',
        productId: null
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setInputText('');
      
      // 调用后端API发送消息
      console.log('开始发送消息，会话ID:', id);
      console.log('请求URL:', `${config.API_BASE_URL}/messages/messages`);

      // 构建查询参数
      const params = new URLSearchParams({
        conversationId: id,
        senderId: currentUserId,
        receiverId: receiverId,
        content: messageContent,
        messageType: 'text'
      });

      const response = await fetch(`${config.API_BASE_URL}/messages/messages?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('发送消息响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('发送消息成功:', data);
        
        // 更新消息状态为已发送
        setMessages(prev => prev.map(msg => {
          if (msg.messageId === tempMessage.messageId) {
            return {
              ...msg,
              messageId: data.data.messageId,
              status: 'sent',
              deliveredAt: new Date().toISOString()
            };
          }
          return msg;
        }));
      } else {
        console.error('发送消息失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误信息:', errorText);
        
        // 更新消息状态为发送失败
        setMessages(prev => prev.map(msg => {
          if (msg.messageId === tempMessage.messageId) {
            return {
              ...msg,
              status: 'failed'
            };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 更新消息状态为发送失败
      setMessages(prev => prev.map(msg => {
        if (msg.status === 'sending') {
          return {
            ...msg,
            status: 'failed'
          };
        }
        return msg;
      }));
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchMessages();
  }, [id]);

  // 格式化时间显示在消息气泡内
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化时间显示在中间（微信风格）
  const formatFullTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${weekDays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // 判断是否需要显示时间分隔
  const shouldShowTimeDivider = (index: number) => {
    if (index === 0) return true;
    const currentTime = new Date(messages[index].sentAt).getTime();
    const previousTime = new Date(messages[index - 1].sentAt).getTime();
    return (currentTime - previousTime) > 5 * 60 * 1000; // 超过5分钟
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Svg width={20} height={20} viewBox="0 0 1024 1024" fill="none">
                <Path
                  d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                  fill="#3C3C3C"
                />
              </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser?.username || '聊天'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 消息列表 */}
      <ScrollView 
        style={styles.messageList} 
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUserId;
          const avatarUrl = isCurrentUser 
            ? (currentUserAvatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square')
            : (otherUser?.avatarUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20user%20avatar&image_size=square');
          
          let finalAvatarUrl = avatarUrl;
          if (finalAvatarUrl && !finalAvatarUrl.startsWith('http')) {
            finalAvatarUrl = `${BASE_URL}${finalAvatarUrl}`;
          }
          finalAvatarUrl = finalAvatarUrl.replace(/http:\/\/localhost:8080/g, BASE_URL);
          finalAvatarUrl = finalAvatarUrl.replace(/http:\/\/10\.0\.2\.2:8080/g, BASE_URL);
          
          return (
            <React.Fragment key={message.messageId}>
              {shouldShowTimeDivider(index) && (
                <View style={styles.timeDivider}>
                  <Text style={styles.timeDividerText}>{formatFullTime(message.sentAt)}</Text>
                </View>
              )}
              <View 
                style={[styles.messageItem, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}
              >
                {!isCurrentUser && (
                  <Image source={{ uri: finalAvatarUrl }} style={styles.avatar} />
                )}
                <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
                  <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
                    {message.content}
                  </Text>
                </View>
                {isCurrentUser && (
                  <Image source={{ uri: finalAvatarUrl }} style={styles.avatar} />
                )}
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* 输入框 */}
      <View style={styles.inputContainer}>
        <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
          <Path
            d="M754 361H270c-14.4 0-26-11.6-26-26s11.6-26 26-26h484c14.4 0 26 11.6 26 26s-11.6 26-26 26zM754 537H270c-14.4 0-26-11.6-26-26s11.6-26 26-26h484c14.4 0 26 11.6 26 26s-11.6 26-26 26zM754 716H270c-14.4 0-26-11.6-26-26s11.6-26 26-26h484c14.4 0 26 11.6 26 26s-11.6 26-26 26z"
            fill="#3C3C3C"
            stroke="#3C3C3C"
            strokeWidth="35"
            
          />
          <Path
            d="M512.1 52c62.1 0 122.4 12.2 179 36.1 54.8 23.2 104 56.3 146.2 98.6C879.6 229 912.8 278.2 936 333c24 56.7 36.1 116.9 36.1 179S959.9 634.4 936 691c-23.2 54.8-56.3 104-98.6 146.2-42.3 42.3-91.5 75.4-146.2 98.6-56.7 24-116.9 36.1-179 36.1s-122.4-12.2-179-36.1c-54.8-23.2-104-56.3-146.2-98.6-42.4-42.2-75.6-91.4-98.8-146.2-24-56.7-36.1-116.9-36.1-179s12.2-122.4 36.1-179c23.2-54.8 56.3-104 98.6-146.2 42.3-42.3 91.5-75.4 146.2-98.6C389.7 64.2 450 52 512.1 52m0-52C229.3 0 0.1 229.2 0.1 512s229.2 512 512 512 512-229.2 512-512S794.9 0 512.1 0z"
            fill="#3C3C3C"
            stroke="#3C3C3C"
            strokeWidth="35"
          />
        </Svg>
        <TextInput
          style={styles.input}
          placeholder="输入消息..."
          placeholderTextColor="#bbb"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>

          <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
            <Path
              d="M511.5 957.9C264.9 957.9 65 758.2 65 511.9s199.9-446 446.5-446S958 265.6 958 511.9c0.1 246.3-199.8 446-446.5 446zM509 149.1c-200.4 0-355.8 162.2-355.8 362.3 0 200.1 155.4 356.8 355.8 356.8s362.9-156.7 362.9-356.8c0-200.1-162.5-362.3-362.9-362.3zM690.5 556h-134v133.8c0 24.6-20 44.6-44.6 44.6h-0.1c-24.6 0-44.6-19.9-44.6-44.6V556h-134c-24.7 0-44.6-19.9-44.6-44.5v-0.1c0-24.6 20-44.6 44.6-44.6h134V333c0-24.6 20-44.6 44.6-44.6h0.1c24.7 0 44.6 19.9 44.6 44.6v133.8h134c24.7 0 44.6 19.9 44.6 44.6v0.1c0 24.6-19.9 44.5-44.6 44.5z m0 0"
              fill="#3C3C3C"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

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
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 15,
  },
  timeDivider: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timeDividerText: {
    fontSize: 12,
    color: '#999',
  },
  messageItem: {
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '60%',
    padding: 12,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: '#E5E4F3',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  currentUserText: {
    color: '#000',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherUserTime: {
    color: '#999',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 18,
  },
  input: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
});

export default MessageDetail;
