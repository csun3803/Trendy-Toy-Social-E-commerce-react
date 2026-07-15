import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Tag, App, Modal, Descriptions, Image, Input, Table } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from '@umijs/max';
import { getActivityDetail, deleteActivity, getCommentList, deleteComment, type ActivityDetail, type CommentRecord } from '../../services/activity';

const ActivityDetailPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 评论相关
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentPagination, setCommentPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const response = await getActivityDetail(activityId!);
      if (response.code === 200 || response.message === 'success') {
        setActivity(response.data);
      } else {
        message.error('获取帖子详情失败');
      }
    } catch (error) {
      message.error('获取帖子详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page = 1, pageSize = 10) => {
    setCommentLoading(true);
    try {
      const response = await getCommentList({
        activityId: activityId!,
        page,
        size: pageSize,
        keyword: keyword || undefined,
      });
      if (response.code === 200 || response.message === 'success') {
        const data = response.data as any;
        setComments(data.records || []);
        setCommentPagination({ current: page, pageSize, total: data.total || 0 });
      }
    } catch (error) {
      message.error('获取评论列表失败');
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (activityId) {
      fetchActivity();
      fetchComments();
    }
  }, [activityId]);

  const handleDeleteActivity = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该帖子吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteActivity(activityId!);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            navigate('/community/list');
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleDeleteComment = (commentId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该评论吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteComment(commentId);
          if (response.code === 200 || response.message === 'success') {
            message.success('删除成功');
            fetchComments(commentPagination.current, commentPagination.pageSize);
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSearchComments = () => {
    fetchComments(1, commentPagination.pageSize);
  };

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case '待审核': return 'orange';
      case '审核通过': return 'green';
      case '审核拒绝': return 'red';
      default: return 'default';
    }
  };

  const commentColumns = [
    {
      title: '评论人',
      dataIndex: 'userInfo',
      key: 'userInfo',
      width: 120,
      render: (userInfo: any) => userInfo?.username || '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '点赞数',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 80,
    },
    {
      title: '举报状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string) => {
        if (!status || status === '审核通过') return <Tag color="green">正常</Tag>;
        if (status === '待审核') return <Tag color="orange">待审核</Tag>;
        return <Tag color="red">{status}</Tag>;
      },
    },
    {
      title: '评论时间',
      dataIndex: 'commentedAt',
      key: 'commentedAt',
      width: 170,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: CommentRecord) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteComment(record.commentId)}>
          删除
        </Button>
      ),
    },
  ];

  const imageList = activity?.imageList
    ? (Array.isArray(activity.imageList) ? activity.imageList : JSON.parse(activity.imageList as any))
    : [];

  return (
    <div style={{ padding: 16 }}>
      {/* 上部分：帖子信息 */}
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/community/list')} />
            <span>帖子详情</span>
          </Space>
        }
        extra={
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteActivity}>
            删除该帖子
          </Button>
        }
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        {activity && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="帖子ID">{activity.activityId}</Descriptions.Item>
              <Descriptions.Item label="发布者">{activity.userInfo?.username || activity.userId}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{activity.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{activity.activityType}</Descriptions.Item>
              <Descriptions.Item label="位置">{activity.location || '无'}</Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={getAuditStatusColor(activity.auditStatus)}>{activity.auditStatus || '待审核'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发布状态">
                <Tag color={activity.publishStatus === 'published' ? 'green' : 'default'}>
                  {activity.publishStatus === 'published' ? '已发布' : '编辑中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">{activity.viewCount || 0}</Descriptions.Item>
              <Descriptions.Item label="点赞数">{activity.likeCount || 0}</Descriptions.Item>
              <Descriptions.Item label="评论数">{activity.commentCount || 0}</Descriptions.Item>
              <Descriptions.Item label="收藏数">{activity.favoriteCount || 0}</Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {activity.publishedAt ? new Date(activity.publishedAt).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="内容" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{activity.content || '无'}</div>
              </Descriptions.Item>
            </Descriptions>

            {activity.coverImage && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>封面图片</div>
                <Image
                  src={activity.coverImage.startsWith('http') ? activity.coverImage : `http://localhost:8080${activity.coverImage}`}
                  width={200}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            {imageList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>图片列表</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {imageList.map((img: string, index: number) => (
                    <Image
                      key={index}
                      src={img.startsWith('http') ? img : `http://localhost:8080${img}`}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* 下部分：评论列表 */}
      <Card title="评论列表">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索评论内容"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleSearchComments}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchComments}>搜索</Button>
        </div>

        <Table
          columns={commentColumns}
          dataSource={comments}
          loading={commentLoading}
          rowKey="commentId"
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={{
            ...commentPagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => fetchComments(p.current || 1, p.pageSize || 10)}
        />
      </Card>
    </div>
  );
};

export default ActivityDetailPage;
