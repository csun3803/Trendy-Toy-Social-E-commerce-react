import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, Select, Row, Col, Typography, Space, App, Steps, Result } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { history, request } from '@umijs/max';

const { Title, Text } = Typography;
const { Option } = Select;

const MerchantApplyForm: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [fileList, setFileList] = useState<{
    licenseImage: any[];
    idCardFront: any[];
    idCardBack: any[];
  }>({
    licenseImage: [],
    idCardFront: [],
    idCardBack: [],
  });

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const response = await request('/api/merchant-application/status', {
        method: 'GET',
      });
      if (response.code === 200 && response.data) {
        setExistingApplication(response.data);
        if (response.data.status === 0) {
          setCurrentStep(2); // 已提交待审核
        } else if (response.data.status === 1) {
          setCurrentStep(3); // 已通过
        } else if (response.data.status === 2) {
          setCurrentStep(1); // 被驳回，重新填写
          form.setFieldsValue({
            shopName: response.data.shopName,
            contactName: response.data.contactName,
            subjectType: response.data.subjectType,
            licenseNo: response.data.licenseNo,
            idCardNo: response.data.idCardNo,
            bankAccountName: response.data.bankAccountName,
            bankName: response.data.bankName,
            bankCardNo: response.data.bankCardNo,
          });
        }
      }
    } catch (error) {
      console.error('获取申请状态失败', error);
    }
  };

  const handleUpload = (file: File, fieldType: string) => {
    const formData = new FormData();
    formData.append('file', file);

    request('/api/upload', {
      method: 'POST',
      data: formData,
      requestType: 'form',
    }).then((res: any) => {
      if (res.code === 200) {
        const url = res.data?.url || res.data?.filePath || res.data;
        form.setFieldValue(fieldType, url);
        setFileList(prev => ({
          ...prev,
          [fieldType]: [{
            uid: '-1',
            name: file.name,
            status: 'done',
            url: url,
          }],
        }));
        messageApi.success('上传成功');
      } else {
        messageApi.error('上传失败');
      }
    }).catch(() => {
      messageApi.error('上传失败');
    });

    return false; // 阻止自动上传
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await request('/api/merchant-application/submit', {
        method: 'POST',
        data: values,
      });

      if (response.code === 200 || response.message === 'success') {
        messageApi.success('申请提交成功');
        setCurrentStep(2);
        setExistingApplication(response.data);
      } else {
        messageApi.error('提交失败: ' + (response.message || '未知错误'));
      }
    } catch (error: any) {
      messageApi.error('提交失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep0 = () => (
    <Result
      icon={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
      title="开始入驻申请"
      subTitle="请准备好以下材料：营业执照、身份证正反面照片、银行卡信息"
      extra={[
        <Button key="start" type="primary" size="large" onClick={() => setCurrentStep(1)}>
          开始填写
        </Button>,
      ]}
    />
  );

  const renderStep1 = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Card title="1. 店铺基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="shopName"
              label="店铺名称"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input placeholder="请输入店铺名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactName"
              label="联系人姓名"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="2. 主体资质信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="subjectType"
              label="主体类型"
              rules={[{ required: true, message: '请选择主体类型' }]}
            >
              <Select placeholder="请选择主体类型">
                <Option value={0}>个人</Option>
                <Option value={1}>个体户</Option>
                <Option value={2}>企业</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="licenseNo"
              label="营业执照号"
              rules={[
                ({ getFieldValue }) => ({
                  required: getFieldValue('subjectType') === 1 || getFieldValue('subjectType') === 2,
                  message: '个体户/企业需填写营业执照号',
                }),
              ]}
            >
              <Input placeholder="个体户/企业需填写" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="licenseImage"
          label="营业执照图片"
          valuePropName="value"
          rules={[
            ({ getFieldValue }) => ({
              required: getFieldValue('subjectType') === 1 || getFieldValue('subjectType') === 2,
              message: '个体户/企业需上传营业执照',
            }),
          ]}
        >
          <Upload
            beforeUpload={(file) => handleUpload(file, 'licenseImage')}
            listType="picture-card"
            maxCount={1}
            accept=".jpg,.jpeg,.png"
            fileList={fileList.licenseImage}
            onRemove={() => {
              form.setFieldValue('licenseImage', undefined);
              setFileList(prev => ({ ...prev, licenseImage: [] }));
            }}
          >
            {fileList.licenseImage.length === 0 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="idCardNo"
              label="身份证号"
              rules={[
                { required: true, message: '请输入身份证号' },
                { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号' },
              ]}
            >
              <Input placeholder="请输入18位身份证号" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="idCardFront"
              label="身份证正面"
              valuePropName="value"
              rules={[{ required: true, message: '请上传身份证正面' }]}
            >
              <Upload
                beforeUpload={(file) => handleUpload(file, 'idCardFront')}
                listType="picture-card"
                maxCount={1}
                accept=".jpg,.jpeg,.png"
                fileList={fileList.idCardFront}
                onRemove={() => {
                  form.setFieldValue('idCardFront', undefined);
                  setFileList(prev => ({ ...prev, idCardFront: [] }));
                }}
              >
                {fileList.idCardFront.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="idCardBack"
              label="身份证反面"
              valuePropName="value"
              rules={[{ required: true, message: '请上传身份证反面' }]}
            >
              <Upload
                beforeUpload={(file) => handleUpload(file, 'idCardBack')}
                listType="picture-card"
                maxCount={1}
                accept=".jpg,.jpeg,.png"
                fileList={fileList.idCardBack}
                onRemove={() => {
                  form.setFieldValue('idCardBack', undefined);
                  setFileList(prev => ({ ...prev, idCardBack: [] }));
                }}
              >
                {fileList.idCardBack.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="3. 财务信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="bankAccountName"
              label="银行户名"
              rules={[{ required: true, message: '请输入银行户名' }]}
            >
              <Input placeholder="请输入银行户名" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="bankName"
              label="开户行"
              rules={[{ required: true, message: '请输入开户行' }]}
            >
              <Input placeholder="例如：中国工商银行杭州西湖支行" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="bankCardNo"
              label="银行卡号"
              rules={[
                { required: true, message: '请输入银行卡号' },
                { pattern: /^\d{10,20}$/, message: '请输入正确的银行卡号' },
              ]}
            >
              <Input placeholder="请输入银行卡号" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.Item style={{ marginTop: 24, textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={() => setCurrentStep(0)}>
            上一步
          </Button>
          <Button type="primary" size="large" htmlType="submit" loading={loading}>
            提交申请
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderStep2 = () => (
    <Result
      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      title="申请已提交"
      subTitle={`您的入驻申请（单号：${existingApplication?.applySn || '-'}）已成功提交，请耐心等待平台审核。`}
      extra={[
        <div key="info" style={{ padding: 24, background: '#f5f5f5', borderRadius: 8, textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
          <Title level={5}>审核流程说明</Title>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>提交申请后，平台将在1-3个工作日内完成审核</li>
            <li>审核期间，请保持电话畅通</li>
            <li>审核通过后，您将可以正常使用商家功能</li>
            <li>如审核被驳回，请根据反馈修改后重新提交</li>
          </ul>
        </div>,
        existingApplication?.status === 2 && (
          <Button key="retry" type="primary" onClick={() => setCurrentStep(1)}>
            重新提交
          </Button>
        ),
      ]}
    />
  );

  const renderStep3 = () => (
    <Result
      status="success"
      title="审核已通过"
      subTitle="恭喜！您的商家入驻申请已通过审核，现在可以使用完整的商家功能。"
      extra={[
        <Button key="dashboard" type="primary" onClick={() => history.push('/merchant-center/dashboard')}>
          进入商家中心
        </Button>,
      ]}
    />
  );

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>商家入驻申请</Title>
          <Text type="secondary">请填写以下信息并上传相关资质文件</Text>
        </div>

        <Steps
          current={currentStep}
          style={{ marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}
          items={[
            { title: '准备材料' },
            { title: '填写信息' },
            { title: '等待审核' },
            { title: '审核通过' },
          ]}
        />

        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </Card>
    </div>
  );
};

export default MerchantApplyForm;
