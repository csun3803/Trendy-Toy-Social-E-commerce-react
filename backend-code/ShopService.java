package com.example.trendytoysocialecommercehd.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trendytoysocialecommercehd.entity.Shop;
import com.example.trendytoysocialecommercehd.mapper.ShopMapper;
import org.springframework.stereotype.Service;

@Service
public class ShopService extends ServiceImpl<ShopMapper, Shop> {

    public Page<Shop> getShopList(int page, int size, String shopStatus, String auditStatus) {
        Page<Shop> pageObj = new Page<>(page, size);
        LambdaQueryWrapper<Shop> wrapper = new LambdaQueryWrapper<>();

        if (shopStatus != null && !shopStatus.isEmpty()) {
            wrapper.eq(Shop::getShopStatus, shopStatus);
        }
        if (auditStatus != null && !auditStatus.isEmpty()) {
            wrapper.eq(Shop::getAuditStatus, auditStatus);
        }
        wrapper.orderByDesc(Shop::getShopId);

        return this.page(pageObj, wrapper);
    }

    public Shop getShopById(String shopId) {
        return this.getById(shopId);
    }

    public void createShop(Shop shop) {
        this.save(shop);
    }

    public void updateShop(String shopId, Shop shop) {
        Shop existing = this.getById(shopId);
        if (existing == null) {
            throw new RuntimeException("商家不存在");
        }
        shop.setShopId(shopId);
        this.updateById(shop);
    }

    public void deleteShop(String shopId) {
        this.removeById(shopId);
    }
}
