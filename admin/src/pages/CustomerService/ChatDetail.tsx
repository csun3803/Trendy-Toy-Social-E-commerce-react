import React, { useEffect, useState, useRef } from 'react';
import { Card, Input, Button, Space, Tag, Spin, App, Descriptions, Avatar, Typography } from 'antd';
import { useParams, useNavigate } from '@umijs/max';
import { request } from '@umijs/max';
import { ArrowLeftOutlined, UserOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface SessionInfo {
  sessionId: string;
  userId: string;
  userNickname: string;
  status: string;
  source: string;
  unreadCount: number;
  lastMessageTime: string;
  createTime: string;
}

interface MessageRecord {
  messageId: string;
  sessionId: string;
  senderType: string;
  senderId: string;
  content: string;
  messageType: string;
  isRead: number;
  createTime: string;
}

const ChatDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { message: messageApi } = App.useApp();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = async () => {
    try {
      const res = await request(`/api/customer-service/sessions/${sessionId}`, { method: 'GET' });
      if (res?.code === 200) {
        setSession(res.data);
      }
    } catch (error) {
      console.error('获取会话详情失败', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await request(`/api/customer-service/sessions/${sessionId}/messages`, { method: 'GET' });
      if (res?.code === 200) {
        setMessages(res.data || []);
      }
    } catch (error) {
      console.error('获取消息列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      messageApi.warning('请输入回复内容');
      return;
    }
    setSending(true);
    try {
      const res = await request(`/api/customer-service/sessions/${sessionId}/reply`, {
        method: 'POST',
        data: { content: replyContent },
      });
      if (res?.code === 200) {
        messageApi.success('回复成功');
        setReplyContent('');
        fetchMessages();
        fetchSession();
      } else {
        messageApi.error(res?.message || '回复失败');
      }
    } catch (error) {
      messageApi.error('回复失败');
    } finally {
      setSending(false);
    }
  };

  const handleCloseSession = async () => {
    try {
      const res = await request(`/api/customer-service/sessions/${sessionId}/status`, {
        method: 'PUT',
        data: { status: '已关闭' },
      });
      if (res?.code === 200) {
        messageApi.success('会话已关闭');
        fetchSession();
      }
    } catch (error) {
      messageApi.error('操作失败');
    }
  };

  const statusColorMap: Record<string, string> = {
    '待处理': 'red',
    '处理中': 'blue',
    '已关闭': 'default',
  };

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/customer-service/sessions')} />
            <span>客服对话详情</span>
          </Space>
        }
        extra={
          session && session.status !== '已关闭' ? (
            <Button danger size="small" onClick={handleCloseSession}>关闭会话</Button>
          ) : null
        }
      >
        <Spin spinning={loading}>
          {/* 会话信息 */}
          {session && (
            <Descriptions size="small" bordered column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="用户ID">{session.userId}</Descriptions.Item>
              <Descriptions.Item label="用户昵称">{session.userNickname || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[session.status]}>{session.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">{session.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{session.createTime ? new Date(session.createTime).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
              <Descriptions.Item label="最后消息时间">{session.lastMessageTime ? new Date(session.lastMessageTime).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
            </Descriptions>
          )}

          {/* 消息列表 */}
          <div style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 16,
            height: 480,
            overflowY: 'auto',
            backgroundColor: '#fafafa',
            marginBottom: 16,
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">暂无消息记录</Text>
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderType === 'admin';
                return (
                  <div
                    key={msg.messageId}
                    style={{
                      display: 'flex',
                      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: isAdmin ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '70%',
                      gap: 8,
                    }}>
                      <Avatar
                        size={32}
                        icon={isAdmin ? <CustomerServiceOutlined /> : <UserOutlined />}
                        style={{ backgroundColor: isAdmin ? '#1890ff' : '#87d068', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{
                          fontSize: 12,
                          color: '#999',
                          marginBottom: 4,
                          textAlign: isAdmin ? 'right' : 'left',
                        }}>
                          {isAdmin ? '客服' : session?.userNickname || msg.senderId}
                          <span style={{ marginLeft: 8 }}>
                            {msg.createTime ? new Date(msg.createTime).toLocaleString('zh-CN') : ''}
                          </span>
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: isAdmin ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                          backgroundColor: isAdmin ? '#1890ff' : '#fff',
                          color: isAdmin ? '#fff' : '#333',
                          border: isAdmin ? 'none' : '1px solid #e8e8e8',
                          wordBreak: 'break-word',
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 回复区域 */}
          {session && session.status !== '已关闭' ? (
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="输入回复内容..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ flex: 1 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button
                type="primary"
                onClick={handleReply}
                loading={sending}
                style={{ height: 'auto', alignSelf: 'flex-end' }}
              >
                发送
              </Button>
            </Space.Compact>
          ) : (
            <Text type="secondary">该会话已关闭</Text>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ChatDetail;
