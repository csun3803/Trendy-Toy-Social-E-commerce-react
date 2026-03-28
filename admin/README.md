# 管理后台 - 潮玩社交电商

## 项目简介

管理后台是潮玩社交电商项目的Web管理系统，基于Ant Design Pro开发，提供商品管理、订单管理、用户管理等功能。

## 技术栈

- React
- Ant Design Pro
- TypeScript
- Umi
- Ant Design
- Pro Components

## 项目结构

```
admin/
├── config/           # 配置
├── mock/             # 模拟数据
├── public/           # 静态资源
├── src/              # 源代码
│   ├── components/   # 组件
│   ├── locales/      # 国际化
│   ├── access.ts     # 权限管理
│   ├── app.tsx       # 应用入口
│   └── global.tsx    # 全局配置
└── package.json      # 依赖管理
```

## 快速开始

1. 安装依赖
   ```bash
   npm install
   ```

2. 启动开发服务器
   ```bash
   npm run start
   ```

3. 访问 http://localhost:8000

## 主要功能

### 核心功能
- **商品管理**：添加、编辑、删除商品，管理商品分类和库存
- **订单管理**：查看订单列表，处理订单状态，发货管理
- **用户管理**：查看用户列表，管理用户权限，用户信息编辑
- **数据分析**：销售数据统计，用户行为分析
- **系统设置**：配置系统参数，管理系统功能

### 技术特点
- 使用Ant Design Pro构建管理界面
- 支持国际化
- 权限管理系统
- 响应式布局，适配不同屏幕尺寸
- 集成Mock数据，方便开发测试

## 配置说明

### 配置文件
- `config/config.ts`：系统配置
- `config/routes.ts`：路由配置
- `config/proxy.ts`：代理配置

### 环境变量
- `REACT_APP_ENV`：环境变量（dev、test、pre、prod）
- `MOCK`：是否启用Mock数据

## 注意事项

- 确保Node.js版本 >= 20.0.0
- 使用现代浏览器访问（Chrome、Firefox、Safari等）
- 开发环境下可使用Mock数据进行测试

## 构建与部署

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 部署
将 `dist` 目录部署到服务器即可。

## 开发命令

- `npm run start`：启动开发服务器
- `npm run build`：构建生产版本
- `npm run lint`：代码检查
- `npm run test`：运行测试
- `npm run openapi`：生成API文档

## 许可证

MIT