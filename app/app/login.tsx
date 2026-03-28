import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';

const Login = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const handleLogin = async () => {
    if (!account || !password) {
      alert('请输入账号和密码');
      return;
    }
    if (!agreed) {
      alert('请阅读并同意用户协议和隐私协议');
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrPhone: account,
          password: password,
        }),
      });

      const data = await response.json();
      if (data.code === 200) {
        // 登录成功，保存用户信息和token
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.data.user));
        await AsyncStorage.setItem('token', data.data.token || data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken || '');
        await AsyncStorage.setItem('userId', data.data.user.userId || data.data.user.id);
        
        // 保存 token 过期时间
        const expiresIn = data.data.expiresIn || 1800; // 默认30分钟
        const tokenExpireTime = Date.now() + expiresIn * 1000;
        await AsyncStorage.setItem('tokenExpireTime', tokenExpireTime.toString());
        
        console.log('[登录] userId 已保存:', data.data.user.userId || data.data.user.id);
        console.log('[登录] token 过期时间:', new Date(tokenExpireTime).toLocaleString());
        // 跳转到首页
        router.push('/');
      } else {
        alert(data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录请求失败');
      alert('网络错误，请稍后重试');
    }
  };

  const handleWechatLogin = () => {
    // 微信登录逻辑
  };

  const handleQQLogin = () => {
    // QQ登录逻辑
  };

  const handleWeiboLogin = () => {
    // 微博登录逻辑
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 背景图片 */}
        <View style={styles.background}>
          <Image 
            source={{ uri: 'https://img.js.design/assets/img/68f0ab2603df0d2c632ad769.png' }} 
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

        {/* 登录表单 */}
        <View style={styles.formContainer}>
          {/* 账号输入 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号/账号"
              placeholderTextColor="#999"
              value={account}
              onChangeText={setAccount}
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

          {/* 协议和验证码 */}
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
            <TouchableOpacity>
              <Text style={styles.verificationText}>接收不到验证码？</Text>
            </TouchableOpacity>
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity 
            style={[styles.loginButton, !agreed && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!agreed}
          >
            <Text style={styles.loginButtonText}>立即登录/注册</Text>
          </TouchableOpacity>

          {/* 注册链接 */}
          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerLinkText}>没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>立即注册</Text>
            </TouchableOpacity>
          </View>

          {/* 其他登录方式 */}
          <View style={styles.otherLoginContainer}>
            <Text style={styles.otherLoginText}>其他登录方式</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} onPress={handleWechatLogin}>
                <Svg width={40} height={40} viewBox="0 0 24 24">
                  <Path 
                    d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-2 16.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm-1-9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" 
                    fill="#07C160" 
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={handleQQLogin}>
                <Svg width={40} height={40} viewBox="0 0 24 24">
                  <Path 
                    d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-2 16.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm-1-9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" 
                    fill="#1DA1F2" 
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={handleWeiboLogin}>
                <Svg width={40} height={40} viewBox="0 0 24 24">
                  <Path 
                    d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-2 16.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5 4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm-1-9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" 
                    fill="#E6162D" 
                  />
                </Svg>
              </TouchableOpacity>
            </View>
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
    height: '100%',
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
    borderRadius: 20,
    backgroundColor: '#5A15CF',
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
    justifyContent: 'space-between',
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
  verificationText: {
    fontSize: 12,
    color: '#8069E1',
  },
  loginButton: {
    backgroundColor: '#8069E1',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  otherLoginContainer: {
    alignItems: 'center',
  },
  otherLoginText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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

export default Login;