import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Divider, Typography, Spin, Result, Image, Row, Col, Tag } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { history, request } from '@umijs/max';
import { getShopFiles, type ShopCertificationFile, getCurrentMerchantApplication, type MerchantApplication } from '@/services/adminManage';

const { Title, Text } = Typography;

const FILE_TYPE_NAMES = {
  BUSINESS_LICENSE: '营业执照',
  LEGAL_ID_FRONT: '法人身份证正面',
  LEGAL_ID_BACK: '法人身份证反面',
  TRADEMARK_CERT: '商标注册证',
  BRAND_AUTHORIZATION: '品牌授权书',
  BANK_LICENSE: '银行开户许可证',
  OTHER: '其他补充材料'
};

const ShopDashboard: React.FC = () => {
  const [shop, setShop] = useState<any>(null);
  const [files, setFiles] = useState<ShopCertificationFile[]>([]);
  const [application, setApplication] = useState<MerchantApplication | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShop();
    fetchApplication();
  }, []);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const response = await request('/api/merchant/shop/current', {
        method: 'GET',
      });

      if (response.code === 200 || response.message === 'success') {
        const shopData = response.data;
        setShop(shopData);
        if (shopData?.shopId) {
          fetchFiles(shopData.shopId);
        }
      } else {
        setShop(null);
      }
    } catch (error) {
      console.error('获取商家信息失败', error);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplication = async () => {
    try {
      const response = await request('/api/merchant-application/status', {
        method: 'GET',
      });
      if (response.code === 200 || response.message === 'success') {
        setApplication(response.data);
      }
    } catch (error) {
      console.error('获取申请信息失败', error);
    }
  };

  const fetchFiles = async (shopId: string) => {
    try {
      const response = await getShopFiles(shopId);
      if (response.code === 200 || response.message === 'success') {
        setFiles(response.data || []);
      }
    } catch (error) {
      console.error('获取文件失败', error);
    }
  };

  const groupFilesByType = () => {
    const grouped: { [key: string]: ShopCertificationFile[] } = {};
    files.forEach(file => {
      if (!grouped[file.fileType]) {
        grouped[file.fileType] = [];
      }
      grouped[file.fileType].push(file);
    });
    return grouped;
  };

  const isImageFile = (file: ShopCertificationFile) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    // 检查 fileFormat 字段
    if (file.fileFormat && imageExtensions.test(file.fileFormat)) {
      return true;
    }
    // 检查 fileUrl
    if (file.fileUrl && imageExtensions.test(file.fileUrl)) {
      return true;
    }
    // 检查 fileName
    if (file.fileName && imageExtensions.test(file.fileName)) {
      return true;
    }
    return false;
  };

  const renderFiles = () => {
    const grouped = groupFilesByType();
    
    return Object.keys(grouped).map(fileType => {
      const typeFiles = grouped[fileType];
      if (typeFiles.length === 0) return null;
      
      return (
        <Col key={fileType} span={8} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>
          {FILE_TYPE_NAMES[fileType as keyof typeof FILE_TYPE_NAMES] || fileType}
          </div>
          <Row gutter={8}>
            {typeFiles.map(file => (
              <Col key={file.fileId} span={24} style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  {isImageFile(file) && (
                    <Image
                      src={file.fileUrl}
                      style={{ width: 60, height: 60, objectFit: 'cover' }}
                      fallback="https://via.placeholder.com/60?text=图片"
                      onError={(e) => {
                        console.error('图片加载失败:', file.fileUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <Text>{file.fileName}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                      上传时间：{file.uploadedAt}
                    </Text>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(file.fileUrl, '_blank')}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      );
    });
  };

  const hasShop = shop !== null;

  const renderApplicationImage = (url?: string, label?: string) => {
    if (!url) return '-';
    return (
      <Image
        src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
        width={100}
        height={100}
        style={{ objectFit: 'cover' }}
        fallback="https://via.placeholder.com/100?text=图片"
      />
    );
  };

  return (
    <div className="dashboard-page" style={{ padding: 24 }}>
      <Title level={2}>商家信息</Title>

      <Spin spinning={loading}>
        {!hasShop && !application ? (
          <Result
            title="暂无商家信息"
            subTitle="请先申请入驻"
            extra={
              <Button type="primary" onClick={() => history.push('/merchant/apply')}>
                立即申请
              </Button>
            }
          />
        ) : (
          <Card>
            {hasShop && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>{shop.shopName}</Title>
                <Button type="primary" icon={<EditOutlined />} onClick={() => history.push('/merchant/apply')}>
                  编辑信息
                </Button>
              </div>
            )}

            {hasShop && (
              <>
                <Divider orientation="center" style={{ marginTop: 24 }}>基本信息</Divider>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="商家ID">{shop.shopId}</Descriptions.Item>
                  <Descriptions.Item label="商家类型">{shop.shopType}</Descriptions.Item>
                  <Descriptions.Item label="法人姓名">{shop.legalPersonName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="统一社会信用代码">{shop.unifiedSocialCreditCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="注册地址">{shop.registeredAddress || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商家状态">{shop.shopStatus}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{shop.customerServicePhone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="联系邮箱">{shop.customerServiceEmail || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商家简介" span={2}>{shop.shopIntro || '-'}</Descriptions.Item>
                  <Descriptions.Item label="主要品类">
                    {(() => {
                      const categories = Array.isArray(shop.mainCategories) 
                        ? shop.mainCategories 
                        : (typeof shop.mainCategories === 'string' 
                            ? (shop.mainCategories.startsWith('[') 
                                ? JSON.parse(shop.mainCategories) 
                                : shop.mainCategories.split(',').map((s: string) => s.trim()).filter((s: string) => s))
                            : []);
                      return categories.length > 0 
                        ? categories.map((cat: string, idx: number) => <Tag key={idx}>{cat}</Tag>) 
                        : '-';
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="主要IP">
                    {(() => {
                      const ips = Array.isArray(shop.mainIps) 
                        ? shop.mainIps 
                        : (typeof shop.mainIps === 'string' 
                            ? (shop.mainIps.startsWith('[') 
                                ? JSON.parse(shop.mainIps) 
                                : shop.mainIps.split(',').map((s: string) => s.trim()).filter((s: string) => s))
                            : []);
                      return ips.length > 0 
                        ? ips.map((ip: string, idx: number) => <Tag key={idx} color="blue">{ip}</Tag>) 
                        : '-';
                    })()}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {application && (
              <>
                <Divider orientation="center" style={{ marginTop: 24 }}>入驻审核信息</Divider>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="申请单号">{application.applySn}</Descriptions.Item>
                  <Descriptions.Item label="商家名称">{application.shopName}</Descriptions.Item>
                  <Descriptions.Item label="联系人">{application.contactName}</Descriptions.Item>
                  <Descriptions.Item label="手机号">{application.mobile}</Descriptions.Item>
                  <Descriptions.Item label="主体类型">
                    {application.subjectType === 0 ? '个人' : application.subjectType === 1 ? '个体户' : '企业'}
                  </Descriptions.Item>
                  <Descriptions.Item label="营业执照号">{application.licenseNo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="身份证号">{application.idCardNo}</Descriptions.Item>
                  <Descriptions.Item label="银行户名">{application.bankAccountName}</Descriptions.Item>
                  <Descriptions.Item label="开户行">{application.bankName}</Descriptions.Item>
                  <Descriptions.Item label="银行卡号">{application.bankCardNo}</Descriptions.Item>
                  <Descriptions.Item label="申请时间">{application.applyTime}</Descriptions.Item>
                  <Descriptions.Item label="审核时间">{application.auditTime || '-'}</Descriptions.Item>
                  {application.auditRemark && (
                    <Descriptions.Item label="审核备注" span={2}>{application.auditRemark}</Descriptions.Item>
                  )}
                </Descriptions>

                <div style={{ marginTop: 16 }}>
                  <Title level={5}>证照图片</Title>
                  <Row gutter={16}>
                    {application.licenseImage && (
                      <Col span={8}>
                        <div style={{ marginBottom: 4, fontSize: 14, color: '#666' }}>营业执照</div>
                        {renderApplicationImage(application.licenseImage)}
                      </Col>
                    )}
                    {application.idCardFront && (
                      <Col span={8}>
                        <div style={{ marginBottom: 4, fontSize: 14, color: '#666' }}>身份证正面</div>
                        {renderApplicationImage(application.idCardFront)}
                      </Col>
                    )}
                    {application.idCardBack && (
                      <Col span={8}>
                        <div style={{ marginBottom: 4, fontSize: 14, color: '#666' }}>身份证反面</div>
                        {renderApplicationImage(application.idCardBack)}
                      </Col>
                    )}
                  </Row>
                </div>
              </>
            )}

            {hasShop && files.length > 0 && (
              <>
                <Divider orientation="center" style={{ marginTop: 24 }}>资质文件</Divider>
                <Row gutter={16}>
                  {renderFiles()}
                </Row>
              </>
            )}
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default ShopDashboard;
