import { LockOutlined, UserOutlined, ShopOutlined, CrownOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history } from '@umijs/max';
import { Alert, App, Tabs, message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { Footer } from '@/components';
import { flushSync } from 'react-dom';
import { useModel } from '@umijs/max';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    registerLink: {
      textAlign: 'center',
      marginTop: '16px',
    }
  };
});

const LoginMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Alert
      style={{ marginBottom: 24 }}
      message={content}
      type="error"
      showIcon
    />
  );
};

type LoginType = 'merchant' | 'admin';

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<LoginType>('merchant');
  const [showRegister, setShowRegister] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message: messageApi } = App.useApp();

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || !userType) {
      return undefined;
    }

    const url = userType === 'merchant' 
      ? '/api/merchant/info/current' 
      : '/api/admin/info/current';
    
    try {
      const response = await fetch(`http://localhost:8080${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      if (result.code === 200) {
        const userData = result.data;
        return {
          ...userData,
          access: userType,
          name: userType === 'admin' ? userData.adminId : userData.shopName || userData.shopId,
          avatar: userData.logo || userData.avatar,
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    return undefined;
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = type === 'merchant' 
        ? '/api/merchant/login' 
        : '/api/admin/login';
      
      const response = await fetch(`http://localhost:8080${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrPhone: values.username,
          password: values.password,
        }),
      });
      
      const result = await response.json();
      
      if (result.code === 200) {
        messageApi.success('登录成功！');
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userType', type);
        localStorage.setItem('userInfo', JSON.stringify(result.data.user));
        
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          flushSync(() => {
            setInitialState((s) => ({
              ...s,
              currentUser: userInfo,
            }));
          });
        }
        
        const urlParams = new URL(window.location.href).searchParams;
        window.location.href = urlParams.get('redirect') || '/';
        return;
      }
      
      setUserLoginState({ status: 'error', type });
      messageApi.error(result.message || '登录失败');
    } catch (error) {
      console.error(error);
      messageApi.error('登录失败，请重试！');
    }
  };

  const handleRegister = async (values: any) => {
    try {
      const url = type === 'merchant' 
        ? '/api/merchant/register' 
        : '/api/admin/register';
      
      const response = await fetch(`http://localhost:8080${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });
      
      const result = await response.json();
      
      if (result.code === 200) {
        messageApi.success('注册成功！请登录');
        setShowRegister(false);
      } else {
        messageApi.error(result.message || '注册失败');
      }
    } catch (error) {
      console.error(error);
      messageApi.error('注册失败，请重试！');
    }
  };

  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - {Settings.title}</title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        {showRegister ? (
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '75vw',
            }}
            logo={<img alt="logo" src="/logo.svg" />}
            title="注册"
            subTitle="创建您的账户"
            onFinish={handleRegister}
            submitter={{
              searchConfig: {
                submitText: '注册',
              },
            }}
          >
            <Tabs
              activeKey={type}
              onChange={(key) => setType(key as LoginType)}
              centered
              items={[
                { key: 'merchant', label: <span><ShopOutlined /> 商家注册</span> },
                { key: 'admin', label: <span><CrownOutlined /> 管理员注册</span> },
              ]}
            />
            
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
              placeholder="请输入用户名"
              rules={[{ required: true, message: '请输入用户名!' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="请输入密码"
              rules={[{ required: true, message: '请输入密码！' }]}
            />
            <ProFormText.Password
              name="confirmPassword"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="请再次输入密码"
              rules={[{ required: true, message: '请再次输入密码！' }]}
            />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => setShowRegister(false)}>
                已有账户？去登录
              </a>
            </div>
          </LoginForm>
        ) : (
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '75vw',
            }}
            logo={<img alt="logo" src="/logo.svg" />}
            title="登录"
            subTitle="登录到您的账户"
            onFinish={handleSubmit}
            submitter={{
              searchConfig: {
                submitText: '登录',
              },
            }}
          >
            <Tabs
              activeKey={type}
              onChange={(key) => setType(key as LoginType)}
              centered
              items={[
                { key: 'merchant', label: <span><ShopOutlined /> 商家登录</span> },
                { key: 'admin', label: <span><CrownOutlined /> 管理员登录</span> },
              ]}
            />

            {status === 'error' && loginType === type && (
              <LoginMessage content="账户或密码错误" />
            )}
            
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
              placeholder="请输入用户名"
              rules={[{ required: true, message: '请输入用户名!' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="请输入密码"
              rules={[{ required: true, message: '请输入密码！' }]}
            />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => setShowRegister(true)}>
                没有账户？去注册
              </a>
            </div>
          </LoginForm>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Login;