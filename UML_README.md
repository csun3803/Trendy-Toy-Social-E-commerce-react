# 潮玩社交电商系统 - UML建模文档

## 文件说明

### 核心UML模型文件

- `TrendyToyUMLClassDiagram.puml` - 系统UML类图文件（数据结构与关系）
- `TrendyToySequenceDiagrams.puml` - 系统UML时序图文件（业务流程时序）
- `TrendyToyDetailedSequence.puml` - 详细场景时序图文件（完整购物流程）
- `TrendyToyCommunicationDiagrams.puml` - 系统UML通信图文件（对象协作关系）
- `TrendyToyActivityDiagrams.puml` - 系统UML活动图文件（业务流程活动）
- `TrendyToyStateDiagrams.puml` - 系统UML状态图文件（对象状态流转）
- `TrendyToyDeploymentDiagram.puml` - 系统UML部署图文件（系统部署架构）

## UML模型详解

### 1. UML时序图 (TrendyToySequenceDiagrams.puml)

时序图展示了系统核心业务的时间顺序交互，包括以下场景：

- **用户登录流程**：用户认证、Token生成与保存
- **浏览商品添加购物车流程**：商品浏览、选择、添加到购物车
- **购物车管理流程**：购物车项选择、数量调整、删除
- **创建订单流程**：收货地址选择、订单创建、购物车清空
- **订单支付流程**：支付方式选择、第三方支付集成、支付状态更新
- **订单管理流程**：订单取消、确认收货、售后申请
- **售后申请流程**：售后类型选择、原因填写、申请提交

时序图中包含的关键参与者：
- 用户
- App前端
- 订单服务
- 购物车服务
- 用户服务
- 支付服务
- 数据库

### 2. 详细场景时序图 (TrendyToyDetailedSequence.puml)

这个文件展示了更详细的具体业务场景：

- **场景一：完整购物流程** - 从浏览商品到支付的端到端流程
- **场景二：订单支付与完成** - 支付验证、状态更新、完成订单
- **场景三：确认收货与售后** - 收货确认、售后申请处理

### 3. UML通信图 (TrendyToyCommunicationDiagrams.puml)

通信图强调参与交互的对象及其协作关系，包括以下协作包：

- **移动端应用包**：App客户端、各页面组件
- **服务层包**：各业务服务（订单、购物车、用户、商品、支付、售后）
- **数据层包**：各数据库存储
- **外部系统包**：第三方支付集成

主要协作关系：
- **购物流程协作**：购物车页面与购物车服务、结算页面与订单服务的交互
- **订单管理协作**：订单全生命周期的完整协作
- **商品浏览协作**：从商品详情到加入购物车的协作
- **用户认证协作**：登录认证与Token管理

### 4. UML类图 (TrendyToyUMLClassDiagram.puml)

### 5. UML状态图 (TrendyToyStateDiagrams.puml)

状态图展示了系统中关键对象的状态流转，包含以下状态机：

#### 订单状态机
- **待支付 (PENDING_PAYMENT)**: 订单创建后的初始状态
- **已支付 (PAID)**: 用户完成支付后的状态
- **已发货 (SHIPPED)**: 商家发货后的状态
- **已送达 (DELIVERED)**: 用户确认收货后的状态
- **已完成 (COMPLETED)**: 订单最终完成状态
- **已取消 (CANCELLED)**: 订单被取消的状态
- **退款中 (REFUNDING)**: 正在处理退款的状态
- **已退款 (REFUNDED)**: 退款完成的状态

#### 支付状态机
- **未支付 (UNPAID)**: 支付初始化状态
- **支付中 (PAYING)**: 正在进行支付
- **支付成功 (PAID)**: 支付完成
- **支付失败 (PAYMENT_FAILED)**: 支付失败
- **退款中 (REFUNDING)**: 退款处理中
- **部分退款 (PARTIAL_REFUNDED)**: 部分退款完成
- **全额退款 (FULLY_REFUNDED)**: 全额退款完成

#### 店铺审核状态机
- **草稿 (DRAFT)**: 店铺申请草稿状态
- **待审核 (PENDING_AUDIT)**: 提交审核等待处理
- **审核中 (AUDITING)**: 正在审核
- **审核通过 (AUDIT_PASSED)**: 审核通过
- **审核拒绝 (AUDIT_REJECTED)**: 审核被拒绝
- **运营中 (OPERATING)**: 正常营业状态
- **已暂停 (SUSPENDED)**: 违规暂停营业
- **已关闭 (CLOSED)**: 店铺已关闭

#### 用户账户状态机
- **未激活 (INACTIVE)**: 注册未激活
- **正常 (ACTIVE)**: 账户正常使用
- **已锁定 (LOCKED)**: 多次登录失败被锁定
- **已封禁 (BANNED)**: 违规被封禁
- **已注销 (DELETED)**: 用户主动注销

#### 社交活动状态机
- **草稿 (DRAFT)**: 活动创建草稿
- **待审核 (PENDING_REVIEW)**: 提交发布等待审核
- **审核中 (REVIEWING)**: 正在审核
- **已发布 (PUBLISHED)**: 审核通过已发布
- **审核拒绝 (REVIEW_REJECTED)**: 审核未通过
- **已隐藏 (HIDDEN)**: 用户隐藏活动
- **已删除 (DELETED)**: 活动已删除

### 6. UML部署图 (TrendyToyDeploymentDiagram.puml)

部署图展示了系统的物理部署架构，包含以下层次：

#### 用户层
- **移动用户**: iOS/Android设备上的移动应用用户
- **平台管理员**: 使用Web浏览器访问管理后台
- **商家管理员**: 使用Web浏览器访问商家管理后台

#### 前端层
- **React Native App (Expo)**: 移动端应用，支持iOS和Android
- **管理后台 (Ant Design Pro)**: 基于React的Web管理系统

#### CDN/静态资源层
- **图片CDN**: 七牛云或阿里云OSS，提供图片加速
- **静态资源服务器**: Nginx，提供静态文件服务

#### 网关/负载均衡层
- **API网关**: Nginx或Spring Cloud Gateway，负责请求路由、负载均衡、认证鉴权
- **负载均衡器**: 分发请求到后端服务集群

#### 后端服务层（微服务架构）
- **用户服务**: 用户认证、地址管理等
- **订单服务**: 订单创建、支付、状态管理
- **商品服务**: 商品信息、库存管理
- **购物车服务**: 购物车增删改查
- **支付服务**: 第三方支付集成
- **社交服务**: 社交活动、消息、关注等
- **店铺服务**: 店铺管理、商品上架
- **展示柜服务**: 收藏展示功能

#### 缓存层
- **Redis集群**: 业务数据缓存
- **Redis Session存储**: 用户Session存储

#### 数据层
- **MySQL主库**: 主数据库，负责写操作
- **MySQL从库**: 从数据库，负责读操作（读写分离）
- **文件存储**: MinIO或OSS，存储图片、文件等

#### 消息队列层
- **RabbitMQ**: 异步消息处理，用于订单创建、支付回调、消息推送等

#### 外部系统
- **微信支付**: 第三方支付渠道
- **支付宝**: 第三方支付渠道
- **短信服务**: 发送验证码、通知等
- **推送服务**: App消息推送

## 系统模块概览

### 1. 用户模块
- **User**: 系统用户实体，包含用户基本信息、账户状态、社交统计等
- **ShopAdmin**: 店铺管理员实体
- **PlatformAdmin**: 平台管理员实体
- **UserAddress**: 用户收货地址实体

### 2. 店铺模块
- **Shop**: 店铺实体，包含店铺信息、资质证明、财务信息、审核状态等
- **ShopCertificationFile**: 店铺认证文件实体

### 3. 商品模块
- **TechnicalIpAlbum**: IP专辑实体
- **Series**: 系列实体（如泡泡玛特的某个系列）
- **Product**: 商品（潮玩）实体，包含商品信息、价格库存、盲盒属性等
- **SaleSeries**: 店铺销售系列实体
- **SaleVariant**: 店铺销售变体实体

### 4. 订单模块
- **Order**: 订单实体，包含订单信息、支付状态、物流信息、售后信息等
- **OrderItem**: 订单项实体
- **CartItem**: 购物车项实体

### 5. 收藏展示模块
- **MyDisplayCabinet**: 展示柜实体，用户收藏展示自己的潮玩
- **CabinetItem**: 展示柜项实体

### 6. 社交模块
- **SocialActivity**: 社交活动实体，用户发布的分享、评测等
- **FollowRelationship**: 关注关系实体
- **PrivateConversation**: 私人会话实体
- **PrivateMessage**: 私人消息实体

## 主要关系说明

### 用户相关关系
- User 1--* UserAddress: 一个用户可以有多个收货地址
- User 1--* MyDisplayCabinet: 一个用户可以有多个展示柜
- User 1--* Order: 一个用户可以下多个订单
- User 1--* CartItem: 一个用户的购物车可以有多个商品
- User 1--* FollowRelationship: 用户之间可以互相关注
- User 1--* SocialActivity: 用户可以发布多个社交活动
- User 1--* PrivateConversation: 用户可以参与多个私人会话
- User 1--* PrivateMessage: 用户可以发送/接收多条私人消息

### 店铺相关关系
- Shop 1--* ShopAdmin: 一个店铺可以有多个管理员
- Shop 1--* ShopCertificationFile: 一个店铺可以有多个认证文件
- Shop 1--* SaleSeries: 一个店铺可以销售多个系列
- Shop 1--* SaleVariant: 一个店铺可以提供多个商品变体

### 商品相关关系
- TechnicalIpAlbum 1--* Series: 一个IP专辑包含多个系列
- Series 1--* Product: 一个系列包含多个商品（变体）
- SaleSeries 1--* SaleVariant: 一个销售系列包含多个销售变体
- SaleVariant *--1 Product: 销售变体引用基础商品
- SaleSeries *--1 Series: 销售系列引用基础系列

### 订单相关关系
- Order 1--* OrderItem: 一个订单包含多个订单项
- OrderItem *--1 Product: 订单项引用商品
- OrderItem *--1 Shop: 订单项属于某个店铺
- Order 1--1 UserAddress: 订单发送到一个收货地址
- CartItem *--1 User: 购物车项属于用户
- CartItem *--1 Shop: 购物车项来自某个店铺
- CartItem *--1 SaleSeries: 购物车项引用销售系列
- CartItem *--1 SaleVariant: 购物车项引用销售变体

### 收藏展示相关关系
- MyDisplayCabinet 1--* CabinetItem: 一个展示柜包含多个展示项
- CabinetItem *--1 Product: 展示项引用商品

### 社交相关关系
- SocialActivity *--1 User: 社交活动由用户创建
- PrivateConversation 1--* PrivateMessage: 一个会话包含多条消息
- PrivateMessage *--1 PrivateConversation: 消息属于某个会话
- PrivateMessage *--1 Product: 消息可能引用商品

### 管理员关系
- PlatformAdmin 1--* Shop: 平台管理员审核多个店铺
- PlatformAdmin 1--* SocialActivity: 平台管理员审核多个社交活动
- ShopAdmin 1--1 Shop: 店铺管理员管理一个店铺

## 如何使用

### 1. 使用在线PlantUML编辑器
- 访问 [PlantText](https://www.planttext.com/) 或 [PlantUML在线编辑器](http://www.plantuml.com/plantuml/)
- 复制任意 `.puml` 文件的内容并粘贴
- 点击生成图表
- 支持导出为PNG、SVG等格式

### 2. 使用VSCode插件（推荐）
- 安装 [PlantUML插件](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
- 在VSCode中打开任意 `.puml` 文件
- 按 `Alt+D` 实时预览图表
- 支持导出多种格式

### 3. 使用命令行工具（批量生成）
- 安装PlantUML
- 运行单个文件: `plantuml TrendyToySequenceDiagrams.puml`
- 批量生成所有文件: `plantuml *.puml`
- 生成的PNG/SVG图片将保存在同一目录

## 业务流程说明

### 完整购物流程
1. 用户登录/注册
2. 浏览商品系列列表
3. 选择商品款式加入购物车
4. 管理购物车（选择、调整数量、删除）
5. 结算时选择收货地址
6. 提交订单（按店铺拆分为多个订单）
7. 选择支付方式完成支付
8. 等待商家发货
9. 确认收货
10. 评价商品
11. （可选）申请售后

### 核心服务职责
- **订单服务**：订单创建、支付、状态管理、售后处理
- **购物车服务**：购物车项增删改查、按店铺分组
- **用户服务**：用户认证、地址管理
- **支付服务**：第三方支付集成（微信、支付宝）
- **商品服务**：商品信息、库存管理

## 技术特点
- 采用分层架构：表现层 -> 服务层 -> 数据层
- 服务之间松耦合，通过接口交互
- 支持按店铺拆分订单
- 完整的订单状态机管理
- 支持多种支付方式集成

## 技术栈

- 后端: Spring Boot + MyBatis Plus
- 数据库: MySQL
- 前端: React + React Native (移动端)

## 注意事项

- 类图中使用 `@TableField(exist = false)` 标记的字段是非持久化字段，仅用于业务逻辑
- 类图使用PlantUML语法，可以根据需要进行调整和扩展
- 实体类的关系通过外键字段体现，如 `userId`, `shopId`, `seriesId` 等
