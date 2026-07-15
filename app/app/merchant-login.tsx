import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Picker } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';

const MerchantLogin = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert('提示', '请输入手机号和密码');
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/merchant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrPhone: mobile,
          password: password,
        }),
      });

      const data = await response.json();
      if (data.code === 200) {
        await AsyncStorage.setItem('merchantToken', data.data.token);
        await AsyncStorage.setItem('merchantInfo', JSON.stringify(data.data.user));
        await AsyncStorage.setItem('userType', 'merchant');
        
        // 根据审核状态跳转
        const auditStatus = data.data.user?.auditStatus;
        if (auditStatus === '已通过') {
          Alert.alert('成功', '登录成功');
        } else {
          Alert.alert('提示', '您的入驻申请尚未通过审核，请先完善申请信息');
          router.push('/merchant-apply' as any);
        }
      } else {
        Alert.alert('登录失败', data.message || '请检查账号密码');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
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
          <Text style={styles.title}>商家登录</Text>
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

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>登录</Text>
          </TouchableOpacity>

          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerLinkText}>没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/merchant-register' as any)}>
              <Text style={styles.registerLink}>去注册</Text>
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
    marginTop: 100,
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: '#8069E1',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#8069E1',
    marginLeft: 5,
  },
});

export default MerchantLogin;
