import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage, type ChatMessageItem, type SeriesCard } from '../services/aiCustomerService';
import {
  createHumanServiceSession,
  sendHumanServiceMessage,
  getActiveHumanServiceSession,
  getHumanServiceMessages,
  type HumanServiceMessage,
} from '../services/humanCustomerService';

const { width } = Dimensions.get('window');

// 快捷问题（潮玩发现语境）
const quickQuestions = [
  { text: '有什么热门潮玩推荐？', icon: '🔥', color: '#FF6B9D' },
  { text: 'LABUBU系列介绍', icon: '🐰', color: '#8069E1' },
  { text: '隐藏款抽取技巧', icon: '🎁', color: '#FFB800' },
  { text: '转人工客服', icon: '👨‍💼', color: '#00C9A7' },
];

// 转人工关键词
const TRANSFER_KEYWORDS = ['转人工', '人工客服', '转接人工', '人工服务', '客服'];

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  time: string;
  // AI 回复中可能附带的系列卡片，点击可跳转 /series/{seriesId}
  cards?: SeriesCard[];
}

export default function AiCustomerServiceScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { q } = useLocalSearchParams<{ q?: string }>();
  const autoSentRef = useRef(false);

  // 人工客服相关状态
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [humanSessionId, setHumanSessionId] = useState<string>('');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    AsyncStorage.getItem('userId').then(id => {
      if (id) setUserId(id);
    });
    AsyncStorage.getItem('userInfo').then(info => {
      if (info) {
        try {
          const user = JSON.parse(info);
          setUserNickname(user.nickname || user.username || '');
        } catch {}
      }
    });

    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: '你好！我是你的AI潮玩助手 ✨\n\n我可以帮你：\n• 发现热门潮玩与新品\n• 解读隐藏款抽取技巧\n• 推荐设计师联名系列\n• 解答潮玩收藏问题\n\n想了解点什么？直接问我就好！\n\n如需人工客服，请发送"转人工"',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
  }, []);

  // 轮询人工客服消息
  const startPolling = (sessionId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await getHumanServiceMessages(sessionId);
        if (res?.code === 200 && res.data) {
          const adminMessages = res.data.filter(
            (m: HumanServiceMessage) => m.senderType === 'admin'
          );
          // 找出当前消息列表中已有的admin消息id
          const existingIds = new Set(messages.map(m => m.id));
          const newAdminMessages = adminMessages.filter(
            (m: HumanServiceMessage) => !existingIds.has(m.messageId)
          );
          if (newAdminMessages.length > 0) {
            const newMsgs: Message[] = newAdminMessages.map((m: HumanServiceMessage) => ({
              id: m.messageId,
              role: 'admin',
              content: m.content,
              time: m.createTime
                ? new Date(m.createTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            }));
            setMessages(prev => [...prev, ...newMsgs]);
            scrollToBottom();
          }
        }
      } catch (error) {
        console.error('轮询消息失败:', error);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 转人工客服
  const transferToHuman = async () => {
    if (isHumanMode) return;

    setLoading(true);
    try {
      // 先检查是否有进行中的会话
      let currentSessionId = '';
      if (userId) {
        const activeRes = await getActiveHumanServiceSession(userId);
        if (activeRes?.code === 200 && activeRes.data) {
          currentSessionId = activeRes.data.sessionId;
        }
      }

      // 如果没有进行中的会话，创建新会话
      if (!currentSessionId) {
        const res = await createHumanServiceSession(userId || 'anonymous', userNickname, '商品咨询');
        if (res?.code === 200 && res.data) {
          currentSessionId = res.data.sessionId;
        } else {
          throw new Error('创建会话失败');
        }
      }

      setHumanSessionId(currentSessionId);
      setIsHumanMode(true);

      // 加载历史消息
      const msgRes = await getHumanServiceMessages(currentSessionId);
      if (msgRes?.code === 200 && msgRes.data) {
        const historyMsgs: Message[] = msgRes.data.map((m: HumanServiceMessage) => ({
          id: m.messageId,
          role: m.senderType === 'admin' ? 'admin' : m.senderType === 'user' ? 'user' : 'user',
          content: m.content,
          time: m.createTime
            ? new Date(m.createTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            : '',
        }));
        // 只添加不在当前列表中的消息
        const existingIds = new Set(messages.map(m => m.id));
        const newHistory = historyMsgs.filter(m => !existingIds.has(m.id));
        if (newHistory.length > 0) {
          setMessages(prev => [...prev, ...newHistory]);
        }
      }

      // 添加系统提示
      const transferMsg: Message = {
        id: `transfer_${Date.now()}`,
        role: 'admin',
        content: '已为您转接人工客服，请稍候，客服人员将尽快为您服务～',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, transferMsg]);

      // 开始轮询
      startPolling(currentSessionId);
      scrollToBottom();
    } catch (error) {
      console.error('转人工失败:', error);
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '转接人工客服失败，请稍后再试。您也可以直接拨打客服热线：400-xxx-xxxx',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const trimmedText = text.trim();

    // 检查是否包含转人工关键词
    if (TRANSFER_KEYWORDS.some(keyword => trimmedText.includes(keyword))) {
      // 先显示用户消息
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmedText,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      scrollToBottom();
      // 执行转人工
      await transferToHuman();
      return;
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmedText,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    scrollToBottom();

    if (isHumanMode && humanSessionId) {
      // 人工客服模式：发送消息到后端
      try {
        const res = await sendHumanServiceMessage(humanSessionId, userId || 'anonymous', trimmedText);
        if (res?.code !== 200) {
          const errorMsg: Message = {
            id: `error_${Date.now()}`,
            role: 'admin',
            content: '消息发送失败，请重试',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } catch (error) {
        const errorMsg: Message = {
          id: `error_${Date.now()}`,
          role: 'admin',
          content: '消息发送失败，请重试',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    } else {
      // AI 模式
      try {
        const response = await sendChatMessage(userId || 'anonymous', trimmedText, sessionId);
        const data = response.data as ChatMessageItem;

        const assistantMessage: Message = {
          id: data.messageId || `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.content || '抱歉，我暂时无法回答这个问题，请稍后再试。',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          cards: data.cards as SeriesCard[] | undefined,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('发送消息失败:', error);
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: '抱歉，网络出现问题，请稍后再试。您也可以直接拨打客服热线：400-xxx-xxxx',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // 从 AI 发现页快捷标签携带问题进入时，自动发送
  useEffect(() => {
    if (q && !autoSentRef.current && !loading) {
      autoSentRef.current = true;
      setTimeout(() => sendMessage(q as string), 300);
    }
  }, [q]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 顶部紫色渐变区域 */}
      <LinearGradient
        colors={isHumanMode ? ['#00C9A7', '#00D4AA'] : ['#8069E1', '#9B7FE8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* 装饰圆 */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.aiAvatarSmall}>
              <LinearGradient
                colors={isHumanMode ? ['#FFFFFF', '#E0FFF5'] : ['#FFFFFF', '#F0EDFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiAvatarSmallGradient}
              >
                <Text style={styles.aiAvatarSmallIcon}>{isHumanMode ? '👨‍💼' : '✨'}</Text>
              </LinearGradient>
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>{isHumanMode ? '人工客服' : 'AI潮玩助手'}</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{isHumanMode ? '客服在线' : '在线'}</Text>
              </View>
            </View>
          </View>
          {!isHumanMode ? (
            <TouchableOpacity onPress={transferToHuman} style={styles.transferBtn}>
              <Text style={styles.transferBtnText}>转人工</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* 标语 */}
        <View style={styles.sloganSection}>
          <Text style={styles.sloganTitle}>
            {isHumanMode ? '人工客服为您服务' : '发现你的潮玩灵感'}
          </Text>
          <Text style={styles.sloganDesc}>
            {isHumanMode ? '专业客服 · 实时解答' : 'AI智能推荐 · 解读潮玩宇宙'}
          </Text>
        </View>
      </LinearGradient>

      {/* 快捷问题 */}
      {messages.length <= 1 && !isHumanMode && (
        <Animated.View style={[styles.quickSection, { opacity: fadeAnim }]}>
          <Text style={styles.quickTitle}>常见问题</Text>
          <View style={styles.quickGrid}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickBtn}
                onPress={() => handleQuickQuestion(q.text)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: q.color + '15' }]}>
                  <Text style={styles.quickIcon}>{q.icon}</Text>
                </View>
                <Text style={styles.quickText}>{q.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isHumanMode={isHumanMode} />
        ))}
        {loading && (
          <View style={styles.loadingRow}>
            <View style={styles.aiAvatar}>
              <LinearGradient
                colors={isHumanMode ? ['#00C9A7', '#00D4AA'] : ['#8069E1', '#9B7FE8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiAvatarGradient}
              >
                <Text style={styles.aiAvatarText}>{isHumanMode ? '👨‍💼' : '✨'}</Text>
              </LinearGradient>
            </View>
            <View style={styles.loadingBubble}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 输入区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={isHumanMode ? '输入消息，客服将为您解答...' : '输入您的问题...'}
              placeholderTextColor="#bbb"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={inputText.trim() ? (isHumanMode ? ['#00C9A7', '#00D4AA'] : ['#8069E1', '#9B7FE8']) : ['#ccc', '#ddd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnGradient}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// 消息气泡组件
function MessageBubble({ message, isHumanMode }: { message: Message; isHumanMode: boolean }) {
  const isUser = message.role === 'user';
  const hasCards = !isUser && Array.isArray(message.cards) && message.cards.length > 0;

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <LinearGradient
            colors={isHumanMode ? ['#00C9A7', '#00D4AA'] : ['#8069E1', '#9B7FE8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiAvatarGradient}
          >
            <Text style={styles.aiAvatarText}>{isHumanMode ? '👨‍💼' : '✨'}</Text>
          </LinearGradient>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : (isHumanMode ? styles.adminBubble : styles.assistantBubble),
        hasCards && styles.bubbleWithCards,
      ]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{message.content}</Text>

        {/* 系列卡片列表，点击跳转到 /series/{seriesId} */}
        {hasCards && (
          <View style={styles.cardsWrap}>
            {message.cards!.map((card, idx) => (
              <TouchableOpacity
                key={`${card.seriesId}_${idx}`}
                style={styles.seriesCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/series/${card.seriesId}`)}
              >
                {card.coverImage ? (
                  <Image
                    source={{ uri: card.coverImage }}
                    style={styles.seriesCardCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.seriesCardCover, styles.seriesCardCoverPlaceholder]}>
                    <Text style={styles.seriesCardCoverPlaceholderText}>🎁</Text>
                  </View>
                )}
                <View style={styles.seriesCardInfo}>
                  <Text style={styles.seriesCardName} numberOfLines={1}>
                    {card.seriesName || '未知系列'}
                  </Text>
                  <View style={styles.seriesCardMeta}>
                    {card.theme ? (
                      <Text style={styles.seriesCardTheme} numberOfLines={1}>{card.theme}</Text>
                    ) : null}
                    <Text style={styles.seriesCardCount}>
                      {card.variantCount || 0} 款
                    </Text>
                  </View>
                  <Text style={styles.seriesCardCta}>查看系列详情 →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.timeText, isUser && styles.userTimeText]}>{message.time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 20,
    left: -40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatarSmall: {
    marginRight: 10,
  },
  aiAvatarSmallGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  aiAvatarSmallIcon: {
    fontSize: 18,
  },
  headerTitleWrap: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  transferBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  transferBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sloganSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  sloganTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  sloganDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  quickSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: -12,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#8069E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickBtn: {
    width: (width - 56) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  quickIcon: {
    fontSize: 16,
  },
  quickText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messageContent: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    marginRight: 8,
  },
  aiAvatarGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    fontSize: 15,
  },
  bubble: {
    maxWidth: width * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  adminBubble: {
    backgroundColor: '#E8FFF5',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#C6F0DD',
  },
  userBubble: {
    backgroundColor: '#8069E1',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#fff',
  },
  timeText: {
    fontSize: 10,
    color: '#bbb',
    marginTop: 5,
    textAlign: 'right',
  },
  userTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  // ===== 系列卡片样式 =====
  bubbleWithCards: {
    paddingBottom: 8,
  },
  cardsWrap: {
    marginTop: 10,
    gap: 8,
  },
  seriesCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F7FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0EDFF',
    overflow: 'hidden',
    maxWidth: width * 0.68,
  },
  seriesCardCover: {
    width: 76,
    height: 76,
    backgroundColor: '#EEE',
  },
  seriesCardCoverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0EDFF',
  },
  seriesCardCoverPlaceholderText: {
    fontSize: 26,
  },
  seriesCardInfo: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  seriesCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  seriesCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  seriesCardTheme: {
    fontSize: 11,
    color: '#8069E1',
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 6,
    overflow: 'hidden',
    maxWidth: 100,
  },
  seriesCardCount: {
    fontSize: 11,
    color: '#999',
  },
  seriesCardCta: {
    fontSize: 11,
    color: '#8069E1',
    fontWeight: '600',
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8069E1',
    marginHorizontal: 2.5,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.65,
  },
  typingDot3: {
    opacity: 0.9,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F8',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingLeft: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F0EDFF',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    maxHeight: 90,
    paddingVertical: 8,
    lineHeight: 20,
  },
  sendBtn: {
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
