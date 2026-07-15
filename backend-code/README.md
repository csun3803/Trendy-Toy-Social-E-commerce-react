# 管理端仪表盘后端接口

## 文件说明

- `AdminDashboardDTO.java` - 数据传输对象
- `AdminDashboardController.java` - 控制器

## 部署步骤

### 1. 复制文件

将以下文件复制到后端项目的对应位置：

```
AdminDashboardDTO.java → src/main/java/com/example/trendytoysocialecommercehd/dto/
AdminDashboardController.java → src/main/java/com/example/trendytoysocialecommercehd/controller/
```

### 2. 确认依赖

确保以下依赖已在项目中（通常已存在）：
- Spring Boot
- MyBatis Plus
- Lombok

### 3. 重启后端服务

重启Spring Boot应用

## API接口说明

### 获取管理端仪表盘数据

**请求**

```http
GET /api/admin/dashboard?days=7
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | int | 否 | 获取天数，默认7 |

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalUsers": 12345,
    "todayNewUsers": 128,
    "totalRevenue": 456789,
    "todayRevenue": 12345,
    "totalMerchants": 89,
    "salesTrend": [
      {"date": "05-11", "sales": 8500},
      ...
    ],
    "orderTrend": [
      {"date": "05-11", "orders": 210},
      ...
    ],
    "merchantMetrics": [...],
    "userContentMetrics": [...],
    "pendingTasks": [...],
    "healthStatus": [...]
  }
}
```

## 注意事项

1. 该接口会优先从数据库查询真实数据，数据不足时会使用合理的模拟值
2. 前端已配置好Mock数据作为兜底，即使后端未部署也能正常显示
