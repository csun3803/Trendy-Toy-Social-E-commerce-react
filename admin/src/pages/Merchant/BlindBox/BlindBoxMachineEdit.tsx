import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  App,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Image,
  Steps,
  Typography,
  Alert,
  Checkbox,
  Row,
  Col,
  Divider,
  Upload,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { request, history, useParams } from '@umijs/max';
import {
  getBlindBoxMachineDetail,
  createBlindBoxMachine,
  updateBlindBoxMachine,
  getBlindBoxMachineVariants,
  saveBlindBoxMachineVariants,
  type BlindBoxMachine,
  type BlindBoxMachineVariant,
} from '../../../services/blindBoxMachine';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const API_BASE_URL = 'http://localhost:8080';

const getFullImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return 'https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const parseImages = (imagesStr: string | null | undefined): string[] => {
  if (!imagesStr) return [];
  try {
    const parsed = JSON.parse(imagesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return imagesStr ? [imagesStr] : [];
  }
};

// 商家销售系列下拉项
interface SaleSeriesOption {
  saleSeriesId: string;
  saleTitle: string;
  saleCoverImage: string;
  saleStatus: string;
  variantCount: number;
  seriesId: string;
}

// 销售款式（来自 sale_variants）
interface SaleVariantItem {
  saleVariantId: string;
  saleSeriesId: string;
  variantId: string;
  skuCode: string;
  salePrice: number;
  stockQuantity: number;
  saleStatus: string;
  customDescription: string;
  customImages: string;
  salesCount: number;
}

const BlindBoxMachineEdit: React.FC = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const isEdit = machineId && machineId !== 'new';
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string>('');

  // 基础信息
  const [saleSeriesOptions, setSaleSeriesOptions] = useState<SaleSeriesOption[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [machine, setMachine] = useState<BlindBoxMachine | null>(null);

  // 款式覆盖配置
  const [variantList, setVariantList] = useState<BlindBoxMachineVariant[]>([]);
  const [saleVariants, setSaleVariants] = useState<SaleVariantItem[]>([]);

  // 1. 获取商家信息
  const fetchMerchantInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await request('/api/merchant/info/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.code === 200 || response.message === 'success') {
        setShopId(response.data.shopId);
        return response.data.shopId;
      }
    } catch (error) {
      console.error('Error fetching merchant info:', error);
      message.error('获取商家信息失败');
    }
    return null;
  };

  // 2. 获取商家销售系列（仅复用已有 sale_series，不新增商品数据）
  const fetchSaleSeriesOptions = async (sid: string) => {
    try {
      const response = await request(`/api/sale-series/shop/${sid}`);
      if (response.code === 200 || response.message === 'success') {
        setSaleSeriesOptions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching sale series:', error);
      message.error('获取销售系列失败');
    }
  };

  // 3. 获取销售款式（来自 sale_variants，作为默认值参考）
  const fetchSaleVariants = async (seriesId: string) => {
    try {
      const response = await request(`/api/sale-variants/sale-series/${seriesId}`);
      if (response.code === 200 || response.message === 'success') {
        const variants: SaleVariantItem[] = response.data || [];
        setSaleVariants(variants);
        // 初始化抽盒机款式配置（默认复用商城数据，不覆盖）
        const initialConfig: BlindBoxMachineVariant[] = variants.map((v) => ({
          machineId: machineId || '',
          saleVariantId: v.saleVariantId,
          variantId: v.variantId,
          skuCode: v.skuCode,
          variantName: v.skuCode,
          variantImage: parseImages(v.customImages)[0] || '',
          overrideStock: false,
          stockQuantity: v.stockQuantity,
          overrideProbability: false,
          drawProbability: undefined,
          drawnCount: 0,
          remainingStock: v.stockQuantity,
        }));
        setVariantList(initialConfig);
      }
    } catch (error) {
      console.error('Error fetching sale variants:', error);
      message.error('获取销售款式失败');
    }
  };

  // 4. 编辑模式加载已有配置
  const fetchMachineDetail = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const [detailResp, variantsResp] = await Promise.all([
        getBlindBoxMachineDetail(machineId!),
        getBlindBoxMachineVariants(machineId!),
      ]);

      if (detailResp.code === 200 || detailResp.message === 'success') {
        const m = detailResp.data;
        setMachine(m);
        setSelectedSeriesId(m.saleSeriesId);
        form.setFieldsValue({
          saleSeriesId: m.saleSeriesId,
          machineName: m.machineName,
          machineDescription: m.machineDescription,
          machineCoverImage: m.machineCoverImage,
          drawPrice: m.drawPrice,
          tenDrawPrice: m.tenDrawPrice,
          sortOrder: m.sortOrder,
        });
      }

      if (variantsResp.code === 200 || variantsResp.message === 'success') {
        const savedVariants: BlindBoxMachineVariant[] = variantsResp.data || [];
        if (savedVariants.length > 0) {
          setVariantList(savedVariants);
        }
      }
    } catch (error) {
      console.error('Error fetching machine detail:', error);
      message.error('加载抽盒机配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const sid = await fetchMerchantInfo();
      if (sid) {
        await fetchSaleSeriesOptions(sid);
        if (isEdit) {
          await fetchMachineDetail();
        }
      }
    })();
  }, [machineId]);

  // 选择销售系列后加载款式
  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    const option = saleSeriesOptions.find((s) => s.saleSeriesId === seriesId);
    if (option) {
      form.setFieldsValue({
        machineName: form.getFieldValue('machineName') || `${option.saleTitle} 抽盒机`,
        machineCoverImage: form.getFieldValue('machineCoverImage') || option.saleCoverImage,
      });
    }
    fetchSaleVariants(seriesId);
  };

  // 更新款式覆盖配置
  const updateVariantConfig = (
    saleVariantId: string,
    field: keyof BlindBoxMachineVariant,
    value: any,
  ) => {
    setVariantList((prev) =>
      prev.map((v) =>
        v.saleVariantId === saleVariantId ? { ...v, [field]: value } : v,
      ),
    );
  };

  // 步骤1校验
  const handleNextStep = async () => {
    try {
      const values = await form.validateFields();
      if (!values.saleSeriesId) {
        message.warning('请选择关联销售系列');
        return;
      }
      setCurrentStep(1);
    } catch (error) {
      // validation error
    }
  };

  // 保存
  const handleSave = async (submitAudit: boolean = false) => {
    try {
      const values = await form.validateFields();
      if (variantList.length === 0) {
        message.warning('该销售系列下没有可用的销售款式，无法创建抽盒机');
        return;
      }

      // 校验概率
      const overridingProbability = variantList.filter((v) => v.overrideProbability);
      if (overridingProbability.length > 0) {
        const totalProb = overridingProbability.reduce(
          (sum, v) => sum + (Number(v.drawProbability) || 0),
          0,
        );
        if (Math.abs(totalProb - 1) > 0.0001 && overridingProbability.length === variantList.length) {
          message.warning(
            `所有款式概率之和应为 1（当前为 ${totalProb.toFixed(4)}），请检查概率配置`,
          );
          return;
        }
      }

      setSaving(true);
      const payload: any = {
        shopId,
        saleSeriesId: values.saleSeriesId,
        machineName: values.machineName,
        machineDescription: values.machineDescription || '',
        machineCoverImage: values.machineCoverImage || '',
        drawPrice: values.drawPrice,
        tenDrawPrice: values.tenDrawPrice ?? null,
        sortOrder: values.sortOrder ?? 0,
      };

      let savedMachineId = machineId;
      if (isEdit) {
        const resp = await updateBlindBoxMachine(machineId!, payload);
        if (resp.code !== 200 && resp.message !== 'success') {
          message.error('更新失败: ' + (resp.message || '未知错误'));
          return;
        }
      } else {
        const resp = await createBlindBoxMachine(payload);
        if (resp.code === 200 || resp.message === 'success') {
          savedMachineId = resp.data.machineId;
        } else {
          message.error('创建失败: ' + (resp.message || '未知错误'));
          return;
        }
      }

      // 保存款式覆盖配置
      const variantsPayload = variantList.map((v) => ({
        ...v,
        machineId: savedMachineId,
        stockQuantity: v.overrideStock ? v.stockQuantity : null,
        drawProbability: v.overrideProbability ? v.drawProbability : null,
      }));
      const variantResp = await saveBlindBoxMachineVariants(
        savedMachineId!,
        variantsPayload,
      );
      if (variantResp.code !== 200 && variantResp.message !== 'success') {
        message.error('款式配置保存失败: ' + (variantResp.message || '未知错误'));
        return;
      }

      message.success(isEdit ? '更新成功' : '创建成功');
      history.push('/merchant-center/blind-box/list');
    } catch (error) {
      console.error('Save error:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const variantColumns = [
    {
      title: '款式图片',
      dataIndex: 'variantImage',
      key: 'variantImage',
      width: 60,
      render: (image: string) => (
        <Image
          width={36}
          height={36}
          src={getFullImageUrl(image)}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://neeko-copilot.bytedance.net/api/text2image?prompt=product%20placeholder%20image&size=60x60"
        />
      ),
    },
    {
      title: '款式名称',
      dataIndex: 'variantName',
      key: 'variantName',
      render: (name: string, record: BlindBoxMachineVariant) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name || record.skuCode}</Text>
          {record.variantType && (
            <Tag color={record.variantType === 'hidden' ? 'purple' : 'blue'}>
              {record.variantType === 'hidden' ? '隐藏款' : '常规款'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '默认库存',
      key: 'defaultStock',
      width: 100,
      render: (_: any, record: BlindBoxMachineVariant) => {
        const saleVariant = saleVariants.find(
          (s) => s.saleVariantId === record.saleVariantId,
        );
        return saleVariant ? saleVariant.stockQuantity : '-';
      },
    },
    {
      title: '抽盒库存',
      key: 'stockConfig',
      width: 200,
      render: (_: any, record: BlindBoxMachineVariant) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Checkbox
            checked={record.overrideStock}
            onChange={(e) =>
              updateVariantConfig(record.saleVariantId, 'overrideStock', e.target.checked)
            }
          >
            覆盖库存
          </Checkbox>
          {record.overrideStock && (
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="自定义库存"
              value={record.stockQuantity}
              onChange={(value) =>
                updateVariantConfig(record.saleVariantId, 'stockQuantity', value)
              }
            />
          )}
          {!record.overrideStock && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              复用商城库存
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '抽盒概率',
      key: 'probabilityConfig',
      width: 220,
      render: (_: any, record: BlindBoxMachineVariant) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Checkbox
            checked={record.overrideProbability}
            onChange={(e) =>
              updateVariantConfig(record.saleVariantId, 'overrideProbability', e.target.checked)
            }
          >
            覆盖概率
          </Checkbox>
          {record.overrideProbability && (
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.01}
              precision={4}
              placeholder="0-1 之间，如 0.05"
              value={record.drawProbability}
              onChange={(value) =>
                updateVariantConfig(record.saleVariantId, 'drawProbability', value)
              }
              addonAfter="%"
              formatter={(value) =>
                value ? `${(Number(value) * 100).toFixed(2)}` : ''
              }
              parser={(value) =>
                value ? `${Number(value) / 100}` : ''
              }
            />
          )}
          {!record.overrideProbability && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              复用商城默认概率
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '已抽/剩余',
      key: 'stats',
      width: 100,
      render: (_: any, record: BlindBoxMachineVariant) => (
        <Space direction="vertical" size={0}>
          <Text>已抽 {record.drawnCount || 0}</Text>
          <Text type="secondary">
            剩 {record.remainingStock ?? '-'}
          </Text>
        </Space>
      ),
    },
  ];

  // 概率合计展示
  const totalOverriddenProbability = variantList
    .filter((v) => v.overrideProbability)
    .reduce((sum, v) => sum + (Number(v.drawProbability) || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push('/merchant-center/blind-box/list')}
            >
              返回
            </Button>
            <span>{isEdit ? '编辑抽盒机' : '新建抽盒机'}</span>
            {isEdit && machine && (
              <Tag
                color={
                  machine.auditStatus === 'APPROVED'
                    ? 'green'
                    : machine.auditStatus === 'REJECTED'
                    ? 'red'
                    : 'blue'
                }
              >
                {machine.auditStatus === 'APPROVED'
                  ? '已审核'
                  : machine.auditStatus === 'REJECTED'
                  ? '已驳回'
                  : '待审核'}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                上一步
              </Button>
            )}
            {currentStep === 0 && (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNextStep}>
                下一步
              </Button>
            )}
            {currentStep === 1 && (
              <>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={() => handleSave(false)}
                >
                  保存为草稿
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Steps
          current={currentStep}
          items={[
            { title: '基础配置' },
            { title: '款式覆盖配置' },
          ]}
          style={{ marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}
        />

        <Form form={form} layout="vertical" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Alert
              message="抽盒机完全复用已有销售系列数据"
              description="选择一个上架中的销售系列，系统将自动加载该系列下所有款式作为抽盒池。您可在下一步对单个款式的库存和概率进行覆盖配置（默认复用商城数据）。"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24 }}
            />

            <Form.Item
              name="saleSeriesId"
              label="关联销售系列"
              rules={[{ required: true, message: '请选择关联销售系列' }]}
              extra={
                saleSeriesOptions.length === 0
                  ? '当前店铺暂无销售系列，请先在「商品管理」中创建'
                  : undefined
              }
            >
              <Select
                placeholder="请选择销售系列"
                showSearch
                optionFilterProp="label"
                onChange={handleSeriesChange}
                disabled={isEdit}
                options={saleSeriesOptions.map((s) => ({
                  label: `${s.saleTitle}（${s.variantCount} 款式）`,
                  value: s.saleSeriesId,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="machineName"
              label="抽盒机名称"
              rules={[{ required: true, message: '请输入抽盒机名称' }]}
            >
              <Input placeholder="例如：星之守护者系列抽盒机" maxLength={50} />
            </Form.Item>

            <Form.Item name="machineDescription" label="抽盒机描述">
              <TextArea
                rows={3}
                placeholder="抽盒机玩法说明、保底规则等"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item name="machineCoverImage" label="抽盒机封面图">
              <Upload
                name="file"
                action={`${API_BASE_URL}/api/upload/image?type=machine`}
                listType="picture-card"
                maxCount={1}
                headers={{
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    const url = info.file.response?.data?.url;
                    if (url) {
                      form.setFieldValue('machineCoverImage', url);
                    }
                  } else if (info.file.status === 'error') {
                    message.error('上传失败');
                  }
                }}
                onRemove={() => {
                  form.setFieldValue('machineCoverImage', undefined);
                }}
              >
                {form.getFieldValue('machineCoverImage') ? (
                  <Image
                    src={getFullImageUrl(form.getFieldValue('machineCoverImage'))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={false}
                  />
                ) : (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="drawPrice"
                  label="单抽价格"
                  rules={[{ required: true, message: '请输入单抽价格' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="例如：39.00"
                    prefix="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="tenDrawPrice" label="十连价格（可选）">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="例如：350.00"
                    prefix="¥"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="sortOrder" label="排序权重">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="数字越小越靠前"
                  />
                </Form.Item>
              </Col>
            </Row>

            {selectedSeriesId && saleVariants.length > 0 && (
              <Alert
                message={`已加载该系列下 ${saleVariants.length} 个销售款式`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        </Form>

        {currentStep === 1 && (
          <div>
            <Alert
              message="款式覆盖配置"
              description="默认复用商城 sale_variant 的库存和概率。勾选「覆盖库存」或「覆盖概率」可单独为抽盒机配置不同值，未勾选则保持与商城一致。"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />

            {variantList.filter((v) => v.overrideProbability).length > 0 && (
              <Alert
                message={`已覆盖概率合计：${(totalOverriddenProbability * 100).toFixed(2)}%${
                  variantList.filter((v) => v.overrideProbability).length === variantList.length
                    ? totalOverriddenProbability === 1
                      ? '（全部覆盖，需等于 100%）'
                      : '（全部覆盖，应等于 100%）'
                    : '（部分覆盖，未覆盖款式按比例分摊剩余概率）'
                }`}
                type={
                  variantList.filter((v) => v.overrideProbability).length === variantList.length &&
                  Math.abs(totalOverriddenProbability - 1) > 0.0001
                    ? 'warning'
                    : 'info'
                }
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              columns={variantColumns}
              dataSource={variantList}
              rowKey="saleVariantId"
              pagination={false}
              size="middle"
              loading={loading}
              scroll={{ x: 900 }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default BlindBoxMachineEdit;
