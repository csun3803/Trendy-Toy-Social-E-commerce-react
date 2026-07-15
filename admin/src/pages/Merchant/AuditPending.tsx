import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Typography, Space, Tag } from 'antd';
import { ClockCircleOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import { history, request } from '@umijs/max';

const { Title, Paragraph } = Typography;

const AuditPending: React.FC = () => {
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await request('/api/merchant-application/status', {
        method: 'GET',
      });
      if (response.code === 200 && response.data) {
        setApplication(response.data);
      }
    } catch (error) {
      console.error('获取申请状态失败', error);
    }
  };

  const getStatusInfo = () => {
    if (!application) {
      return { title: '暂未提交申请', subTitle: '您还未提交入驻申请，请先填写申请信息。', icon: null, color: '#999' };
    }
    switch (application.status) {
      case 0:
        return { title: '申请已提交，正在审核中', subTitle: `申请单号：${application.applySn}`, icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 72 }} />, color: '#faad14' };
      case 1:
        return { title: '审核已通过', subTitle: '恭喜！您的入驻申请已通过审核。', icon: null, color: '#52c41a' };
      case 2:
        return { title: '申请被驳回', subTitle: `驳回原因：${application.auditRemark || '无'}`, icon: null, color: '#ff4d4f' };
      default:
        return { title: '未知状态', subTitle: '', icon: null, color: '#999' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{ padding: '50px 0', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
        <Result
          icon={statusInfo.icon}
          title={statusInfo.title}
          subTitle={statusInfo.subTitle}
          extra={[
            <Space key="space" direction="vertical" size="large" style={{ width: '100%' }}>
              <div key="info-box" style={{ padding: '24px', background: '#f5f5f5', borderRadius: 8, textAlign: 'left' }}>
                <Title level={4}>审核流程</Title>
                <Paragraph>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>提交申请后，平台将在1-3个工作日内完成审核</li>
                    <li>审核期间，请保持电话畅通，以便我们与您联系</li>
                    <li>如审核通过，您将可以正常使用商家功能</li>
                    <li>如审核被驳回，请根据反馈修改后重新提交</li>
                  </ul>
                </Paragraph>
              </div>
              <Space>
                {application?.status === 2 && (
                  <Button
                    key="retry-btn"
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => history.push('/merchant/apply')}
                  >
                    重新提交
                  </Button>
                )}
                {application?.status === 1 && (
                  <Button
                    key="center-btn"
                    type="primary"
                    size="large"
                    onClick={() => history.push('/merchant-center/dashboard')}
                  >
                    进入商家中心
                  </Button>
                )}
                <Button
                  key="home-btn"
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => history.push('/')}
                >
                  返回首页
                </Button>
              </Space>
            </Space>
          ]}
        />
      </Card>
    </div>
  );
};

export default AuditPending;
