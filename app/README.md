# App端 - 潮玩社交电商

## 项目简介

App端是潮玩社交电商项目的移动端应用，基于React Native和Expo开发，提供潮玩浏览、购买、收藏、社交等功能。

## 技术栈

- React Native
- Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage

## 项目结构

```
app/
├── app/              # 应用页面
│   ├── (tabs)/       # 底部标签页
│   │   ├── index.tsx # 首页
│   │   ├── message.tsx # 消息
│   │   ├── mine.tsx  # 我的
│   │   └── shop.tsx  # 商城
│   ├── address/      # 地址管理
│   ├── order/        # 订单管理
│   ├── series/       # 系列详情
│   ├── shop/         # 商品详情
│   ├── _layout.tsx   # 根布局
│   ├── login.tsx     # 登录
│   └── register.tsx  # 注册
├── assets/           # 静态资源
├── components/       # 组件
├── config/           # 配置
├── services/         # API服务
├── types/            # 类型定义
└── utils/            # 工具函数
```

## 快速开始

1. 安装依赖
   ```bash
   npm install
   ```

2. 启动开发服务器
   ```bash
   npm start
   ```

3. 在Expo Go应用中扫描二维码，或在模拟器中运行
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## 主要功能

### 核心功能
- **潮玩展示**：浏览各类潮玩商品，支持分类查看
- **商品详情**：查看商品的详细信息、图片、价格等
- **用户认证**：登录、注册、第三方登录（微信、QQ、微博）
- **购物车**：添加商品到购物车，管理购物车商品
- **订单管理**：创建订单、查看订单状态、订单历史
- **地址管理**：添加、编辑、删除收货地址
- **社交功能**：查看消息、互动交流

### 技术特点
- 使用Expo Router进行路由管理
- 支持深色模式
- 响应式布局，适配不同屏幕尺寸
- 集成AsyncStorage进行本地数据存储
- 实现JWT token自动刷新机制

## 配置说明

在 `config/index.ts` 中配置API基础URL等信息。

## 注意事项

- 确保Node.js版本 >= 18.0.0
- 需要安装Expo Go应用（移动端）或模拟器（开发环境）
- 首次运行可能需要下载相关依赖和资源

## 构建与部署

### 构建Web版本
```bash
npm run build:web
```

### 构建移动端版本
使用Expo Build或EAS Build进行构建。

## 许可证

MIT