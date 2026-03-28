import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { UserInfo } from '@/types/index';
import { config } from '@/config';

const BASE_URL = config.RESOURCE_BASE_URL;

const Mine = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 加载用户信息
    const loadUserInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          const parsedData = JSON.parse(userData);
          // 确保数据符合UserInfo类型
          const userInfoData: UserInfo = {
            userId: parsedData.userId || '',
            username: parsedData.username || '未登录',
            avatarUrl: parsedData.avatarUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square',
            accountLevel: parsedData.accountLevel || 1,
            postCount: parsedData.postCount || 0,
            followingCount: parsedData.followingCount || 0,
            followerCount: parsedData.followerCount || 0,
            totalOrders: parsedData.totalOrders || 0,
            couponCount: parsedData.couponCount || 0,
            cabinetCount: parsedData.cabinetCount || 0,
          };
          setUserInfo(userInfoData);
        }
      } catch (error) {
        console.error('读取用户信息失败');
      }
    };
    loadUserInfo();
  }, []);

  // 退出登录
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('token');
      setUserInfo(null);
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败');
    }
  };

  // 导航到个人主页
  const goToProfile = () => {
    // 这里可以添加导航逻辑
  };

  // 导航到订单页面
  const goToOrders = (status: string) => {
    router.push(`/order?status=${status}`);
  };

  // 导航到功能页面
  const goToPage = (page: string) => {
    // 这里可以添加导航逻辑
  };

  // 请求相机和图库权限
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要访问相册权限来选择头像');
      return false;
    }
    return true;
  };

  // 选择并上传头像
  const handleAvatarUpload = async () => {
    // 检查登录状态
    if (!userInfo) {
      Alert.alert('提示', '请先登录');
      router.push('/login');
      return;
    }

    // 请求权限
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // 选择图片
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadAvatar(selectedImage.uri);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  };

  // 上传头像到后端
  const uploadAvatar = async (imageUri: string) => {
    try {
      // 获取token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('提示', '登录已过期，请重新登录');
        router.push('/login');
        return;
      }

      // 在web环境下，需要将图片转换为Blob
      let formData: FormData;
      
      if (Platform.OS === 'web') {
        // Web环境：获取图片blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');
      } else {
        // 移动端环境
        formData = new FormData();
        formData.append('avatar', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
      }

      // 上传图片
      const response = await fetch(`${config.API_BASE_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // 读取响应（只能读取一次！）
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!responseText) {
        throw new Error('Empty response');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Failed to parse JSON');
      }
      if (data.code === 200) {
        // 更新本地用户信息
        if (userInfo) {
          const updatedUserInfo: UserInfo = {
            userId: userInfo.userId,
            username: userInfo.username,
            avatarUrl: data.data.avatarUrl,
            accountLevel: userInfo.accountLevel,
            postCount: userInfo.postCount,
            followingCount: userInfo.followingCount,
            followerCount: userInfo.followerCount,
            totalOrders: userInfo.totalOrders || 0,
            couponCount: userInfo.couponCount || 0,
            cabinetCount: userInfo.cabinetCount || 0,
          };
          setUserInfo(updatedUserInfo);
          await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          Alert.alert('成功', '头像上传成功');
        } else {
          const newUserInfo: UserInfo = {
            userId: data.data.user.userId,
            username: data.data.user.username,
            avatarUrl: data.data.avatarUrl,
            accountLevel: data.data.user.accountLevel,
            postCount: data.data.user.postCount || 0,
            followingCount: data.data.user.followingCount || 0,
            followerCount: data.data.user.followerCount || 0,
            totalOrders: data.data.user.totalOrders || 0,
            couponCount: data.data.user.couponCount || 0,
            cabinetCount: data.data.user.cabinetCount || 0,
          };
          setUserInfo(newUserInfo);
          await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));
          Alert.alert('成功', '头像上传成功');
        }
      } else {
        Alert.alert('错误', data.message || '上传失败');
      }
    } catch (error) {
      console.error('上传头像失败');
      Alert.alert('错误', '上传头像失败，请重试');
    }
  };

  return (
    <View style={styles.minePage}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 顶部用户信息 */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarContainer}>
              {(() => {
                let imageUri = userInfo?.avatarUrl 
                  ? `${userInfo.avatarUrl}?t=${Date.now()}` 
                  : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20bunny%20avatar%20with%20yellow%20dress%20and%20flower%20in%20hair&image_size=square';
                if (imageUri && !imageUri.startsWith('http')) {
                  imageUri = `${BASE_URL}${imageUri}`;
                }
                return (
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.avatar} 
                    key={userInfo?.avatarUrl || 'default'}
                  />
                );
              })()}
              {!userInfo?.avatarUrl && (
                <View style={styles.avatarUploadOverlay}>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path 
                      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" 
                      fill="#fff" 
                    />
                    <Path 
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
                      fill="#fff" 
                    />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userDetails}>
              <View style={styles.nameLevel}>
                <Text style={styles.userName}>{userInfo?.username || '未登录'}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv{userInfo?.accountLevel || 1}</Text>
                </View>
              </View>
              <Text style={styles.stats}>
                帖子 {userInfo?.postCount || 0} 关注 {userInfo?.followingCount || 0} 粉丝 {userInfo?.followerCount || 0}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
            <Text style={styles.profileButtonText}>个人主页</Text>
                <Svg width={11} height={11} viewBox="0 0 1024 1024" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
                  <Path
                    d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                    fill="#111111"
                  />
                </Svg>
          </TouchableOpacity>
        </View>

        {/* 功能卡、优惠券、潮玩币 */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardItem}>
            <Text style={styles.cardNumber}>{userInfo?.cabinetCount || 0}</Text>
            <Text style={styles.cardLabel}>功能卡</Text>
          </View>
          <View style={styles.cardItem}>
            <View style={styles.couponWrapper}>
              <Text style={styles.cardNumber}>{userInfo?.couponCount || 0}</Text>
            </View>
            <Text style={styles.cardLabel}>优惠券</Text>
          </View>
          <View style={styles.cardItem}>
            <Text style={styles.cardNumber}>105</Text>
            <Text style={styles.cardLabel}>潮玩币</Text>
          </View>
        </View>

        {/* 我的订单 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>我的订单</Text>
            <TouchableOpacity onPress={() => goToOrders('all')}>
              <Text style={styles.viewAllText}>全部</Text>
                <Svg width={11} height={11} viewBox="0 0 1024 1024" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
                  <Path
                    d="M732.794579 1020.867765a58.608941 58.608941 0 0 1-41.803294-17.558589L247.478814 553.984a60.446118 60.446118 0 0 1 0-84.720941L690.991285 19.847529a58.578824 58.578824 0 0 1 83.606588 0 60.446118 60.446118 0 0 1 0 84.720942L372.979049 511.638588 774.597873 918.588235a60.446118 60.446118 0 0 1 0 84.720941 58.608941 58.608941 0 0 1-41.803294 17.558589z"
                    fill="#666666"
                  />
                </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.orderStatusContainer}>
            <TouchableOpacity style={styles.orderStatusItem} onPress={() => goToOrders('unpaid')}>
              <View style={styles.orderIconWrapper}>
                <Svg width={34} height={34} viewBox="0 0 1037 1024" fill="none">
                  <Path 
                    d="M919.552 696.32c-16.896 0-30.72 13.824-30.72 30.72v111.104c0 16.896-13.824 30.72-30.72 30.72H143.36c-16.896 0-30.72-13.824-30.72-30.72V185.856c0-16.896 13.824-30.72 30.72-30.72h714.752c16.896 0 30.72 13.824 30.72 30.72V312.32c0 16.896 13.824 30.72 30.72 30.72s30.72-13.824 30.72-30.72V185.856c0-50.688-41.472-92.16-92.16-92.16H143.36c-50.688 0-92.16 41.472-92.16 92.16v652.288c0 50.688 41.472 92.16 92.16 92.16h714.752c50.688 0 92.16-41.472 92.16-92.16V727.04c0-16.896-13.824-30.72-30.72-30.72z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M957.44 397.824H486.4c-33.792 0-61.44 27.648-61.44 61.44V599.04c0 33.792 27.648 61.44 61.44 61.44h471.04c33.792 0 61.44-27.648 61.44-61.44V459.264c0-33.792-27.648-61.44-61.44-61.44z m0 201.216H486.4V459.264h471.04V599.04z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M846.772786 548.423744a31.232 31.232 0 1 0 44.167947-44.169489 31.232 31.232 0 1 0-44.167947 44.169489Z" 
                    fill="#2C2C2C" 
                  />
                </Svg>
                
                <View style={styles.badge}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>1</Text>
                </View>
              </View>
              <Text style={styles.orderStatusText}>待付款</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderStatusItem} onPress={() => goToOrders('unshipped')}>
              <Svg width={34} height={34} viewBox="0 0 1024 1024" fill="none">
                <Path 
                  d="M287.462 512.015h-62.003c-17.656 0-31.99-14.332-31.99-31.99 0-17.66 14.334-31.993 31.99-31.993h62.003c17.662 0 31.994 14.333 31.994 31.994 0 17.657-14.332 31.99-31.994 31.99zM882.93 128.111h-741c-42.71 0-77.423 34.679-77.423 77.359V826.434c0 38.299 31.926 69.457 71.15 69.457H889.17c39.252 0 71.15-31.158 71.15-69.457V205.47c-0.03-42.68-34.743-77.358-77.39-77.358z m13.376 77.359v131.07H672.87V192.094h210.06c7.363 0 13.377 6.014 13.377 13.377z m-449.203-13.377h161.783v360.362L538.12 524.24a31.762 31.762 0 0 0-23.993 0.128l-67.02 27.511V192.093h-0.002zM128.491 205.47c0-7.362 6.015-13.376 13.44-13.376h241.185v144.447H128.491V205.47z m760.65 626.436H135.658c-4.222 0-7.167-2.879-7.167-5.473V400.524h254.625v199.121a32.037 32.037 0 0 0 14.177 26.586 32.209 32.209 0 0 0 17.818 5.404c4.095 0 8.254-0.768 12.155-2.399l99.21-40.729 102.566 40.857c9.852 3.963 21.02 2.718 29.817-3.232 8.763-5.984 14.01-15.871 14.01-26.488v-199.12h223.438v425.91c0 2.594-2.944 5.472-7.166 5.472z" 
                  fill="#2C2C2C" 
                />
              </Svg>
                <Text style={styles.orderStatusText}>待发货</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.orderStatusItem} onPress={() => goToOrders('shipping')}>
                <Svg width={34} height={34} viewBox="0 0 1024 1024" fill="none">
                  <Path 
                    d="M841.530179 137.779993 366.132818 137.779993c-49.562812 0-89.855494 40.144302-89.855494 89.499383l0 131.069151-172.015725 99.067296-6.299473 4.189416 0.713244 1.218758 0.029676 0.118704c-3.922333 4.694929-6.062066 10.54824-6.062066 16.58063l0 275.063683c0 16.075117 12.063757 29.1499 26.891464 29.1499 14.857383 0 26.921139-13.103436 26.921139-29.238928L146.455583 494.973208l168.746262-97.373725c11.707646-4.130064 19.552312-15.124466 19.552312-27.336602L334.754157 231.587496c0-19.552312 16.015765-35.479049 35.68678-35.479049l466.750423 0c19.671015 0 35.68678 15.926738 35.68678 35.479049l0 512.034792c0 16.104793 13.104459 29.179576 29.238928 29.179576 16.134469 0 29.238928-13.104459 29.238928-29.238928L931.355997 227.278353C931.355997 177.923272 891.063315 137.779993 841.530179 137.779993z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M741.957369 656.351666c-55.595202 0-102.900601 39.49041-112.973004 94.104261l-204.284663-0.118704c-10.132778-54.555523-57.437154-93.985558-112.973004-93.985558-63.647599 0-115.439172 51.554166-115.439172 114.934682s51.791573 114.934682 115.439172 114.934682c51.67287 0 97.194646-34.558074 111.071701-84.209914l208.117968 0.089028c13.906731 49.592488 59.398832 84.120886 111.042026 84.120886 63.647599 0 115.409496-51.554166 115.409496-114.934682S805.604968 656.351666 741.957369 656.351666zM741.957369 825.514413c-30.070876 0-54.525847-24.336268-54.525847-54.228065 0-29.892821 24.454972-54.228065 54.525847-54.228065s54.525847 24.336268 54.525847 54.228065C796.483216 801.178145 772.028245 825.514413 741.957369 825.514413zM311.726697 825.514413c-30.070876 0-54.525847-24.336268-54.525847-54.228065 0-29.892821 24.454972-54.228065 54.525847-54.228065 30.0412 0 54.496172 24.336268 54.496172 54.228065C366.221846 801.178145 341.766874 825.514413 311.726697 825.514413z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M224.930889 573.151755c0 15.540951 12.687974 28.199249 28.317952 28.199249l109.526509-0.029676c15.421224 0 27.575032-4.605901 36.162618-13.727653 13.638625-14.470573 12.539594-35.003212 12.509918-35.121915l0-85.814458c0-15.540951-12.687974-28.199249-28.317952-28.199249s-28.317952 12.658298-28.317952 28.199249l0.029676 78.2072-101.652168 0C237.589187 544.952506 224.930889 557.64048 224.930889 573.151755z" 
                    fill="#2C2C2C" 
                  />
                </Svg>
                <Text style={styles.orderStatusText}>待收货</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.orderStatusItem} onPress={() => goToOrders('completed')}>
                <Svg width={34} height={34} viewBox="0 0 1024 1024" fill="none">
                  <Path 
                    d="M704.13 576.11c42.74 0 82.92 16.64 113.14 46.86s46.86 70.4 46.86 113.14-16.64 82.92-46.86 113.14-70.4 46.86-113.14 46.86-82.91-16.65-113.13-46.87-46.86-70.4-46.86-113.14 16.64-82.92 46.86-113.14c30.22-30.21 70.39-46.85 113.13-46.85m0-64c-123.71 0-224 100.29-224 224s100.29 224 224 224 224-100.29 224-224-100.29-224-224-224zM641.01 223.5h-362c-17.67 0-32 14.33-32 32s14.33 32 32 32h362c17.67 0 32-14.33 32-32s-14.33-32-32-32zM542.77 400.75H279.01c-17.67 0-32 14.33-32 32s14.33 32 32 32h263.76c17.67 0 32-14.33 32-32s-14.33-32-32-32zM369.76 578h-90.75c-17.67 0-32 14.33-32 32s14.33 32 32 32h90.75c17.67 0 32-14.33 32-32s-14.33-32-32-32z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M411.42 960h-198.4c-61.76 0-112-50.24-112-112V176c0-61.76 50.24-112 112-112H707c61.76 0 112 50.24 112 112v242.21c0 17.67-14.33 32-32 32s-32-14.33-32-32V176c0-26.47-21.53-48-48-48H213.02c-26.47 0-48 21.53-48 48v672c0 26.47 21.53 48 48 48h198.4c17.67 0 32 14.33 32 32s-14.33 32-32 32z" 
                    fill="#2C2C2C" 
                  />
                  <Path 
                    d="M688.56 827.75c-1.53 0-3.06-0.07-4.6-0.21-14.62-1.3-28.07-8.78-36.91-20.5l-47.97-63.65c-10.64-14.11-7.82-34.18 6.3-44.81 14.11-10.64 34.18-7.82 44.81 6.3l39.98 53.05 91.72-84.94c12.97-12.01 33.21-11.23 45.22 1.74 12.01 12.97 11.23 33.21-1.74 45.22L723.91 813.9a52.096 52.096 0 0 1-35.35 13.85z" 
                    fill="#2C2C2C" 
                  />
                </Svg>
                <Text style={styles.orderStatusText}>已完成</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 功能列表 */}
          <View style={styles.functionList}>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('我的盒柜')}>
              <Text style={styles.functionText}>我的盒柜</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('我的愿望单')}>
              <Text style={styles.functionText}>我的愿望单</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('我的动态')}>
              <Text style={styles.functionText}>我的动态</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('我的关注')}>
              <Text style={styles.functionText}>我的关注</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('收货地址')}>
              <Text style={styles.functionText}>收货地址</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionItem} onPress={() => goToPage('兑换中心')}>
              <Text style={styles.functionText}>兑换中心</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
            
            {/* 退出登录 */}
            <TouchableOpacity style={[styles.functionItem, styles.logoutItem]} onPress={handleLogout}>
              <Text style={[styles.functionText, styles.logoutText]}>退出登录</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path 
                  d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" 
                  fill="#666" 
                />
              </Svg>
            </TouchableOpacity>
          </View>

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
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    minePage: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    userInfoContainer: {
      backgroundColor: '#8069E1',
      paddingTop: 40,
      paddingBottom: 20,
      paddingHorizontal: 15,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 15,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    avatarUploadOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    userDetails: {
      flex: 1,
    },
    nameLevel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      marginRight: 10,
    },
    levelBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    levelText: {
      fontSize: 12,
      color: '#fff',
    },
    stats: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    profileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    profileButtonText: {
      fontSize: 14,
      color: '#fff',
      marginRight: 5,
    },
    cardsContainer: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      marginHorizontal: 15,
      marginVertical: 15,
      borderRadius: 10,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardItem: {
      flex: 1,
      alignItems: 'center',
    },
    couponWrapper: {
      position: 'relative',
    },
    cardNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    badge: {
      position: 'absolute',
      top: -10,
      right: -15,
      backgroundColor: '#FF4757',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 30,
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 10,
      color: '#fff',
      fontWeight: 'bold',
    },
    cardLabel: {
      fontSize: 14,
      color: '#2C2C2C',
    },
    sectionContainer: {
      backgroundColor: '#fff',
      marginBottom: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    viewAllText: {
      fontSize: 14,
      color: '#2C2C2C',
      marginRight: 5,
    },
    orderStatusContainer: {
      flexDirection: 'row',
      paddingVertical: 15,
    },
    orderStatusItem: {
      flex: 1,
      alignItems: 'center',
    },
    orderIconWrapper: {
      position: 'relative',
      marginBottom: 8,
    },
    orderStatusText: {
      fontSize: 12,
      color: '#2C2C2C',
    },
    functionList: {
      backgroundColor: '#fff',
      marginTop: 10,
    },
    functionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    functionText: {
      fontSize: 16,
      color: '#333',
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
    logoutItem: {
      marginTop: 10,
    },
    logoutText: {
      color: '#FF4757',
    },
  });

export default Mine;