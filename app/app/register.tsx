import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { config } from '@/config';

const Register = () => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const handleRegister = async () => {
    if (!username || !phoneNumber || !password || !confirmPassword) {
      alert('请填写所有字段');
      return;
    }
    if (password !== confirmPassword) {
      alert('两次密码输入不一致');
      return;
    }
    if (!agreed) {
      alert('请阅读并同意用户协议和隐私协议');
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          phoneNumber: phoneNumber,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.code === 200) {
        // 注册成功，跳转到登录页面
        alert('注册成功，请登录');
        router.push('/login');
      } else {
        alert(data.message || '注册失败');
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      alert('网络错误或服务器未响应，请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 背景图片 */}
        <View style={styles.background}>
          <Image 
            source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20toys%20pattern%20background%20with%20purple%20theme&image_size=landscape_16_9' }} 
            style={styles.backgroundImage} 
            resizeMode="cover"
          />
        </View>

        {/* 潮玩图标 */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>潮</Text>
          </View>
        </View>

        {/* 注册表单 */}
        <View style={styles.formContainer}>
          {/* 用户名输入 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* 手机号输入 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* 密码输入 */}
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

          {/* 确认密码输入 */}
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

          {/* 协议 */}
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

          {/* 注册按钮 */}
          <TouchableOpacity 
            style={[styles.registerButton, !agreed && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={!agreed}
          >
            <Text style={styles.registerButtonText}>立即注册</Text>
          </TouchableOpacity>

          {/* 跳转到登录 */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>立即登录</Text>
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
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8069E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formContainer: {
    marginTop: 50,
    paddingHorizontal: 30,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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

export default Register;