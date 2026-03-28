package com.example.trendytoysocialecommercehd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trendytoysocialecommercehd.entity.SaleVariant;
import com.example.trendytoysocialecommercehd.mapper.SaleVariantMapper;
import com.example.trendytoysocialecommercehd.service.SaleVariantService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SaleVariantServiceImpl extends ServiceImpl<SaleVariantMapper, SaleVariant> implements SaleVariantService {

    @Override
    public List<SaleVariant> getSaleVariantsBySaleSeriesId(String saleSeriesId) {
        LambdaQueryWrapper<SaleVariant> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SaleVariant::getSaleSeriesId, saleSeriesId);
        wrapper.orderByDesc(SaleVariant::getCreatedAt);
        return this.list(wrapper);
    }
}
