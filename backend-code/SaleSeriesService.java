package com.example.trendytoysocialecommercehd.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.trendytoysocialecommercehd.entity.SaleSeries;

import java.util.List;

public interface SaleSeriesService extends IService<SaleSeries> {
    List<SaleSeries> getSaleSeriesByShopId(String shopId);
}
