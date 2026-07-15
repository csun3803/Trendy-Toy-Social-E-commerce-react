import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { checkAndRefreshToken } from '@/utils/jwtHelper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BTN_SIZE = 58;

// AI发现浮动入口 - 可拖动
function AiFloatMenu() {
  const [scaleAnim] = useState(new Animated.Value(1));
  // 用ref存储位置，避免闭包问题
  const positionRef = useRef({ x: SCREEN_WIDTH - BTN_SIZE - 16, y: SCREEN_HEIGHT - 100 - BTN_SIZE });
  const pan = useRef(new Animated.ValueXY(positionRef.current)).current;
  const isDragging = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  const handlePress = () => {
    if (isDragging.current) {
      isDragging.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      router.push('/ai-discover' as any);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dx !== 0 || gestureState.dy !== 0,
      onPanResponderGrant: () => {
        isDragging.current = false;
        startOffset.current = { x: positionRef.current.x, y: positionRef.current.y };
        pan.setOffset(positionRef.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const newX = (pan.x as any).__getValue ? (pan.x as any).__getValue() : positionRef.current.x;
        const newY = (pan.y as any).__getValue ? (pan.y as any).__getValue() : positionRef.current.y;

        // 限制在屏幕范围内
        const clampedX = Math.max(0, Math.min(newX, SCREEN_WIDTH - BTN_SIZE));
        const clampedY = Math.max(0, Math.min(newY, SCREEN_HEIGHT - BTN_SIZE));

        // 判断是否为拖动（移动超过5像素）
        if (Math.abs(clampedX - startOffset.current.x) > 5 || Math.abs(clampedY - startOffset.current.y) > 5) {
          isDragging.current = true;
        }

        // 吸附到左侧或右侧
        const snapX = clampedX < SCREEN_WIDTH / 2 ? 8 : SCREEN_WIDTH - BTN_SIZE - 8;
        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
        }).start();

        positionRef.current = { x: snapX, y: clampedY };
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.floatBtn, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
      {...panResponder.panHandlers}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={styles.mainBtnIcon}>✨</Text>
          <Text style={styles.mainBtnLabel}>AI</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkAndRefreshToken(); // 检查token是否过期
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, position: 'relative' }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shop/[id]" />
          <Stack.Screen name="shop-home/[id]" />
          <Stack.Screen name="series/[id]" />
          <Stack.Screen name="tujian" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="merchant-register" />
          <Stack.Screen name="merchant-login" />
          <Stack.Screen name="merchant-apply" />
          <Stack.Screen name="ai-recommend" />
          <Stack.Screen name="ai-discover" />
          <Stack.Screen name="ai-customer-service" />
          <Stack.Screen name="blind-box/index" />
          <Stack.Screen name="blind-box/[id]" />
        </Stack>
        <AiFloatMenu />
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  floatBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  mainBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#8069E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8069E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  mainBtnIcon: {
    fontSize: 20,
  },
  mainBtnLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
});