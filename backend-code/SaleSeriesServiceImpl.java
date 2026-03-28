package com.example.trendytoysocialecommercehd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trendytoysocialecommercehd.entity.SaleSeries;
import com.example.trendytoysocialecommercehd.mapper.SaleSeriesMapper;
import com.example.trendytoysocialecommercehd.service.SaleSeriesService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SaleSeriesServiceImpl extends ServiceImpl<SaleSeriesMapper, SaleSeries> implements SaleSeriesService {

    @Override
    public List<SaleSeries> getSaleSeriesByShopId(String shopId) {
        LambdaQueryWrapper<SaleSeries> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SaleSeries::getShopId, shopId);
        wrapper.orderByDesc(SaleSeries::getCreatedAt);
        return this.list(wrapper);
    }
}
