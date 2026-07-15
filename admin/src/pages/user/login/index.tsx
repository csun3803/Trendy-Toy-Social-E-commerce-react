import { LockOutlined, UserOutlined, MobileOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet } from '@umijs/max';
import { Alert, App, message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
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
      height: '100vh',
      overflow: 'hidden',
      background: '#f0f5ff',
    },
    leftPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a4da0 0%, #1890ff 40%, #40a9ff 70%, #69c0ff 100%)',
      '@media (max-width: 768px)': {
        display: 'none',
      },
    },
    rightPanel: {
      width: 480,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 48px',
      background: '#fff',
      position: 'relative',
      overflow: 'auto',
      '@media (max-width: 768px)': {
        width: '100%',
        padding: '32px 24px',
      },
    },
    brandTitle: {
      color: '#fff',
      fontSize: 36,
      fontWeight: 700,
      letterSpacing: 2,
      marginBottom: 12,
      textShadow: '0 2px 12px rgba(0,0,0,0.15)',
      zIndex: 2,
    },
    brandSubTitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 1,
      zIndex: 2,
    },
    floatingShape: {
      position: 'absolute',
      borderRadius: '50%',
      opacity: 0.15,
      animation: 'floatShape 8s ease-in-out infinite',
    },
    shape1: {
      width: 220,
      height: 220,
      background: '#fff',
      top: '8%',
      left: '10%',
      animationDelay: '0s',
    },
    shape2: {
      width: 140,
      height: 140,
      background: '#bae7ff',
      top: '60%',
      left: '5%',
      animationDelay: '2s',
    },
    shape3: {
      width: 100,
      height: 100,
      background: '#fff',
      bottom: '15%',
      right: '15%',
      animationDelay: '4s',
    },
    shape4: {
      width: 60,
      height: 60,
      background: '#91d5ff',
      top: '25%',
      right: '20%',
      animationDelay: '1s',
    },
    shape5: {
      width: 180,
      height: 180,
      background: '#69c0ff',
      bottom: '5%',
      left: '30%',
      animationDelay: '3s',
    },
    toyIcon: {
      zIndex: 2,
      marginBottom: 32,
    },
    toyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      zIndex: 2,
      marginTop: 48,
    },
    toyCard: {
      width: 72,
      height: 72,
      borderRadius: 16,
      background: 'rgba(255,255,255,0.18)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
      transition: 'transform 0.3s, background 0.3s',
      ':hover': {
        transform: 'scale(1.12) rotate(-3deg)',
        background: 'rgba(255,255,255,0.3)',
      },
    },
    formWrapper: {
      width: '100%',
      maxWidth: 360,
    },
    formTitle: {
      fontSize: 28,
      fontWeight: 700,
      color: '#1890ff',
      marginBottom: 4,
      textAlign: 'center' as const,
    },
    formDesc: {
      fontSize: 14,
      color: '#8c8c8c',
      marginBottom: 32,
      textAlign: 'center' as const,
    },
    switchLink: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14,
      color: '#8c8c8c',
    },
    switchLinkA: {
      color: '#1890ff',
      cursor: 'pointer',
      fontWeight: 500,
      marginLeft: 4,
      ':hover': {
        textDecoration: 'underline',
      },
    },
    rightDecorTop: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 160,
      height: 160,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
      opacity: 0.5,
    },
    rightDecorBottom: {
      position: 'absolute',
      bottom: -40,
      left: -40,
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #e6f7ff, #91d5ff)',
      opacity: 0.4,
    },
    diamondShape: {
      position: 'absolute',
      width: 40,
      height: 40,
      background: 'rgba(255,255,255,0.12)',
      transform: 'rotate(45deg)',
      top: '40%',
      right: '8%',
      zIndex: 2,
      animation: 'floatShape 6s ease-in-out infinite',
      animationDelay: '1.5s',
    },
    triangleShape: {
      position: 'absolute',
      zIndex: 2,
      top: '15%',
      left: '18%',
      animation: 'floatShape 7s ease-in-out infinite',
      animationDelay: '0.5s',
    },
    waveBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 1,
    },
    footer: {
      position: 'absolute',
      bottom: 24,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      zIndex: 2,
    },
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

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
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
      const response = await fetch(url, {
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
          name: userType === 'admin' 
            ? userData.adminId 
            : userData.shopName || userData.shopId || userData.adminId,
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
      const response = await fetch('/api/login', {
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
        const userType = result.data.userType || result.data.type;
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userType', userType);
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
        const redirectUrl = urlParams.get('redirect');
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          if (userType === 'merchant') {
            const auditStatus = result.data.user?.auditStatus;
            if (auditStatus === '已通过') {
              window.location.href = '/merchant-center/dashboard';
            } else {
              window.location.href = '/merchant/apply';
            }
          } else if (userType === 'admin') {
            window.location.href = '/admin-dashboard';
          }
        }
        return;
      }

      setUserLoginState({ status: 'error' });
      messageApi.error(result.message || '登录失败');
    } catch (error) {
      console.error(error);
      messageApi.error('登录失败，请重试！');
    }
  };

  const handleRegister = async (values: any) => {
    try {
      const response = await fetch('/api/register', {
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

  const { status } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - {Settings.title}</title>
      </Helmet>

      <div className={styles.leftPanel}>
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
        <div className={`${styles.floatingShape} ${styles.shape3}`} />
        <div className={`${styles.floatingShape} ${styles.shape4}`} />
        <div className={`${styles.floatingShape} ${styles.shape5}`} />
        <div className={styles.diamondShape} />

        <svg className={styles.triangleShape} width="50" height="44" viewBox="0 0 50 44">
          <polygon points="25,0 50,44 0,44" fill="rgba(255,255,255,0.15)" />
        </svg>

        <div className={styles.toyIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="8" y="8" width="64" height="64" rx="16" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <circle cx="30" cy="32" r="6" fill="#fff" />
            <circle cx="50" cy="32" r="6" fill="#fff" />
            <circle cx="30" cy="32" r="3" fill="#1890ff" />
            <circle cx="50" cy="32" r="3" fill="#1890ff" />
            <path d="M28 48 Q40 58 52 48" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="14" r="5" fill="rgba(255,255,255,0.3)" />
            <circle cx="62" cy="14" r="5" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>

        <div className={styles.brandTitle}>潮玩管理后台</div>
        <div className={styles.brandSubTitle}>Trendy Toy Admin Platform</div>

        <div className={styles.toyGrid}>
          {['🎮', '🧸', '🎨', '🎪', '✨', '🚀'].map((emoji, i) => (
            <div key={i} className={styles.toyCard}>{emoji}</div>
          ))}
        </div>

        <svg className={styles.waveBottom} viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: 80 }}>
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
          <path d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,50 1440,80 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.05)" />
        </svg>

        <div className={styles.footer}>© 2026 潮玩管理后台 · Trendy Toy Admin</div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.rightDecorTop} />
        <div className={styles.rightDecorBottom} />

        <div className={styles.formWrapper}>
          {showRegister ? (
            <>
              <div className={styles.formTitle}>注册商家账号</div>
              <div className={styles.formDesc}>使用手机号注册商家账号，开启您的潮玩之旅</div>
              <LoginForm
                contentStyle={{
                  minWidth: 280,
                  maxWidth: '100%',
                }}
                logo={null}
                title={null}
                subTitle={null}
                onFinish={handleRegister}
                submitter={{
                  searchConfig: {
                    submitText: '注册',
                  },
                }}
              >
                <ProFormText
                  name="username"
                  fieldProps={{ size: 'large', prefix: <MobileOutlined />, maxLength: 11 }}
                  placeholder="请输入手机号"
                  rules={[
                    { required: true, message: '请输入手机号!' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                  ]}
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

                <div className={styles.switchLink}>
                  已有账户？<a className={styles.switchLinkA} onClick={() => setShowRegister(false)}>去登录</a>
                </div>
              </LoginForm>
            </>
          ) : (
            <>
              <div className={styles.formTitle}>欢迎回来</div>
              <div className={styles.formDesc}>登录潮玩管理后台，管理您的潮玩世界</div>
              <LoginForm
                contentStyle={{
                  minWidth: 280,
                  maxWidth: '100%',
                }}
                logo={null}
                title={null}
                subTitle={null}
                onFinish={handleSubmit}
                submitter={{
                  searchConfig: {
                    submitText: '登录',
                  },
                }}
              >
                {status === 'error' && (
                  <LoginMessage content="账户或密码错误" />
                )}

                <ProFormText
                  name="username"
                  fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                  placeholder="请输入用户名/手机号"
                  rules={[{ required: true, message: '请输入用户名/手机号!' }]}
                />
                <ProFormText.Password
                  name="password"
                  fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                  placeholder="请输入密码"
                  rules={[{ required: true, message: '请输入密码！' }]}
                />

                <div className={styles.switchLink}>
                  没有账户？<a className={styles.switchLinkA} onClick={() => setShowRegister(true)}>去注册</a>
                </div>
              </LoginForm>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatShape {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Login;
