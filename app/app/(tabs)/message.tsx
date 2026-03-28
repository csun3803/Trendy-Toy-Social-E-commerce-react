import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';

const Message = () => {
  // 导航到设置页面
  const goToSettings = () => {
    // 这里可以添加导航逻辑
    console.log('跳转到设置页面');
  };

  // 导航到搜索页面
  const goToSearch = () => {
    // 这里可以添加导航逻辑
    console.log('跳转到搜索页面');
  };

  // 标记所有消息为已读
  const markAllAsRead = () => {
    // 这里可以添加标记已读的逻辑
    console.log('标记所有消息为已读');
  };

  // 导航到消息详情页面
  const goToMessageDetail = (user: string) => {
    // 这里可以添加导航逻辑
    console.log(`跳转到与${user}的消息详情`);
  };

  return (
    <View style={styles.messagePage}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToSearch}>
          <Svg width={20} height={20} viewBox="0 0 1026 1024">
            <Path 
              d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
              fill="#2c2c2c" 
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息</Text>
        <TouchableOpacity onPress={goToSettings}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
            <Path 
              d="M543.711 80.574l325.712 188.05a64 64 0 0 1 32 55.426v376.099a64 64 0 0 1-32 55.425L543.71 943.624a64 64 0 0 1-64 0L154 755.574a64 64 0 0 1-32-55.425v-376.1a64 64 0 0 1 32-55.425l325.711-188.05a64 64 0 0 1 64 0z m-32 60.044L190 326.358V697.84l321.712 185.74 321.711-185.74V326.36l-321.71-185.74z m0 211.481c88.366 0 160 71.635 160 160 0 88.366-71.634 160-160 160-88.365 0-160-71.634-160-160 0-88.365 71.635-160 160-160z m0 64c-53.019 0-96 42.98-96 96s42.981 96 96 96c53.02 0 96-42.98 96-96s-42.98-96-96-96z" 
              fill="#2c2c2c" 
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 消息分类标签 */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabItem}>
            <View style={[styles.tabIcon, { backgroundColor: '#e8e1fe' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path 
                  d="M663.018667 121.856l18.474666 10.666667A149.354667 149.354667 0 0 1 744.384 320h110.698667a128 128 0 0 1 126.72 146.112l-48.768 341.333333A128 128 0 0 1 806.314667 917.333333H469.333333a128 128 0 0 1-128-128V448c0-35.733333 14.634667-68.053333 38.250667-91.264l108.586667-188.032a128 128 0 0 1 174.848-46.848zM170.666667 915.349333h21.333333a85.333333 85.333333 0 0 0 85.333333-85.333333v-320a85.333333 85.333333 0 0 0-85.333333-85.333333H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333333v320a85.333333 85.333333 0 0 0 85.333334 85.333333z" 
                  fill="#b178fd" 
                />
              </Svg>
            </View>
            <Text style={styles.tabText}>赞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <View style={[styles.tabIcon, { backgroundColor: '#fff1ee' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path 
                  d="M512 85.333333c117.824 0 213.333333 95.509333 213.333333 213.333334s-95.509333 213.333333-213.333333 213.333333-213.333333-95.509333-213.333333-213.333333S394.176 85.333333 512 85.333333z m234.666667 469.333334a170.666667 170.666667 0 1 1 0 341.333333H277.333333a170.666667 170.666667 0 1 1 0-341.333333h469.333334z" 
                  fill="#ff575d" 
                />
              </Svg>
              <View style={styles.badge}>1</View>
            </View>
            <Text style={styles.tabText}>新增关注</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <View style={[styles.tabIcon, { backgroundColor: '#fff1df' }]}>
              <Svg width={40} height={40} viewBox="0 0 1024 1024" fill="none">
                <Path 
                  d="M810.666667 149.333333a128 128 0 0 1 128 128v362.666667a128 128 0 0 1-128 128h-184.896l-92.48 138.709333a25.6 25.6 0 0 1-5.056 5.610667l-2.026667 1.493333a25.6 25.6 0 0 1-33.834667-4.864l-1.664-2.24L398.229333 768H213.333333a128 128 0 0 1-128-128V277.333333a128 128 0 0 1 128-128h597.333334zM341.333333 426.666667h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z m192 0h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z m192 0h-42.666666a21.333333 21.333333 0 0 0-21.333334 21.333333v42.666667a21.333333 21.333333 0 0 0 21.333334 21.333333h42.666666a21.333333 21.333333 0 0 0 21.333334-21.333333v-42.666667a21.333333 21.333333 0 0 0-21.333334-21.333333z" 
                  fill="#ffc500" 
                />
              </Svg>
            </View>
            <Text style={styles.tabText}>评论互动</Text>
          </TouchableOpacity>
        </View>

        {/* 一键已读 */}
        <TouchableOpacity style={styles.readAllButton} onPress={markAllAsRead}>
          <Text style={styles.readAllText}>一键已读</Text>
        </TouchableOpacity>

        {/* 消息列表 */}
        <View style={styles.messageList}>
          {/* 消息项 1 */}
          <TouchableOpacity style={styles.messageItem} onPress={() => goToMessageDetail('Lucky')}>
            <Image 
              source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square' }} 
              style={styles.avatar} 
            />
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.userName}>Lucky</Text>
                <Text style={styles.messageTime}>5小时前</Text>
              </View>
              <Text style={styles.messageText}>你好</Text>
            </View>
          </TouchableOpacity>

          {/* 消息项 2 */}
          <TouchableOpacity style={styles.messageItem} onPress={() => goToMessageDetail('小远')}>
            <Image 
              source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20puppy%20avatar%20with%20cute%20expression&image_size=square' }} 
              style={styles.avatar} 
            />
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.userName}>小远</Text>
                <Text style={styles.messageTime}>2天前</Text>
              </View>
              <Text style={styles.messageText}>哈喽</Text>
            </View>
            <View style={styles.badge}>1</View>
          </TouchableOpacity>

          {/* 消息项 3 */}
          <TouchableOpacity style={styles.messageItem} onPress={() => goToMessageDetail('社区管理员')}>
            <Image 
              source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20community%20manager%20avatar%20with%20red%20background&image_size=square' }} 
              style={styles.avatar} 
            />
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.userName}>社区管理员</Text>
                <Text style={styles.messageTime}>一周前</Text>
              </View>
              <Text style={styles.messageText}>[系统]0元免费抽选！试一试今日手气→</Text>
            </View>
            <View style={styles.badge}>2</View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 客服机器人 */}
      <TouchableOpacity style={styles.robotButton}>
        <Svg width={40} height={40} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" fill="#8069E1" />
          <Path 
            d="M12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2H8v-2z" 
            fill="white" 
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  messagePage: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  readAllButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  readAllText: {
    fontSize: 14,
    color: '#8069E1',
    textAlign: 'right',
  },
  messageList: {
    backgroundColor: '#fff',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#FF4757',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotButton: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8069E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Message;