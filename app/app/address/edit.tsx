import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { createAddress, updateAddress, getAddressDetail } from '../../services/addressService';
import { getUserIdFromToken } from '../../utils/jwtHelper';
import type { CreateAddressRequest, UpdateAddressRequest } from '../../types';

const AddressEdit: React.FC = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 表单数据
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressTag, setAddressTag] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // 错误状态
  const [errors, setErrors] = useState({
    recipientName: '',
    recipientPhone: '',
    province: '',
    city: '',
    detailAddress: ''
  });

  useEffect(() => {
    if (isEdit && params.id) {
      loadAddressDetail(params.id);
    }
  }, [isEdit, params.id]);

  const loadAddressDetail = async (addressId: string) => {
    setLoading(true);
    try {
      const response = await getAddressDetail(addressId);
      if (response.data && response.data.code === 200) {
        const address = response.data.data;
        setRecipientName(address.recipientName);
        setRecipientPhone(address.recipientPhone);
        setProvince(address.province);
        setCity(address.city);
        setDistrict(address.district || '');
        setDetailAddress(address.detailAddress);
        setPostalCode(address.postalCode || '');
        setAddressTag(address.addressTag || '');
        setIsDefault(address.isDefault);
      }
    } catch (error) {
      console.error('加载地址详情失败');
      Alert.alert('错误', '加载地址详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 重置错误信息
    setErrors({
      recipientName: '',
      recipientPhone: '',
      province: '',
      city: '',
      detailAddress: ''
    });
    
    // 验证必填字段
    let isValid = true;
    const newErrors = {
      recipientName: '',
      recipientPhone: '',
      province: '',
      city: '',
      detailAddress: ''
    };
    
    if (!recipientName.trim()) {
      newErrors.recipientName = '请输入收货人姓名';
      isValid = false;
    }
    if (!recipientPhone.trim()) {
      newErrors.recipientPhone = '请输入手机号码';
      isValid = false;
    }
    if (!province.trim()) {
      newErrors.province = '请输入省份';
      isValid = false;
    }
    if (!city.trim()) {
      newErrors.city = '请输入城市';
      isValid = false;
    }
    if (!detailAddress.trim()) {
      newErrors.detailAddress = '请输入详细地址';
      isValid = false;
    }
    
    // 更新错误状态
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert('提示', '请先登录');
        router.back();
        return;
      }

      if (isEdit && params.id) {
        // 更新地址
        const updateData: UpdateAddressRequest = {
          addressId: params.id,
          recipientName,
          recipientPhone,
          province,
          city,
          district,
          detailAddress,
          postalCode,
          addressTag,
          isDefault,
        };
        const response = await updateAddress(updateData);
        
        // 直接返回，不显示Alert
        router.back();
      } else {
        // 创建地址
        const createData: CreateAddressRequest = {
          recipientName,
          recipientPhone,
          province,
          city,
          district,
          detailAddress,
          postalCode,
          addressTag,
          isDefault,
        };
        const response = await createAddress(createData);
        
        // 直接返回，不显示Alert
        router.back();
      }
    } catch (error) {
      console.error('保存地址失败');
      Alert.alert('错误', '保存地址失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" fill="#333"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '编辑地址' : '添加地址'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.formItem}>
          <Text style={styles.label}>收货人</Text>
          <TextInput
            style={[styles.input, errors.recipientName ? styles.inputError : null]}
            placeholder="请输入收货人姓名"
            value={recipientName}
            onChangeText={(text) => {
              setRecipientName(text);
              // 清除错误信息
              if (errors.recipientName) {
                setErrors({...errors, recipientName: ''});
              }
            }}
            maxLength={20}
          />
          {errors.recipientName ? (
            <Text style={styles.errorText}>{errors.recipientName}</Text>
          ) : null}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>手机号码</Text>
          <TextInput
            style={[styles.input, errors.recipientPhone ? styles.inputError : null]}
            placeholder="请输入手机号码"
            value={recipientPhone}
            onChangeText={(text) => {
              setRecipientPhone(text);
              // 清除错误信息
              if (errors.recipientPhone) {
                setErrors({...errors, recipientPhone: ''});
              }
            }}
            keyboardType="phone-pad"
            maxLength={11}
          />
          {errors.recipientPhone ? (
            <Text style={styles.errorText}>{errors.recipientPhone}</Text>
          ) : null}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>所在地区</Text>
          <View style={styles.regionRow}>
            <TextInput
              style={[styles.input, styles.regionInput, errors.province ? styles.inputError : null]}
              placeholder="省份"
              value={province}
              onChangeText={(text) => {
                setProvince(text);
                // 清除错误信息
                if (errors.province) {
                  setErrors({...errors, province: ''});
                }
              }}
            />
            <TextInput
              style={[styles.input, styles.regionInput, errors.city ? styles.inputError : null]}
              placeholder="城市"
              value={city}
              onChangeText={(text) => {
                setCity(text);
                // 清除错误信息
                if (errors.city) {
                  setErrors({...errors, city: ''});
                }
              }}
            />
            <TextInput
              style={[styles.input, styles.regionInput]}
              placeholder="区县"
              value={district}
              onChangeText={setDistrict}
            />
          </View>
          {errors.province ? (
            <Text style={styles.errorText}>{errors.province}</Text>
          ) : null}
          {errors.city ? (
            <Text style={styles.errorText}>{errors.city}</Text>
          ) : null}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>详细地址</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.detailAddress ? styles.inputError : null]}
            placeholder="请输入详细地址（如街道、门牌号等）"
            value={detailAddress}
            onChangeText={(text) => {
              setDetailAddress(text);
              // 清除错误信息
              if (errors.detailAddress) {
                setErrors({...errors, detailAddress: ''});
              }
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {errors.detailAddress ? (
            <Text style={styles.errorText}>{errors.detailAddress}</Text>
          ) : null}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>邮政编码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入邮政编码（选填）"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>地址标签</Text>
          <View style={styles.tagRow}>
            {['家', '公司', '学校'].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagBtn,
                  addressTag === tag && styles.tagBtnActive,
                ]}
                onPress={() => setAddressTag(addressTag === tag ? '' : tag)}
              >
                <Text style={[
                  styles.tagBtnText,
                  addressTag === tag && styles.tagBtnTextActive,
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formItem}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>设为默认地址</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#ccc', true: '#FFB6B6' }}
              thumbColor={isDefault ? '#FF6B6B' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>

      {/* 底部保存按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => {
            handleSave();
          }}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 34,
  },
  form: {
    flex: 1,
    padding: 15,
  },
  formItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 8,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionInput: {
    flex: 1,
    marginHorizontal: 3,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  tagBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  tagBtnActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  tagBtnText: {
    fontSize: 14,
    color: '#666',
  },
  tagBtnTextActive: {
    color: '#FF6B6B',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddressEdit;
