import { Tabs } from 'expo-router';
import React from 'react';
import TabBar from '@/components/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => <TabBar />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: '商城',
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          title: '消息',
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: '我的',
        }}
      />
    </Tabs>
  );
}
