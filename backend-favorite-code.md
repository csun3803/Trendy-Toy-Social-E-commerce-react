# 收藏功能后端代码

## 1. 实体类 (Entity)

`src/main/java/com/example/trendytoysocialecommercehd/entity/UserProductFavorite.java`

```java
package com.example.trendytoysocialecommercehd.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user_product_favorite")
public class UserProductFavorite {
    @TableId(value = "favorite_id", type = IdType.INPUT)
    private String favoriteId;

    @TableField("user_id")
    private String userId;

    @TableField("product_id")
    private String productId;

    private String status;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

## 2. Mapper 接口

`src/main/java/com/example/trendytoysocialecommercehd/mapper/UserProductFavoriteMapper.java`

```java
package com.example.trendytoysocialecommercehd.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.trendytoysocialecommercehd.entity.UserProductFavorite;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserProductFavoriteMapper extends BaseMapper<UserProductFavorite> {
}
```

## 3. Service 接口

`src/main/java/com/example/trendytoysocialecommercehd/service/UserProductFavoriteService.java`

```java
package com.example.trendytoysocialecommercehd.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.trendytoysocialecommercehd.entity.UserProductFavorite;

public interface UserProductFavoriteService extends IService<UserProductFavorite> {
    boolean isFavorite(String userId, String productId);
    boolean toggleFavorite(String userId, String productId);
    boolean addFavorite(String userId, String productId);
    boolean removeFavorite(String userId, String productId);
}
```

## 4. Service 实现类

`src/main/java/com/example/trendytoysocialecommercehd/service/impl/UserProductFavoriteServiceImpl.java`

```java
package com.example.trendytoysocialecommercehd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trendytoysocialecommercehd.entity.UserProductFavorite;
import com.example.trendytoysocialecommercehd.mapper.UserProductFavoriteMapper;
import com.example.trendytoysocialecommercehd.service.UserProductFavoriteService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserProductFavoriteServiceImpl extends ServiceImpl<UserProductFavoriteMapper, UserProductFavorite> implements UserProductFavoriteService {

    @Override
    public boolean isFavorite(String userId, String productId) {
        LambdaQueryWrapper<UserProductFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProductFavorite::getUserId, userId)
               .eq(UserProductFavorite::getProductId, productId)
               .eq(UserProductFavorite::getStatus, "active");
        return count(wrapper) > 0;
    }

    @Override
    public boolean toggleFavorite(String userId, String productId) {
        if (isFavorite(userId, productId)) {
            return removeFavorite(userId, productId);
        } else {
            return addFavorite(userId, productId);
        }
    }

    @Override
    public boolean addFavorite(String userId, String productId) {
        LambdaQueryWrapper<UserProductFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProductFavorite::getUserId, userId)
               .eq(UserProductFavorite::getProductId, productId);
        
        UserProductFavorite existing = getOne(wrapper);
        if (existing != null) {
            existing.setStatus("active");
            return updateById(existing);
        }
        
        UserProductFavorite favorite = new UserProductFavorite();
        favorite.setFavoriteId(UUID.randomUUID().toString());
        favorite.setUserId(userId);
        favorite.setProductId(productId);
        favorite.setStatus("active");
        return save(favorite);
    }

    @Override
    public boolean removeFavorite(String userId, String productId) {
        LambdaQueryWrapper<UserProductFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProductFavorite::getUserId, userId)
               .eq(UserProductFavorite::getProductId, productId);
        UserProductFavorite favorite = getOne(wrapper);
        if (favorite != null) {
            favorite.setStatus("inactive");
            return updateById(favorite);
        }
        return false;
    }
}
```

## 5. Controller 类

`src/main/java/com/example/trendytoysocialecommercehd/controller/UserProductFavoriteController.java`

```java
package com.example.trendytoysocialecommercehd.controller;

import com.example.trendytoysocialecommercehd.common.Result;
import com.example.trendytoysocialecommercehd.entity.UserProductFavorite;
import com.example.trendytoysocialecommercehd.service.UserProductFavoriteService;
import com.example.trendytoysocialecommercehd.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/favorite")
public class UserProductFavoriteController {

    @Autowired
    private UserProductFavoriteService favoriteService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/check/{productId}")
    public Result<Map<String, Object>> checkFavorite(
            @PathVariable String productId,
            HttpServletRequest request) {
        try {
            String userId = getUserIdFromRequest(request);
            boolean isFavorite = favoriteService.isFavorite(userId, productId);
            Map<String, Object> result = new HashMap<>();
            result.put("isFavorite", isFavorite);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("检查收藏状态失败: " + e.getMessage());
        }
    }

    @PostMapping("/toggle")
    public Result<Map<String, Object>> toggleFavorite(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        try {
            String userId = getUserIdFromRequest(request);
            String productId = requestBody.get("productId");
            boolean success = favoriteService.toggleFavorite(userId, productId);
            boolean isFavorite = favoriteService.isFavorite(userId, productId);
            Map<String, Object> result = new HashMap<>();
            result.put("isFavorite", isFavorite);
            return Result.success(isFavorite ? "收藏成功" : "取消收藏成功", result);
        } catch (Exception e) {
            return Result.error("操作失败: " + e.getMessage());
        }
    }

    @PostMapping
    public Result<Void> addFavorite(
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        try {
            String userId = getUserIdFromRequest(request);
            String productId = requestBody.get("productId");
            boolean success = favoriteService.addFavorite(userId, productId);
            if (success) {
                return Result.success("收藏成功", null);
            }
            return Result.error("收藏失败");
        } catch (Exception e) {
            return Result.error("收藏失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{productId}")
    public Result<Void> removeFavorite(
            @PathVariable String productId,
            HttpServletRequest request) {
        try {
            String userId = getUserIdFromRequest(request);
            boolean success = favoriteService.removeFavorite(userId, productId);
            if (success) {
                return Result.success("取消收藏成功", null);
            }
            return Result.error("取消收藏失败");
        } catch (Exception e) {
            return Result.error("取消收藏失败: " + e.getMessage());
        }
    }

    private String getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        throw new RuntimeException("未登录");
    }
}
```

## 6. 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS user_product_favorite (
    favorite_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_product (user_id, product_id),
    INDEX idx_user_id (user_id)
);
```
