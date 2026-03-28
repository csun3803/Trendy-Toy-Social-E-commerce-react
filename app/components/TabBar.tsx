import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, router, type Href } from 'expo-router';

// 添加这个辅助函数 - 把 require 转换成图片源
const getImageSource = (icon: any) => {
  return icon;
};

interface TabItem {
  path: Href;
  icon: any;
  activeIcon: any;
  label: string;
}

const TabBar = () => {
  const pathname = usePathname();

  const tabs: TabItem[] = [
    { 
      path: '/', 
      icon: require('../assets/images/tabbar/home1.png'), 
      activeIcon: require('../assets/images/tabbar/home2.png'), 
      label: '首页' 
    },
    { 
      path: '/shop', 
      icon: require('../assets/images/tabbar/shop1.png'), 
      activeIcon: require('../assets/images/tabbar/shop2.png'), 
      label: '商城' 
    },
    { 
      path: '/message', 
      icon: require('../assets/images/tabbar/xx1.png'), 
      activeIcon: require('../assets/images/tabbar/xx2.png'), 
      label: '消息' 
    },
    { 
      path: '/mine', 
      icon: require('../assets/images/tabbar/my1.png'), 
      activeIcon: require('../assets/images/tabbar/my2.png'), 
      label: '我的' 
    }
  ];

  const handleTabClick = (path: Href) => {
    router.push(path);
  };

  const isActive = (path: Href) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path as string);
  };

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tabItem,
            isActive(tab.path) && styles.activeTabItem
          ]}
          onPress={() => handleTabClick(tab.path)}
        >
          <Image
            source={getImageSource(isActive(tab.path) ? tab.activeIcon : tab.icon)}
            style={styles.tabIcon}
            resizeMode="contain"
          />
          <Text style={[
            styles.tabLabel,
            isActive(tab.path) && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: {
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#999',
  },
  activeTabLabel: {
    color: '#8069E1',
  },
});

export default TabBar;
