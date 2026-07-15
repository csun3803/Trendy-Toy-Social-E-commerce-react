# 用户管理后端代码实现

## 重要说明
根据项目现有代码结构，用户管理接口应该直接添加到 `AdminManageController` 中，与其他管理接口保持一致。

## 1. 更新 UserService 接口
文件路径：`src/main/java/com/example/trendytoysocialecommercehd/service/UserService.java`

```java
package com.example.trendytoysocialecommercehd.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.trendytoysocialecommercehd.dto.LoginDTO;
import com.example.trendytoysocialecommercehd.dto.RegisterDTO;
import com.example.trendytoysocialecommercehd.entity.User;

public interface UserService {
    User login(LoginDTO loginDTO);
    User register(RegisterDTO registerDTO);
    User getUserById(String userId);
    User updateAvatar(String userId, String avatarUrl);
    User getUserWithStats(String userId);
    void updateUserStats(String userId);
    
    // 管理员用户管理功能
    Page<User> getUserList(int page, int size, String accountStatus, String keyword);
    User updateUser(String userId, User user);
    void deleteUser(String userId);
    User updateUserStatus(String userId, String accountStatus);
}
```

## 2. 更新 UserServiceImpl 实现类
文件路径：`src/main/java/com/example/trendytoysocialecommercehd/service/impl/UserServiceImpl.java`

```java
package com.example.trendytoysocialecommercehd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.trendytoysocialecommercehd.dto.LoginDTO;
import com.example.trendytoysocialecommercehd.dto.RegisterDTO;
import com.example.trendytoysocialecommercehd.entity.User;
import com.example.trendytoysocialecommercehd.mapper.FollowRelationshipMapper;
import com.example.trendytoysocialecommercehd.mapper.SocialActivityMapper;
import com.example.trendytoysocialecommercehd.mapper.UserMapper;
import com.example.trendytoysocialecommercehd.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private FollowRelationshipMapper followRelationshipMapper;

    @Autowired
    private SocialActivityMapper socialActivityMapper;

    @Override
    public User login(LoginDTO loginDTO) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", loginDTO.getUsernameOrPhone())
                .or()
                .eq("phone_number", loginDTO.getUsernameOrPhone());
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("用户名或密码错误");
        }

        return user;
    }

    @Override
    public User register(RegisterDTO registerDTO) {
        // 检查用户名是否已存在
        QueryWrapper<User> usernameWrapper = new QueryWrapper<>();
        usernameWrapper.eq("username", registerDTO.getUsername());
        if (userMapper.selectOne(usernameWrapper) != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查手机号是否已存在
        QueryWrapper<User> phoneWrapper = new QueryWrapper<>();
        phoneWrapper.eq("phone_number", registerDTO.getPhoneNumber());
        if (userMapper.selectOne(phoneWrapper) != null) {
            throw new RuntimeException("手机号已存在");
        }

        // 创建新用户
        User user = new User();
        user.setUserId(UUID.randomUUID().toString());
        user.setUsername(registerDTO.getUsername());
        user.setPasswordHash(passwordEncoder.encode(registerDTO.getPassword()));
        user.setPhoneNumber(registerDTO.getPhoneNumber());
        user.setAccountLevel(1);
        user.setAccountStatus("active");
        user.setPostCount(0);
        user.setFollowingCount(0);
        user.setFollowerCount(0);

        userMapper.insert(user);
        return user;
    }

    @Override
    public User getUserById(String userId) {
        return userMapper.selectById(userId);
    }

    @Override
    public User updateAvatar(String userId, String avatarUrl) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        user.setAvatarUrl(avatarUrl);
        userMapper.updateById(user);
        return user;
    }

    @Override
    public User getUserWithStats(String userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            updateUserStats(userId);
            user = userMapper.selectById(userId);
        }
        return user;
    }

    @Override
    public void updateUserStats(String userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            Long postCountLong = socialActivityMapper.selectCount(
                    new QueryWrapper<com.example.trendytoysocialecommercehd.entity.SocialActivity>()
                            .eq("user_id", userId)
            );
            int postCount = postCountLong != null ? postCountLong.intValue() : 0;
            int followingCount = followRelationshipMapper.countFollowing(userId);
            int followerCount = followRelationshipMapper.countFollower(userId);

            user.setPostCount(postCount);
            user.setFollowingCount(followingCount);
            user.setFollowerCount(followerCount);
            userMapper.updateById(user);
        }
    }

    @Override
    public Page<User> getUserList(int page, int size, String accountStatus, String keyword) {
        Page<User> pageParam = new Page<>(page, size);
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        
        if (StringUtils.hasText(accountStatus)) {
            wrapper.eq("account_status", accountStatus);
        }
        
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like("username", keyword)
                .or()
                .like("phone_number", keyword)
                .or()
                .like("email", keyword)
            );
        }
        
        wrapper.orderByDesc("register_time");
        return userMapper.selectPage(pageParam, wrapper);
    }

    @Override
    public User updateUser(String userId, User user) {
        User existingUser = userMapper.selectById(userId);
        if (existingUser == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 只更新允许修改的字段
        if (user.getUsername() != null) existingUser.setUsername(user.getUsername());
        if (user.getPhoneNumber() != null) existingUser.setPhoneNumber(user.getPhoneNumber());
        if (user.getEmail() != null) existingUser.setEmail(user.getEmail());
        if (user.getGender() != null) existingUser.setGender(user.getGender());
        if (user.getBirthDate() != null) existingUser.setBirthDate(user.getBirthDate());
        if (user.getLocation() != null) existingUser.setLocation(user.getLocation());
        if (user.getBio() != null) existingUser.setBio(user.getBio());
        if (user.getAccountStatus() != null) existingUser.setAccountStatus(user.getAccountStatus());
        if (user.getAccountLevel() != null) existingUser.setAccountLevel(user.getAccountLevel());
        if (user.getMembershipType() != null) existingUser.setMembershipType(user.getMembershipType());
        
        userMapper.updateById(existingUser);
        return existingUser;
    }

    @Override
    public void deleteUser(String userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        userMapper.deleteById(userId);
    }

    @Override
    public User updateUserStatus(String userId, String accountStatus) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        user.setAccountStatus(accountStatus);
        userMapper.updateById(user);
        return user;
    }

}
```

## 3. 在 AdminManageController 中添加用户管理接口
文件路径：`src/main/java/com/example/trendytoysocialecommercehd/controller/AdminManageController.java`

在文件末尾的 `}` 之前添加以下代码：

```java
    // ==================== 用户管理接口 ====================

    @Autowired
    private UserService userService;

    @GetMapping("/user/list")
    public Result<?> getUserList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(required = false) String keyword) {
        try {
            Page<User> userPage = userService.getUserList(page, size, accountStatus, keyword);
            return Result.success(userPage);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取用户列表失败");
        }
    }

    @GetMapping("/user/{userId}")
    public Result<?> getUserDetail(@PathVariable String userId) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }
            return Result.success(user);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取用户详情失败");
        }
    }

    @PutMapping("/user/{userId}")
    public Result<?> updateUser(@PathVariable String userId, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(userId, user);
            return Result.success(updatedUser);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("更新用户失败");
        }
    }

    @DeleteMapping("/user/{userId}")
    public Result<?> deleteUser(@PathVariable String userId) {
        try {
            userService.deleteUser(userId);
            return Result.success("删除成功");
        } catch (RuntimeException e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("删除用户失败");
        }
    }

    @PutMapping("/user/{userId}/status")
    public Result<?> updateUserStatus(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        try {
            String accountStatus = request.get("accountStatus");
            User user = userService.updateUserStatus(userId, accountStatus);
            return Result.success(user);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("更新用户状态失败");
        }
    }
```

同时，需要在文件顶部添加 User 的 import：
```java
import com.example.trendytoysocialecommercehd.entity.User;
import com.example.trendytoysocialecommercehd.service.UserService;
```

