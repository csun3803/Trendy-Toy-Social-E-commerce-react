# 潮玩社交电商项目

## 项目简介

潮玩社交电商项目是一个集潮玩展示、购买、社交于一体的综合性平台。项目包含两个主要部分：

- **App端**：基于React Native和Expo开发的移动端应用，提供潮玩浏览、购买、收藏、社交等功能
- **管理后台**：基于Ant Design Pro开发的Web管理系统，提供商品管理、订单管理、用户管理等功能

## 技术栈

### App端
- React Native + Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage

### 管理后台
- React + Ant Design Pro
- TypeScript
- Umi
- Ant Design

## 项目结构

```
Trendy-Toy-Social-E-commerce-react/
├── app/              # App端代码
│   ├── app/          # 应用页面
│   ├── assets/       # 静态资源
│   ├── components/   # 组件
│   ├── config/       # 配置
│   ├── services/     # API服务
│   └── utils/        # 工具函数
├── admin/            # 管理后台代码
│   ├── config/       # 配置
│   ├── mock/         # 模拟数据
│   ├── public/       # 静态资源
│   └── src/          # 源代码
└── README.md         # 项目说明
```

## 快速开始

### App端

1. 进入app目录
   ```bash
   cd app
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm start
   ```

4. 在Expo Go应用中扫描二维码，或在模拟器中运行

### 管理后台

1. 进入admin目录
   ```bash
   cd admin
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run start
   ```

4. 访问 http://localhost:8000

## 主要功能

### App端
- 潮玩展示与浏览
- 商品详情查看
- 用户登录与注册
- 购物车管理
- 订单管理
- 地址管理
- 社交功能

### 管理后台
- 商品管理
- 订单管理
- 用户管理
- 数据分析

## 注意事项

- 确保Node.js版本 >= 20.0.0
- App端需要Expo Go应用或模拟器
- 管理后台需要现代浏览器

## 许可证

MIT