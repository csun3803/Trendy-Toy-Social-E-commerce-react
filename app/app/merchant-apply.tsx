import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';

const SUBJECT_TYPES = [
  { label: '个人', value: 0 },
  { label: '个体户', value: 1 },
  { label: '企业', value: 2 },
];

const MerchantApply = () => {
  const [shopName, setShopName] = useState('');
  const [contactName, setContactName] = useState('');
  const [subjectType, setSubjectType] = useState(0);
  const [subjectTypeLabel, setSubjectTypeLabel] = useState('个人');
  const [licenseNo, setLicenseNo] = useState('');
  const [idCardNo, setIdCardNo] = useState('');
  const [idCardFront, setIdCardFront] = useState('');
  const [idCardBack, setIdCardBack] = useState('');
  const [licenseImage, setLicenseImage] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCardNo, setBankCardNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      if (!token) {
        router.push('/merchant-login' as any);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/merchant-application/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.code === 200 && data.data) {
        const app = data.data;
        if (app.status === 0) {
          Alert.alert('提示', '您的入驻申请正在审核中，请耐心等待');
          return;
        } else if (app.status === 1) {
          Alert.alert('提示', '您的入驻申请已通过审核！');
          return;
        } else if (app.status === 2) {
          Alert.alert('提示', `您的入驻申请被驳回，原因：${app.auditRemark || '无'}，请修改后重新提交`);
          // 填充之前的数据
          setShopName(app.shopName || '');
          setContactName(app.contactName || '');
          setSubjectType(app.subjectType || 0);
          setLicenseNo(app.licenseNo || '');
          setIdCardNo(app.idCardNo || '');
          setBankAccountName(app.bankAccountName || '');
          setBankName(app.bankName || '');
          setBankCardNo(app.bankCardNo || '');
        }
      }
    } catch (error) {
      console.error('获取申请状态失败:', error);
    }
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!shopName) { Alert.alert('提示', '请输入店铺名称'); return; }
    if (!contactName) { Alert.alert('提示', '请输入联系人姓名'); return; }
    if (!idCardNo) { Alert.alert('提示', '请输入身份证号'); return; }
    if (!idCardFront) { Alert.alert('提示', '请输入身份证正面图片URL'); return; }
    if (!idCardBack) { Alert.alert('提示', '请输入身份证反面图片URL'); return; }
    if ((subjectType === 1 || subjectType === 2) && !licenseNo) {
      Alert.alert('提示', '个体户/企业需填写营业执照号'); return;
    }
    if (!bankAccountName) { Alert.alert('提示', '请输入银行户名'); return; }
    if (!bankName) { Alert.alert('提示', '请输入开户行'); return; }
    if (!bankCardNo) { Alert.alert('提示', '请输入银行卡号'); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const response = await fetch(`${config.API_BASE_URL}/merchant-application/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopName,
          contactName,
          subjectType,
          licenseNo: licenseNo || undefined,
          licenseImage: licenseImage || undefined,
          idCardNo,
          idCardFront,
          idCardBack,
          bankAccountName,
          bankName,
          bankCardNo,
        }),
      });

      const data = await response.json();
      if (data.code === 200 || data.message === 'success') {
        Alert.alert('成功', '入驻申请提交成功，请等待审核', [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('提交失败', data.message || '请稍后重试');
      }
    } catch (error) {
      console.error('提交申请失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>商家入驻申请</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 店铺基本信息 */}
        {renderSectionHeader('店铺基本信息')}
        <View style={styles.card}>
          <Text style={styles.label}>店铺名称 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入店铺名称"
            placeholderTextColor="#999"
            value={shopName}
            onChangeText={setShopName}
          />
          <Text style={styles.label}>联系人姓名 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入联系人姓名"
            placeholderTextColor="#999"
            value={contactName}
            onChangeText={setContactName}
          />
        </View>

        {/* 主体资质信息 */}
        {renderSectionHeader('主体资质信息')}
        <View style={styles.card}>
          <Text style={styles.label}>主体类型 *</Text>
          <View style={styles.typeSelector}>
            {SUBJECT_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.typeButton, subjectType === item.value && styles.typeButtonActive]}
                onPress={() => { setSubjectType(item.value); setSubjectTypeLabel(item.label); }}
              >
                <Text style={[styles.typeButtonText, subjectType === item.value && styles.typeButtonTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(subjectType === 1 || subjectType === 2) && (
            <>
              <Text style={styles.label}>营业执照号 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入营业执照号"
                placeholderTextColor="#999"
                value={licenseNo}
                onChangeText={setLicenseNo}
              />
              <Text style={styles.label}>营业执照图片URL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入营业执照图片URL"
                placeholderTextColor="#999"
                value={licenseImage}
                onChangeText={setLicenseImage}
              />
            </>
          )}

          <Text style={styles.label}>身份证号 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入18位身份证号"
            placeholderTextColor="#999"
            value={idCardNo}
            onChangeText={setIdCardNo}
            maxLength={18}
          />
          <Text style={styles.label}>身份证正面图片URL *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入身份证正面图片URL"
            placeholderTextColor="#999"
            value={idCardFront}
            onChangeText={setIdCardFront}
          />
          <Text style={styles.label}>身份证反面图片URL *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入身份证反面图片URL"
            placeholderTextColor="#999"
            value={idCardBack}
            onChangeText={setIdCardBack}
          />
        </View>

        {/* 财务信息 */}
        {renderSectionHeader('财务信息')}
        <View style={styles.card}>
          <Text style={styles.label}>银行户名 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入银行户名"
            placeholderTextColor="#999"
            value={bankAccountName}
            onChangeText={setBankAccountName}
          />
          <Text style={styles.label}>开户行 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="例如：中国工商银行杭州西湖支行"
            placeholderTextColor="#999"
            value={bankName}
            onChangeText={setBankName}
          />
          <Text style={styles.label}>银行卡号 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="请输入银行卡号"
            placeholderTextColor="#999"
            value={bankCardNo}
            onChangeText={setBankCardNo}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '提交中...' : '提交申请'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8069E1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  sectionDot: {
    width: 4,
    height: 16,
    backgroundColor: '#8069E1',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  typeButtonActive: {
    backgroundColor: '#F0EBFF',
    borderColor: '#8069E1',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#8069E1',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#8069E1',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default MerchantApply;
