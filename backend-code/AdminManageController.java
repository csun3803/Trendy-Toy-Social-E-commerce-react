package com.example.trendytoysocialecommercehd.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.trendytoysocialecommercehd.common.Result;
import com.example.trendytoysocialecommercehd.entity.PlatformAdmin;
import com.example.trendytoysocialecommercehd.entity.Shop;
import com.example.trendytoysocialecommercehd.entity.ShopAdmin;
import com.example.trendytoysocialecommercehd.service.PlatformAdminService;
import com.example.trendytoysocialecommercehd.service.ShopAdminService;
import com.example.trendytoysocialecommercehd.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminManageController {

    @Autowired
    private ShopAdminService shopAdminService;

    @Autowired
    private PlatformAdminService platformAdminService;

    @Autowired
    private ShopService shopService;

    // ==================== 店铺管理员接口 ====================

    @GetMapping("/merchant/list")
    public Result<?> getMerchantAdminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String auditStatus,
            @RequestParam(required = false) String isActive) {
        Page<ShopAdmin> result = shopAdminService.getShopAdminList(page, size, auditStatus, isActive);
        return Result.success(result);
    }

    @GetMapping("/merchant/{adminId}")
    public Result<?> getMerchantAdminById(@PathVariable String adminId) {
        ShopAdmin admin = shopAdminService.getById(adminId);
        if (admin == null) {
            return Result.error("管理员不存在");
        }
        admin.setPasswordHash(null);
        return Result.success(admin);
    }

    @PostMapping("/merchant")
    public Result<?> createMerchantAdmin(@RequestBody ShopAdmin admin) {
        try {
            shopAdminService.createShopAdmin(admin);
            return Result.success("创建成功");
        } catch (Exception e) {
            return Result.error("创建失败: " + e.getMessage());
        }
    }

    @PutMapping("/merchant/{adminId}")
    public Result<?> updateMerchantAdmin(@PathVariable String adminId, @RequestBody ShopAdmin admin) {
        try {
            shopAdminService.updateShopAdmin(adminId, admin);
            return Result.success("更新成功");
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/merchant/{adminId}")
    public Result<?> deleteMerchantAdmin(@PathVariable String adminId) {
        shopAdminService.deleteShopAdmin(adminId);
        return Result.success("删除成功");
    }

    // ==================== 平台管理员接口 ====================

    @GetMapping("/platform/list")
    public Result<?> getPlatformAdminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String adminLevel,
            @RequestParam(required = false) String accountStatus) {
        Page<PlatformAdmin> result = platformAdminService.getPlatformAdminList(page, size, adminLevel, accountStatus);
        return Result.success(result);
    }

    @GetMapping("/platform/{adminId}")
    public Result<?> getPlatformAdminById(@PathVariable String adminId) {
        PlatformAdmin admin = platformAdminService.getById(adminId);
        if (admin == null) {
            return Result.error("管理员不存在");
        }
        admin.setPasswordHash(null);
        return Result.success(admin);
    }

    @PostMapping("/platform")
    public Result<?> createPlatformAdmin(@RequestBody PlatformAdmin admin) {
        try {
            platformAdminService.createPlatformAdmin(admin);
            return Result.success("创建成功");
        } catch (Exception e) {
            return Result.error("创建失败: " + e.getMessage());
        }
    }

    @PutMapping("/platform/{adminId}")
    public Result<?> updatePlatformAdmin(@PathVariable String adminId, @RequestBody PlatformAdmin admin) {
        try {
            platformAdminService.updatePlatformAdmin(adminId, admin);
            return Result.success("更新成功");
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/platform/{adminId}")
    public Result<?> deletePlatformAdmin(@PathVariable String adminId) {
        platformAdminService.deletePlatformAdmin(adminId);
        return Result.success("删除成功");
    }

    // ==================== 商家管理接口 ====================

    @GetMapping("/shop/list")
    public Result<?> getShopList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String shopStatus,
            @RequestParam(required = false) String auditStatus) {
        Page<Shop> result = shopService.getShopList(page, size, shopStatus, auditStatus);
        return Result.success(result);
    }

    @GetMapping("/shop/{shopId}")
    public Result<?> getShopById(@PathVariable String shopId) {
        Shop shop = shopService.getShopById(shopId);
        if (shop == null) {
            return Result.error("商家不存在");
        }
        return Result.success(shop);
    }

    @PostMapping("/shop")
    public Result<?> createShop(@RequestBody Shop shop) {
        try {
            shopService.createShop(shop);
            return Result.success("创建成功");
        } catch (Exception e) {
            return Result.error("创建失败: " + e.getMessage());
        }
    }

    @PutMapping("/shop/{shopId}")
    public Result<?> updateShop(@PathVariable String shopId, @RequestBody Shop shop) {
        try {
            shopService.updateShop(shopId, shop);
            return Result.success("更新成功");
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/shop/{shopId}")
    public Result<?> deleteShop(@PathVariable String shopId) {
        shopService.deleteShop(shopId);
        return Result.success("删除成功");
    }
}
