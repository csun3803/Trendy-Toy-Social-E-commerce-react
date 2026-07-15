import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';

const MerchantRegister = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const handleRegister = async () => {
    if (!mobile || !password || !confirmPassword) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(mobile)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码输入不一致');
      return;
    }
    if (!agreed) {
      Alert.alert('提示', '请阅读并同意用户协议和隐私协议');
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/merchant-application/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();
      if (data.code === 200) {
        // 注册成功，保存登录信息
        await AsyncStorage.setItem('merchantToken', data.data.token);
        await AsyncStorage.setItem('merchantInfo', JSON.stringify(data.data.user));
        await AsyncStorage.setItem('userType', 'merchant');
        Alert.alert('成功', '注册成功！', [
          { text: '确定', onPress: () => router.push('/merchant-apply' as any) },
        ]);
      } else {
        Alert.alert('注册失败', data.message || '请稍后重试');
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>商</Text>
          </View>
          <Text style={styles.title}>商家注册</Text>
          <Text style={styles.subtitle}>使用手机号注册商家账号</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#999"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请确认密码"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.agreementContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && (
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="white"
                    />
                  </Svg>
                )}
              </View>
              <Text style={styles.agreementText}>我已阅读用户协议和隐私协议</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, !agreed && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={!agreed}
          >
            <Text style={styles.registerButtonText}>立即注册</Text>
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/merchant-login' as any)}>
              <Text style={styles.loginLink}>去登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#5A15CF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8069E1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8069E1',
  },
  agreementText: {
    fontSize: 12,
    color: '#666',
  },
  registerButton: {
    backgroundColor: '#8069E1',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#8069E1',
    marginLeft: 5,
  },
});

export default MerchantRegister;
