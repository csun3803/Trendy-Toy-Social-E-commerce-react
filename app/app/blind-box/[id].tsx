import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBlindBoxMachineDetail,
  getBlindBoxVariants,
  getBlindBoxSlots,
  getBlindBoxSets,
  pickBlindBox,
  joinBlindBoxQueue,
  leaveBlindBoxQueue,
  getQueueStatus,
} from '../../services/blindBoxService';
import type {
  BlindBoxMachineDetail,
  BlindBoxSlot,
  SaleVariantItem,
  BlindBoxPickResult,
} from '../../types';
import { config } from '../../config';
import { getUserInfo } from '../../services/userService';

const { width: screenWidth } = Dimensions.get('window');
const BASE_URL = config.RESOURCE_BASE_URL;

// ========== 图片解析工具 ==========
const parseImageUrl = (raw: string | null | undefined): string => {
  if (!raw) return '';
  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = String(parsed[0]);
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
      }
    }
  } catch (e) {}
  if (raw.startsWith('http')) return raw;
  return `${BASE_URL}${raw}`;
};

// ========== 图标组件 ==========
const BackIcon = ({ color = '#222' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M732.795 1020.868a58.609 58.609 0 0 1-41.803-17.559L247.479 553.984a60.446 60.446 0 0 1 0-84.721L690.991 19.848a58.579 58.579 0 0 1 83.607 0 60.446 60.446 0 0 1 0 84.721L372.979 511.639l401.619 406.95a60.446 60.446 0 0 1 0 84.72 58.609 58.609 0 0 1-41.803 17.559z" fill={color} />
  </Svg>
);

const ShareIcon = ({ color = '#222' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M739.2 320a96 96 0 1 0-91.952 68.224L407.488 526.848A95.872 95.872 0 0 0 416 576c0 21.248-5.76 41.152-15.808 58.688l244.16 138.368A96 96 0 1 0 736 704c-21.248 0-41.152 5.76-58.688 15.808L448.768 588.544A96 96 0 1 0 384 384a96 96 0 0 0 23.232 2.88l247.68 138.496A96 96 0 0 0 739.2 320z" fill={color} />
  </Svg>
);

const HeadphoneIcon = ({ color = '#222' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M512 128C300.544 128 128 300.544 128 512v192c0 46.08 37.888 83.968 83.968 83.968h22.4V585.088H287.936V864h24.192C358.208 864 384 838.208 384 806.08V585.088h256V806.08C640 838.208 665.792 864 697.92 864h24.192V585.088h53.568V788.032c0 46.08 37.888 83.968 83.968 83.968V512c0-211.456-172.544-384-384-384z" fill={color} />
  </Svg>
);

const ChevronUp = ({ color = '#888' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 1024 1024" fill="none">
    <Path d="M512 256l384 448H128l384-448z" fill={color} />
  </Svg>
);

const ChevronLeft = ({ color = '#888' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M672 192L352 512l320 320" stroke={color} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRight = ({ color = '#888' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 1024 1024" fill="none">
    <Path d="M352 192l320 320-320 320" stroke={color} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ========== 页面头部 ==========
const PageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <View style={detailStyles.header}>
    <TouchableOpacity onPress={onBack} style={detailStyles.headerBtn}>
      <BackIcon />
    </TouchableOpacity>
    <Text style={detailStyles.headerTitle}>{title}</Text>
    <View style={detailStyles.headerRightBtns}>
      <TouchableOpacity style={detailStyles.headerBtn}>
        <HeadphoneIcon />
      </TouchableOpacity>
      <TouchableOpacity style={detailStyles.headerBtn}>
        <ShareIcon />
      </TouchableOpacity>
    </View>
  </View>
);

// ========== 开盒动画组件 ==========
const BoxOpenAnimation = ({ visible, isHidden, variantImage, variantName, onDone }: {
  visible: boolean;
  isHidden: boolean;
  variantImage: string;
  variantName: string;
  onDone: () => void;
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const boxOpacity = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.4)).current;
  const glowRotate = useRef(new Animated.Value(0)).current;
  const stepRef = useRef(0);
  // 动画是否已完成（完成后才允许点击关闭）
  const [animDone, setAnimDone] = useState(false);
  // 点击关闭时的淡出动画
  const [fadeOut] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!visible) {
      stepRef.current = 0;
      setAnimDone(false);
      fadeOut.setValue(1);
      shakeAnim.setValue(0);
      scaleAnim.setValue(0);
      boxOpacity.setValue(1);
      resultOpacity.setValue(0);
      resultScale.setValue(0.4);
      return;
    }
    // 1. 盒子放大出现
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      // 2. 摇晃 3 次（玄学摇盒）
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 130, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 130, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(shakeAnim, { toValue: 0.8, duration: 110, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -0.8, duration: 110, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        // 3. 盒子消失，款式揭晓
        Animated.parallel([
          Animated.timing(boxOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(resultOpacity, { toValue: 1, duration: 400, useNativeDriver: true, delay: 80 }),
          Animated.spring(resultScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        ]).start(() => {
          // 4. 动画完成，保持显示，等待用户点击关闭
          stepRef.current = 4;
          setAnimDone(true);
        });
      });
    });
  }, [visible]);

  // 点击关闭：淡出后回调
  const handlePress = () => {
    if (!animDone) return;
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDone();
    });
  };

  // 隐藏款金光旋转（持续）
  useEffect(() => {
    if (visible && isHidden) {
      const loop = Animated.loop(
        Animated.timing(glowRotate, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, isHidden]);

  if (!visible) return null;

  const shakeInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });
  const glowInterpolate = glowRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[animStyles.overlay, { opacity: fadeOut }]} pointerEvents={animDone ? 'auto' : 'none'}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        disabled={!animDone}
        style={animStyles.touchContainer}
      >
      {/* 隐藏款背景金光 */}
      {isHidden && (
        <Animated.View
          style={[
            animStyles.glowRing,
            { transform: [{ rotate: glowInterpolate }] },
          ]}
        >
          <View style={animStyles.glowInner1} />
          <View style={animStyles.glowInner2} />
          <View style={animStyles.glowInner3} />
        </Animated.View>
      )}

      {/* 盲盒本体 */}
      <Animated.View
        style={[
          animStyles.box,
          {
            opacity: boxOpacity,
            transform: [
              { scale: scaleAnim },
              { rotate: shakeInterpolate },
            ],
          },
        ]}
      >
        <View style={animStyles.boxBody}>
          <View style={animStyles.boxLid} />
          <View style={animStyles.boxRibbon} />
          <View style={animStyles.boxRibbonH} />
          <Text style={animStyles.boxQuestion}>?</Text>
        </View>
        <Text style={animStyles.boxHint}>摇晃中...</Text>
      </Animated.View>

      {/* 揭晓的款式 */}
      <Animated.View
        style={[
          animStyles.resultWrap,
          {
            opacity: resultOpacity,
            transform: [{ scale: resultScale }],
          },
        ]}
      >
        {variantImage ? (
          <Image
            source={{ uri: variantImage }}
            style={animStyles.resultImage}
            contentFit="cover"
          />
        ) : (
          <View style={animStyles.resultImagePlaceholder}>
            <Text style={animStyles.resultImageText}>{variantName?.slice(0, 1) || '?'}</Text>
          </View>
        )}
        <Text style={animStyles.resultLabel}>
          {isHidden ? '✨ 隐藏款 ✨' : '恭喜抽中'}
        </Text>
      </Animated.View>

      {/* 隐藏款彩带粒子 */}
      {isHidden && (
        <View style={animStyles.confettiWrap} pointerEvents="none">
          {CONFETTI_CONFIG.map((c, i) => (
            <View
              key={i}
              style={[
                animStyles.confetti,
                {
                  left: c.left,
                  top: c.top,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                  transform: [{ rotate: c.rotate }],
                },
              ]}
            />
          ))}
        </View>
      )}
      {/* 动画完成后的提示 */}
      {animDone && (
        <View pointerEvents="none" style={animStyles.tapHintWrap}>
          <Text style={animStyles.tapHint}>点击任意位置继续</Text>
        </View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// 彩带粒子配置
const CONFETTI_COLORS = ['#FFD700', '#FF6B9A', '#FFB3C0', '#FFE08C', '#C8A8FF', '#7AE5C8'];
const CONFETTI_CONFIG = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 3.5 + 4) % 96}%`,
  top: `${(i * 7) % 60}%`,
  size: 6 + (i % 3) * 3,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: `${(i * 47) % 360}deg`,
}));

const animStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  touchContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHintWrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxBody: {
    width: 140,
    height: 150,
    backgroundColor: '#FF6B9A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FF6B9A',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  boxLid: {
    position: 'absolute',
    top: -10,
    width: 150,
    height: 22,
    backgroundColor: '#FF4A82',
    borderRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  boxRibbon: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: '100%',
    backgroundColor: '#FFD700',
  },
  boxRibbonH: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#FFD700',
  },
  boxQuestion: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    zIndex: 2,
  },
  boxHint: {
    color: '#fff',
    fontSize: 13,
    marginTop: 12,
    opacity: 0.85,
  },
  resultWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  resultImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#FFB3C0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  resultImageText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
  },
  resultLabel: {
    marginTop: 16,
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 380,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 24,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  glowInner2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 16,
    borderColor: 'rgba(255,107,154,0.25)',
    transform: [{ rotate: '45deg' }],
  },
  glowInner3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  confettiWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
});

// ========== 样式表 ==========
const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: 'rgba(247,244,255,0.92)',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222', flex: 1, textAlign: 'center' },
  headerRightBtns: { flexDirection: 'row' },
  scrollView: { flex: 1 },

  // 主图区域
  heroWrap: {
    marginHorizontal: 14,
    marginTop: 4,
    borderRadius: 20,
    backgroundColor: '#F0EAFF',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  heroBanner: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8DFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroBannerText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  heroBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  // 套盒信息条（居中）
  setInfoBar: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 2,
  },
  setIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B5FB0',
  },
  setDotsText: {
    fontSize: 10,
    color: '#B8A8E8',
    marginTop: 2,
    letterSpacing: 3,
  },
  setStockText: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },

  // 九宫格 + 左右箭头容器
  gridWithArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sideArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 九宫格（支持3x3和3x4，格子更小，间距更小）
  slotGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'flex-start',
  },
  slotItem: {
    width: 60,
    height: 60,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0D6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B5FB0',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  slotItemSold: {
    backgroundColor: '#F5F1FF',
    borderColor: '#E0D6FF',
  },
  slotItemSelected: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF8C8C',
    shadowColor: '#FF8C8C',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  slotNo: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontSize: 9,
    color: '#B8A8E8',
    fontWeight: '600',
    zIndex: 2,
  },
  slotBoxIcon: {
    width: '52%',
    height: '52%',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0FF',
  },
  slotBoxQuestion: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B4A5F4',
  },
  slotSoldCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E0F8',
  },
  slotSoldText: { fontSize: 10, color: '#A99BD8', marginTop: 3 },

  slotSerial: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#999',
    letterSpacing: 1,
    marginTop: 2,
  },

  // 状态条
  queueBar: {
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B4A5F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  queueAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  queueText: { fontSize: 12, color: '#666', flex: 1 },
  queueRight: { fontSize: 12, color: '#FF8C8C', fontWeight: '600' },

  // 选盒状态横幅
  selectStatusBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
  },
  selectStatusText: { fontSize: 14, color: '#666' },

  // 支付确认弹窗
  payConfirmCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 28,
    width: screenWidth - 56,
  },
  payConfirmTitle: { fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 18 },
  payConfirmInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  payConfirmLabel: { fontSize: 14, color: '#888' },
  payConfirmValue: { fontSize: 14, color: '#222', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  payConfirmTip: {
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  payConfirmTipText: { fontSize: 12, color: '#D48806', lineHeight: 18 },
  payConfirmBtn: {
    backgroundColor: '#B4A5F4',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  payConfirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // 收银台弹窗
  cashierCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    width: screenWidth,
    position: 'absolute',
    bottom: 0,
  },
  cashierTitle: { fontSize: 18, fontWeight: '700', color: '#222', textAlign: 'center' },
  cashierAmount: { fontSize: 36, fontWeight: '800', color: '#FF6B9A', textAlign: 'center', marginVertical: 12 },
  cashierHint: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
  payMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
    marginBottom: 10,
  },
  payMethodBtnActive: { borderColor: '#B4A5F4', backgroundColor: '#F5F0FF' },
  payMethodIcon: { fontSize: 22, marginRight: 12 },
  payMethodText: { fontSize: 15, color: '#222', fontWeight: '600', flex: 1 },
  payMethodCheck: { fontSize: 18, color: '#B4A5F4' },
  cashierPayBtn: {
    backgroundColor: '#B4A5F4',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  cashierPayBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cashierCancelText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 12 },

  // 底部按钮
  bottomBar: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: '#F7F4FF',
  },
  primaryBtn: {
    backgroundColor: '#B4A5F4',
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  detailHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#B8AED8',
    marginTop: 12,
  },

  // 详情展开页
  detailCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    borderRadius: 18,
    marginTop: 8,
    padding: 14,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  variantPreviewRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  variantPreviewItem: {
    width: (screenWidth - 28 - 20 - 48) / 5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  variantPreviewBox: {
    width: (screenWidth - 28 - 20 - 48) / 5,
    height: (screenWidth - 28 - 20 - 48) / 5,
    borderRadius: 12,
    backgroundColor: '#F5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  variantPreviewImage: {
    width: '100%',
    height: '100%',
  },
  variantPreviewName: { fontSize: 10, color: '#555', textAlign: 'center' },

  probabilityBox: {
    backgroundColor: '#FFF9E5',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  probabilityTitle: { fontSize: 12, color: '#8A6D10', fontWeight: '700', marginBottom: 8 },
  probabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  probabilityKey: { fontSize: 12, color: '#6B5A18' },
  probabilityValue: { fontSize: 12, color: '#222', fontWeight: '600' },
  probabilityFooter: { marginTop: 6, fontSize: 11, color: '#A48738', lineHeight: 16 },

  productDetailHero: {
    height: 280,
    borderRadius: 14,
    backgroundColor: '#FFE8EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productDetailHeroImage: {
    width: '100%',
    height: '100%',
  },
  productDetailHeroOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  productDetailHeroTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  productDetailHeroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
  },

  allMembersTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B9A',
    marginVertical: 14,
  },

  showcaseScroll: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  showcaseCard: {
    width: (screenWidth - 28 - 30) / 2,
    marginHorizontal: 6,
    backgroundColor: '#FFF7FA',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  showcaseEmojiWrap: {
    width: (screenWidth - 28 - 30) / 2 - 20,
    height: (screenWidth - 28 - 30) / 2 - 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F1FF',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  showcaseName: { fontSize: 13, color: '#222', fontWeight: '600' },
  showcaseMeta: { fontSize: 11, color: '#999', marginTop: 2 },

  // 倒计时页
  timerBadge: {
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#B4A5F4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  countdownBox: {
    marginHorizontal: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  countdownImage: {
    width: 180,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFE8EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  countdownImageUri: {
    width: '100%',
    height: '100%',
  },
  countdownQuestion: { fontSize: 80, fontWeight: '900', color: '#FF6B9A' },
  countdownSerial: { fontSize: 12, color: '#999', marginTop: 6, letterSpacing: 1 },
  countdownTitleSmall: { fontSize: 14, color: '#222', fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },

  variantSmallSection: {
    marginHorizontal: 14,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  variantSmallTitle: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 10 },
  variantSmallRow: { flexDirection: 'row', justifyContent: 'space-around' },
  variantSmallItem: { alignItems: 'center' },
  variantSmallBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  variantSmallImage: {
    width: '100%',
    height: '100%',
  },
  variantSmallName: { fontSize: 10, color: '#333', textAlign: 'center' },

  buyBtn: {
    marginHorizontal: 14,
    marginTop: 16,
    backgroundColor: '#B4A5F4',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#B4A5F4',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buySubText: {
    fontSize: 11,
    color: '#B8AED8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  // 抽中结果弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  resultCard: {
    width: screenWidth - 28,
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
  },
  resultCongrats: { fontSize: 14, color: '#888', marginBottom: 6 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#FF6B9A', marginBottom: 4, textAlign: 'center' },
  resultHiddenBadge: {
    backgroundColor: '#FF6B9A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  resultHiddenBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  resultImage: {
    width: 170,
    height: 170,
    borderRadius: 24,
    backgroundColor: '#FFE8EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#FF6B9A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    overflow: 'hidden',
  },
  resultImageUri: {
    width: '100%',
    height: '100%',
  },
  resultRowBtns: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 14,
  },
  resultBtnReturn: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#E8DFFF',
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultBtnReturnText: { color: '#6B5FB0', fontSize: 13, fontWeight: '700' },
  resultBtnPoster: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#FFB3C0',
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultBtnPosterText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resultBtnAgain: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#FF6B9A',
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultBtnAgainText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  drawnScrollWrap: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#FAF6FF',
    borderRadius: 14,
    width: '100%',
  },
  drawnScroll: { flexDirection: 'row' },
  drawnItem: {
    width: 64,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  drawnBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  drawnImage: {
    width: '100%',
    height: '100%',
  },
  drawnName: { fontSize: 10, color: '#555', textAlign: 'center' },

  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#555', fontSize: 16, fontWeight: '700' },

  loadingText: { marginTop: 10, fontSize: 14, color: '#888' },
});

// ========== 主页面 ==========
export default function BlindBoxDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [machine, setMachine] = useState<BlindBoxMachineDetail | null>(null);
  const [variants, setVariants] = useState<SaleVariantItem[]>([]);
  const [slots, setSlots] = useState<BlindBoxSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  // 套盒相关
  const [boxSets, setBoxSets] = useState<any[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentSetId, setCurrentSetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [userId, setUserId] = useState<string>('');
  // 排队状态
  const [queueStatus, setQueueStatus] = useState<'NONE' | 'WAITING' | 'ACTIVE'>('NONE');
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [activeUsername, setActiveUsername] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  // 是否已进入选盒模式（点击立即选盒后）
  const [isSelecting, setIsSelecting] = useState(false);
  // 支付确认弹窗
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  // 收银台
  const [showCashier, setShowCashier] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'WECHAT' | 'ALIPAY'>('WECHAT');
  const queuePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pageMode, setPageMode] = useState<'pick' | 'detail' | 'buy'>('pick');

  // 倒计时
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 抽中结果
  const [pickResult, setPickResult] = useState<BlindBoxPickResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  // 开盒动画
  const [showOpenAnim, setShowOpenAnim] = useState(false);

  const [drawnList, setDrawnList] = useState<BlindBoxPickResult[]>([]);

  useEffect(() => {
    loadUserData();
    initPage();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      AsyncStorage.getItem('userId').then((uid) => {
        if (uid) {
          leaveBlindBoxQueue(id as string, uid).catch(() => {});
        }
      });
    };
  }, [id]);

  const loadUserData = async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      if (uid) setUserId(uid);
    } catch (e) {}
  };

  const initPage = async () => {
    setLoading(true);
    try {
      const res = await getBlindBoxMachineDetail(id as string);
      const data = (res as any).data as BlindBoxMachineDetail | null;
      if (data) {
        setMachine(data);
      } else {
        Alert.alert('错误', '抽盒机不存在', [{ text: '返回', onPress: () => router.back() }]);
        setLoading(false);
        return;
      }

      try {
        const vRes = await getBlindBoxVariants(id as string);
        const vList = (vRes as any).data;
        if (Array.isArray(vList) && vList.length) setVariants(vList);
      } catch (e) {
        console.error('获取款式列表失败', e);
      }

      try {
        // 加载套盒列表（每个套盒含格位信息）
        const setsRes = await getBlindBoxSets(id as string);
        const setsList = (setsRes as any).data;
        console.log('[DEBUG] setsList:', JSON.stringify(setsList?.length), setsList?.[0]?.setId, setsList?.[0]?.slots?.length);
        if (Array.isArray(setsList) && setsList.length) {
          setBoxSets(setsList);
          // 默认选第一个活跃套盒
          const firstActive = setsList.find((s: any) => s.status === 'ACTIVE') || setsList[0];
          setCurrentSetId(firstActive?.setId || '');
          setCurrentSetIndex(setsList.indexOf(firstActive));
          const firstSlots = firstActive?.slots || [];
          console.log('[DEBUG] firstSlots count:', firstSlots.length);
          setSlots(firstSlots);
        } else {
          // 套盒为空，回退到旧接口
          console.log('[DEBUG] setsList empty, fallback to slots API');
          const sRes = await getBlindBoxSlots(id as string);
          const sList = (sRes as any).data;
          if (Array.isArray(sList) && sList.length) setSlots(sList);
        }
      } catch (e) {
        console.error('获取套盒列表失败，回退到旧接口', e);
        // 回退到旧的 slots 接口
        try {
          const sRes = await getBlindBoxSlots(id as string);
          const sList = (sRes as any).data;
          if (Array.isArray(sList) && sList.length) setSlots(sList);
        } catch (e2) {
          console.error('获取选盒状态失败', e2);
        }
      }

      const uid = await AsyncStorage.getItem('userId');
      if (uid) {
        setUserId(uid);
        // 获取当前用户名
        try {
          const info = await getUserInfo(uid);
          if (info?.username) setCurrentUsername(info.username);
        } catch (e) { /* ignore */ }
        try {
          const qRes = await joinBlindBoxQueue(id as string, uid);
          const qData: any = (qRes as any).data || {};
          setQueueStatus(qData.status || 'ACTIVE');
          setQueuePosition(qData.queuePosition || 1);
          setQueueCount(qData.queueCount || 1);
          if (qData.activeUsername) setActiveUsername(qData.activeUsername);
          // 启动轮询：WAITING 状态时每3秒查一次
          if ((qData.status || 'ACTIVE') !== 'ACTIVE') {
            startQueuePolling(id as string, uid);
          }
        } catch (e) {
          console.error('加入排队失败', e);
        }
      }
    } catch (e) {
      console.error('加载抽盒机失败', e);
      Alert.alert('加载失败', '无法连接到服务器，请检查网络后重试', [
        { text: '返回', onPress: () => router.back() },
      ]);
    }
    setLoading(false);
  };

  // 排队轮询
  const startQueuePolling = (machineId: string, uid: string) => {
    if (queuePollRef.current) clearInterval(queuePollRef.current);
    queuePollRef.current = setInterval(async () => {
      try {
        const res = await getQueueStatus(machineId, uid);
        const data: any = (res as any).data || {};
        setQueueStatus(data.status || 'NONE');
        setQueuePosition(data.queuePosition || 0);
        setQueueCount(data.queueCount || 0);
        if (data.activeUsername) setActiveUsername(data.activeUsername);
        if (data.status === 'ACTIVE') {
          // 轮到自己，停止轮询
          if (queuePollRef.current) clearInterval(queuePollRef.current);
          setIsSelecting(true);
        }
      } catch (e) {
        console.error('轮询排队状态失败', e);
      }
    }, 3000);
  };

  // 离开页面时退出排队
  useEffect(() => {
    return () => {
      if (queuePollRef.current) clearInterval(queuePollRef.current);
      // 离开排队
      const cleanup = async () => {
        const uid = userId || await AsyncStorage.getItem('userId');
        if (uid && id) {
          try { await leaveBlindBoxQueue(id as string, uid); } catch (e) { /* ignore */ }
        }
      };
      cleanup();
    };
  }, []);

  // 切换套盒
  const switchSet = (direction: 'prev' | 'next') => {
    if (boxSets.length === 0) return;
    let newIndex = direction === 'prev' ? currentSetIndex - 1 : currentSetIndex + 1;
    if (newIndex < 0 || newIndex >= boxSets.length) return;
    setCurrentSetIndex(newIndex);
    const set = boxSets[newIndex];
    setCurrentSetId(set.setId);
    setSlots(set.slots || []);
    setSelectedSlot(null);
  };

  const handlePickSlot = (slotNo: number) => {
    if (queueStatus === 'WAITING' || !isSelecting) return; // 排队中或未开始选盒不能选
    const slot = slots.find((s) => s.slotNo === slotNo);
    if (!slot || slot.status === 'SOLD') return;
    setSelectedSlot(slotNo);
    setPageMode('buy');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `剩余时间 ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [paying, setPaying] = useState(false);

  const handleBuy = async () => {
    if (!userId) {
      Alert.alert('提示', '请先登录', [{ text: '去登录', onPress: () => router.push('/login') }]);
      return;
    }
    if (!machine) return;
    // 第一步：支付（调 pickBlindBox 完成支付+扣库存+存暂存柜）
    setPaying(true);
    let result: BlindBoxPickResult | null = null;
    try {
      const res = await pickBlindBox({
        machineId: machine.machineId,
        setId: currentSetId || undefined,
        userId,
        slotNo: selectedSlot || undefined,
        addressId: undefined,
        paymentMethod,
      });
      result = (res as any).data as BlindBoxPickResult;
      if (!result) {
        Alert.alert('支付失败', '服务器返回数据异常');
        setPaying(false);
        return;
      }
    } catch (e: any) {
      setPaying(false);
      Alert.alert('支付失败', e?.message || '请稍后重试');
      return;
    }
    setPaying(false);

    // 第二步：开盒动画
    setDrawing(true);
    setShowOpenAnim(true);
    setPickResult(result);
    setDrawnList((prev) => [result!, ...prev].slice(0, 10));
    const soldSlotNo = selectedSlot || result.slotNo;
    setSlots((prev) =>
      prev.map((s) =>
        s.slotNo === soldSlotNo ? { ...s, status: 'SOLD', variantImage: result!.variantImage, variantName: result!.variantName } : s
      )
    );
    // 同步更新 boxSets 中当前套盒的格位和已售数
    setBoxSets((prev) =>
      prev.map((set, i) => {
        if (i !== currentSetIndex) return set;
        return {
          ...set,
          soldCount: (set.soldCount || 0) + 1,
          slots: (set.slots || []).map((s: any) =>
            s.slotNo === soldSlotNo ? { ...s, status: 'SOLD' } : s
          ),
        };
      })
    );
    // 动画的 onDone 会触发显示结果弹窗
    setDrawing(false);
  };

  const handleOpenAnimDone = () => {
    setShowOpenAnim(false);
    if (pickResult) {
      setShowResultModal(true);
    }
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
    setPageMode('pick');
    setSelectedSlot(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleReturnToDraw = () => {
    setShowResultModal(false);
    setPageMode('pick');
    setSelectedSlot(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleGeneratePoster = () => {
    Alert.alert('提示', '分享海报已生成（模拟），感谢您的分享！', [{ text: '好的' }]);
  };

  const serialNo = useMemo(() => {
    // 每个套盒独立编号：套盒序号 + 当前套盒内序号
    const setIdx = currentSetIndex + 1;
    const slotIdx = selectedSlot || 1;
    return `No.${String(setIdx).padStart(2, '0')}${String(slotIdx).padStart(2, '0')}`;
  }, [selectedSlot, pageMode, currentSetIndex]);

  // 派生数据
  const regularVariants = useMemo(
    () => variants.filter((v) => !isHiddenVariant(v)),
    [variants]
  );
  const hiddenVariant = useMemo(
    () => variants.find((v) => isHiddenVariant(v)),
    [variants]
  );
  const coverUrl = useMemo(() => parseImageUrl(machine?.machineCoverImage), [machine]);

  if (loading || !machine) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4FF' }}>
        <ActivityIndicator size="large" color="#B4A5F4" />
        <Text style={detailStyles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const goBack = () => {
    if (pageMode === 'detail' || pageMode === 'buy') {
      setPageMode('pick');
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    router.back();
  };

  // ========== 选盒九宫格页面 ==========
  if (pageMode === 'pick') {
    // 是否有人正在选盒（不是自己）
    const someoneElseSelecting = queueStatus === 'WAITING' || (queueStatus === 'NONE' && !!activeUsername && queueCount > 0);
    // 显示的选盒用户名
    const selectingDisplayName = queueStatus === 'ACTIVE' ? currentUsername : (activeUsername || '其他用户');

    return (
      <View style={detailStyles.container}>
        <PageHeader title="在线抽盒" onBack={goBack} />
        <ScrollView style={detailStyles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={detailStyles.heroWrap}>
            {/* 选盒状态提示 */}
            <View style={detailStyles.selectStatusBanner}>
              {someoneElseSelecting || (queueStatus === 'ACTIVE' && isSelecting) ? (
                <Text style={detailStyles.selectStatusText}>
                  <Text style={{ color: '#FF6B9A', fontWeight: '700' }}>{selectingDisplayName}</Text>
                  {' '}正在选盒
                </Text>
              ) : (
                <Text style={detailStyles.selectStatusText}>
                  <Text style={{ color: '#6B5FB0', fontWeight: '700' }}>{machine.machineName}</Text>
                  {'  '}¥{machine.drawPrice}/抽
                </Text>
              )}
            </View>

            <View style={{ paddingHorizontal: 14, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#222', flex: 1 }} numberOfLines={1}>
                {machine.machineName}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF6B9A', marginLeft: 10 }}>
                ¥{machine.drawPrice}/抽
              </Text>
            </View>

            {/* 套盒信息条 */}
            {boxSets.length > 0 && (
              <View style={detailStyles.setInfoBar}>
                <Text style={detailStyles.setIndexText}>
                  {boxSets[currentSetIndex]?.setName || `第${currentSetIndex + 1}套`}
                </Text>
                <Text style={detailStyles.setDotsText}>
                  {boxSets.map((_, i) => i === currentSetIndex ? '●' : '○').join(' ')}
                </Text>
                <Text style={detailStyles.setStockText}>
                  {boxSets[currentSetIndex]?.soldCount || 0}/{boxSets[currentSetIndex]?.totalSlots || 9} 已售
                </Text>
              </View>
            )}

            {/* 选盒倒计时 */}
            {isSelecting && remainingSeconds > 0 && (
              <View style={{ alignSelf: 'center', marginBottom: 6, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#FFF0F0', borderRadius: 20, borderWidth: 1, borderColor: '#FFB3B3' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF575D' }}>⏱ {formatTime(remainingSeconds)}</Text>
              </View>
            )}

            {/* 九宫格 + 左右箭头 */}
            <View style={detailStyles.gridWithArrows}>
              <TouchableOpacity
                onPress={() => switchSet('prev')}
                disabled={currentSetIndex <= 0}
                style={[detailStyles.sideArrowBtn, currentSetIndex <= 0 && { opacity: 0.2 }]}
              >
                <ChevronLeft color="#6B5FB0" />
              </TouchableOpacity>

              <View style={detailStyles.slotGrid}>
                {slots.map((slot, idx) => {
                  const isSelected = slot.slotNo === selectedSlot;
                  const isSold = slot.status === 'SOLD';
                  const soldImage = slot.status === 'SOLD' ? parseImageUrl(slot.variantImage) : '';
                  const cols = boxSets[currentSetIndex]?.gridCols || 4;
                  const gap = 5;
                  const slotSize = 62;
                  const isLastInRow = (idx + 1) % cols === 0;
                  return (
                    <TouchableOpacity
                      key={slot.slotNo}
                      activeOpacity={0.8}
                      onPress={() => handlePickSlot(slot.slotNo)}
                      style={[
                        detailStyles.slotItem,
                        { width: slotSize, height: slotSize, marginBottom: gap, marginRight: isLastInRow ? 0 : gap },
                        isSold ? detailStyles.slotItemSold : null,
                        isSelected ? detailStyles.slotItemSelected : null,
                        queueStatus === 'WAITING' ? { opacity: 0.4 } : null,
                      ]}
                      disabled={isSold || queueStatus === 'WAITING' || !isSelecting}
                    >
                      <Text style={detailStyles.slotNo}>{slot.slotNo}</Text>
                      {isSold ? (
                        <View style={detailStyles.slotSoldCover}>
                          {soldImage ? (
                            <Image source={{ uri: soldImage }} style={{ width: '80%', height: '80%' }} contentFit="cover" />
                          ) : (
                            <>
                              <Text style={{ fontSize: 18 }}>🎁</Text>
                              <Text style={detailStyles.slotSoldText}>已售出</Text>
                            </>
                          )}
                        </View>
                      ) : (
                        <View style={detailStyles.slotBoxIcon}>
                          <Text style={detailStyles.slotBoxQuestion}>?</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => switchSet('next')}
                disabled={currentSetIndex >= boxSets.length - 1}
                style={[detailStyles.sideArrowBtn, currentSetIndex >= boxSets.length - 1 && { opacity: 0.2 }]}
              >
                <ChevronRight color="#6B5FB0" />
              </TouchableOpacity>
            </View>
            <Text style={detailStyles.slotSerial}>{serialNo}</Text>
          </View>

          {/* 已抽款式 */}
          {drawnList.length > 0 && (
            <View style={[detailStyles.variantSmallSection, { marginBottom: 10 }]}>
              <Text style={detailStyles.variantSmallTitle}>你已抽到 ({drawnList.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
                {drawnList.map((d, i) => {
                  const img = parseImageUrl(d.variantImage);
                  return (
                    <View key={i} style={{ alignItems: 'center', marginHorizontal: 6 }}>
                      <View style={[detailStyles.drawnBox, d.isHidden && { backgroundColor: '#FFE0EC' }]}>
                        {img ? (
                          <Image source={{ uri: img }} style={detailStyles.drawnImage} contentFit="cover" />
                        ) : (
                          <Text style={{ fontSize: 22 }}>🎁</Text>
                        )}
                      </View>
                      <Text style={[detailStyles.drawnName, d.isHidden && { color: '#FF6B9A', fontWeight: '700' }]} numberOfLines={1}>
                        {(d.variantName || '').slice(0, 4)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 商品详情（下滑可见） */}
          <View style={detailStyles.variantSmallSection}>
            <Text style={detailStyles.variantSmallTitle}>
              {regularVariants.length}款普通{hiddenVariant ? ` + 1款隐藏` : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {regularVariants.map((v) => {
                  const img = parseImageUrl(v.customImages);
                  return (
                    <View key={v.saleVariantId} style={{ alignItems: 'center', marginHorizontal: 6 }}>
                      <View style={detailStyles.variantSmallBox}>
                        {img ? (
                          <Image source={{ uri: img }} style={detailStyles.variantSmallImage} contentFit="cover" />
                        ) : (
                          <Text style={{ fontSize: 18 }}>?</Text>
                        )}
                      </View>
                      <Text style={detailStyles.variantSmallName} numberOfLines={1}>
                        {getVariantShortName(v).slice(0, 4)}
                      </Text>
                    </View>
                  );
                })}
                {hiddenVariant && (
                  <View style={{ alignItems: 'center', marginHorizontal: 6 }}>
                    <View style={[detailStyles.variantSmallBox, { backgroundColor: '#FFE0EC', borderWidth: 1.5, borderColor: '#FFB3C0' }]}>
                      <Text style={{ fontSize: 18 }}>★</Text>
                    </View>
                    <Text style={[detailStyles.variantSmallName, { color: '#FF6B9A', fontWeight: '700' }]}>隐藏</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* 底部按钮 */}
          <View style={detailStyles.bottomBar}>
            {queueStatus === 'WAITING' ? (
              <TouchableOpacity style={[detailStyles.primaryBtn, { backgroundColor: '#ccc' }]} activeOpacity={0.85} disabled>
                <Text style={detailStyles.primaryBtnText}>排队选盒 (第{queuePosition}位)</Text>
              </TouchableOpacity>
            ) : !isSelecting ? (
              <TouchableOpacity
                style={detailStyles.primaryBtn}
                onPress={() => {
                  setIsSelecting(true);
                  setRemainingSeconds(200);
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  intervalRef.current = setInterval(() => {
                    setRemainingSeconds((s) => {
                      if (s <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setIsSelecting(false);
                        return 0;
                      }
                      return s - 1;
                    });
                  }, 1000);
                }}
                activeOpacity={0.85}
              >
                <Text style={detailStyles.primaryBtnText}>立即选盒</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[detailStyles.primaryBtn, { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#B4A5F4' }]}
                  onPress={() => {
                    Alert.alert('一次抽多盒', '请依次点击九宫格中的盒子进行选择', [{ text: '好的' }]);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[detailStyles.primaryBtnText, { color: '#6B5FB0' }]}>一次抽多盒</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.primaryBtn, { flex: 1, backgroundColor: '#5B4BA2' }]}
                  onPress={() => {
                    const available = slots.filter((s) => s.status !== 'SOLD');
                    if (available.length === 0) {
                      Alert.alert('提示', '当前套盒已全部售完');
                      return;
                    }
                    const random = available[Math.floor(Math.random() * available.length)];
                    handlePickSlot(random.slotNo);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={detailStyles.primaryBtnText}>随机选1盒</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 开盒动画 */}
        <BoxOpenAnimation
          visible={showOpenAnim}
          isHidden={!!pickResult?.isHidden}
          variantImage={pickResult ? parseImageUrl(pickResult.variantImage) : ''}
          variantName={pickResult?.variantName || ''}
          onDone={handleOpenAnimDone}
        />
      </View>
    );
  }

  // ========== 详情展开页面 ==========
  if (pageMode === 'detail') {
    return (
      <View style={detailStyles.container}>
        <PageHeader title="在线抽盒" onBack={goBack} />
        <ScrollView style={detailStyles.scrollView} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 10 }} onPress={() => setPageMode('pick')}>
            <ChevronUp color="#888" />
            <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>点击收起详情</Text>
          </TouchableOpacity>

          <View style={detailStyles.detailCard}>
            <Text style={detailStyles.detailSectionTitle}>
              全部款式 ({variants.length}款)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={detailStyles.variantPreviewRow}>
                {variants.map((v) => {
                  const img = parseImageUrl(v.customImages);
                  const isHidden = isHiddenVariant(v);
                  return (
                    <View key={v.saleVariantId} style={detailStyles.variantPreviewItem}>
                      <View style={[detailStyles.variantPreviewBox, isHidden && { backgroundColor: '#FFE0EC', borderWidth: 1.5, borderColor: '#FFB3C0' }]}>
                        {img ? (
                          <Image source={{ uri: img }} style={detailStyles.variantPreviewImage} contentFit="cover" />
                        ) : (
                          <Text style={{ fontSize: 18 }}>{isHidden ? '★' : '?'}</Text>
                        )}
                      </View>
                      <Text style={[detailStyles.variantPreviewName, isHidden && { color: '#FF6B9A', fontWeight: '700' }]} numberOfLines={1}>
                        {getVariantShortName(v).slice(0, 4)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={[detailStyles.detailSectionTitle, { marginTop: 18 }]}>款式概率</Text>
            <View style={detailStyles.probabilityBox}>
              <Text style={detailStyles.probabilityTitle}>（由卖家设置）</Text>
              <View style={detailStyles.probabilityRow}>
                <Text style={detailStyles.probabilityKey}>隐藏款</Text>
                <Text style={detailStyles.probabilityValue}>1 / {machine.guaranteeDraws || 144}</Text>
              </View>
              <View style={detailStyles.probabilityRow}>
                <Text style={detailStyles.probabilityKey}>普通款</Text>
                <Text style={detailStyles.probabilityValue}>{machine.regularProbability || `${regularVariants.length}款轮流`}</Text>
              </View>
              <Text style={detailStyles.probabilityFooter}>
                平台兜底：连续{machine.guaranteeDraws || 144}抽无隐藏款 → 赠送一个隐藏款
              </Text>
            </View>
          </View>

          <View style={detailStyles.detailCard}>
            <Text style={detailStyles.detailSectionTitle}>商品详情</Text>
            <View style={detailStyles.productDetailHero}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={detailStyles.productDetailHeroImage} contentFit="cover" />
              ) : null}
              <View style={detailStyles.productDetailHeroOverlay}>
                <Text style={detailStyles.productDetailHeroTitle} numberOfLines={1}>{machine.machineName}</Text>
                <Text style={detailStyles.productDetailHeroSub} numberOfLines={1}>
                  {machine.saleSeriesName || ''} · {machine.shopName || ''}
                </Text>
              </View>
            </View>
            <Text style={detailStyles.allMembersTitle}>
              ♡ ALL MEMBERS 全款展示 ({regularVariants.length}+{hiddenVariant ? 1 : 0}) ♡
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              <View style={detailStyles.showcaseScroll}>
                {regularVariants.map((v) => {
                  const img = parseImageUrl(v.customImages);
                  return (
                    <View key={v.saleVariantId} style={detailStyles.showcaseCard}>
                      <View style={detailStyles.showcaseEmojiWrap}>
                        {img ? (
                          <Image source={{ uri: img }} style={detailStyles.showcaseImage} contentFit="cover" />
                        ) : (
                          <Text style={{ fontSize: 40 }}>?</Text>
                        )}
                      </View>
                      <Text style={detailStyles.showcaseName}>{getVariantShortName(v)}</Text>
                      <Text style={detailStyles.showcaseMeta}>¥{v.salePrice} · 库存{v.stockQuantity}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {hiddenVariant && (
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#FFE0EC',
                  borderRadius: 20,
                  padding: 14,
                  width: '70%',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#FFB3C0',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF6B9A', marginBottom: 6 }}>★ 隐藏款 ★</Text>
                  {parseImageUrl(hiddenVariant.customImages) ? (
                    <Image
                      source={{ uri: parseImageUrl(hiddenVariant.customImages) }}
                      style={{ width: 90, height: 90, borderRadius: 12, marginBottom: 6 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 48 }}>★</Text>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#222' }}>
                    {getVariantShortName(hiddenVariant)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>1/{machine.guaranteeDraws || 144} 概率</Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ paddingBottom: 30, paddingTop: 14 }}>
            <TouchableOpacity
              style={[detailStyles.primaryBtn, { marginHorizontal: 14 }]}
              onPress={() => setPageMode('pick')}
              activeOpacity={0.85}
            >
              <Text style={detailStyles.primaryBtnText}>返回抽盒</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ========== 倒计时/购买页面 ==========
  if (pageMode === 'buy') {
    return (
      <View style={detailStyles.container}>
        <PageHeader title="在线抽盒" onBack={goBack} />

        <View style={detailStyles.timerBadge}>
          <Text style={detailStyles.timerBadgeText}>⏱ {formatTime(remainingSeconds)}</Text>
        </View>

        <View style={detailStyles.countdownBox}>
          <Text style={[detailStyles.countdownTitleSmall, { marginBottom: 8, fontSize: 16 }]}>
            {machine.machineName}
          </Text>
          <View style={detailStyles.countdownImage}>
            <Text style={{ fontSize: 80 }}>📦</Text>
          </View>
          <Text style={detailStyles.countdownSerial}>{serialNo}</Text>
        </View>

        <View style={detailStyles.variantSmallSection}>
          <Text style={detailStyles.variantSmallTitle}>
            {regularVariants.length}款普通{hiddenVariant ? ` + 1款隐藏` : ''}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {regularVariants.slice(0, 6).map((v) => {
                const img = parseImageUrl(v.customImages);
                return (
                  <View key={v.saleVariantId} style={{ alignItems: 'center', marginHorizontal: 6 }}>
                    <View style={detailStyles.variantSmallBox}>
                      {img ? (
                        <Image source={{ uri: img }} style={detailStyles.variantSmallImage} contentFit="cover" />
                      ) : (
                        <Text style={{ fontSize: 18 }}>?</Text>
                      )}
                    </View>
                    <Text style={detailStyles.variantSmallName} numberOfLines={1}>
                      {getVariantShortName(v).slice(0, 4)}
                    </Text>
                  </View>
                );
              })}
              {hiddenVariant && (
                <View style={{ alignItems: 'center', marginHorizontal: 6 }}>
                  <View style={[detailStyles.variantSmallBox, { backgroundColor: '#FFE0EC', borderWidth: 1.5, borderColor: '#FFB3C0' }]}>
                    {parseImageUrl(hiddenVariant.customImages) ? (
                      <Image
                        source={{ uri: parseImageUrl(hiddenVariant.customImages) }}
                        style={detailStyles.variantSmallImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 18 }}>★</Text>
                    )}
                  </View>
                  <Text style={[detailStyles.variantSmallName, { color: '#FF6B9A', fontWeight: '700' }]}>隐藏</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={detailStyles.buyBtn}
          onPress={() => setShowPayConfirm(true)}
          disabled={drawing || paying || queueStatus === 'WAITING'}
          activeOpacity={0.85}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : drawing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={detailStyles.buyBtnText}>立即支付 ¥{machine.drawPrice}</Text>
          )}
        </TouchableOpacity>
        <Text style={detailStyles.buySubText}>支付后开盒，款式立即揭晓</Text>

        {/* 支付确认弹窗 */}
        <Modal visible={showPayConfirm} transparent animationType="fade" onRequestClose={() => setShowPayConfirm(false)}>
          <View style={detailStyles.modalOverlay}>
            <View style={detailStyles.payConfirmCard}>
              <TouchableOpacity style={detailStyles.closeBtn} onPress={() => setShowPayConfirm(false)}>
                <Text style={detailStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={detailStyles.payConfirmTitle}>确认订单信息</Text>
              <View style={detailStyles.payConfirmInfo}>
                <Text style={detailStyles.payConfirmLabel}>商品</Text>
                <Text style={detailStyles.payConfirmValue} numberOfLines={2}>{machine.machineName} - 盲盒</Text>
              </View>
              <View style={detailStyles.payConfirmInfo}>
                <Text style={detailStyles.payConfirmLabel}>编号</Text>
                <Text style={detailStyles.payConfirmValue}>{serialNo}</Text>
              </View>
              <View style={detailStyles.payConfirmInfo}>
                <Text style={detailStyles.payConfirmLabel}>金额</Text>
                <Text style={[detailStyles.payConfirmValue, { color: '#FF6B9A', fontWeight: '700' }]}>¥{machine.drawPrice}</Text>
              </View>
              <View style={detailStyles.payConfirmTip}>
                <Text style={detailStyles.payConfirmTipText}>
                  ⚠ 支付完成后请在"在线抽盒"右上角盒柜手动发货
                </Text>
              </View>
              <TouchableOpacity
                style={detailStyles.payConfirmBtn}
                onPress={() => {
                  setShowPayConfirm(false);
                  setShowCashier(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={detailStyles.payConfirmBtnText}>确认信息并支付</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 收银台弹窗 */}
        <Modal visible={showCashier} transparent animationType="slide" onRequestClose={() => setShowCashier(false)}>
          <View style={detailStyles.modalOverlay}>
            <View style={detailStyles.cashierCard}>
              <Text style={detailStyles.cashierTitle}>收银台</Text>
              <Text style={detailStyles.cashierAmount}>¥{machine.drawPrice}</Text>
              <Text style={detailStyles.cashierHint}>选择支付方式</Text>
              <TouchableOpacity
                style={[detailStyles.payMethodBtn, paymentMethod === 'WECHAT' && detailStyles.payMethodBtnActive]}
                onPress={() => setPaymentMethod('WECHAT')}
              >
                <Text style={detailStyles.payMethodIcon}>💚</Text>
                <Text style={detailStyles.payMethodText}>微信支付</Text>
                <Text style={detailStyles.payMethodCheck}>{paymentMethod === 'WECHAT' ? '●' : '○'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[detailStyles.payMethodBtn, paymentMethod === 'ALIPAY' && detailStyles.payMethodBtnActive]}
                onPress={() => setPaymentMethod('ALIPAY')}
              >
                <Text style={detailStyles.payMethodIcon}>💙</Text>
                <Text style={detailStyles.payMethodText}>支付宝</Text>
                <Text style={detailStyles.payMethodCheck}>{paymentMethod === 'ALIPAY' ? '●' : '○'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={detailStyles.cashierPayBtn}
                onPress={async () => {
                  setShowCashier(false);
                  await handleBuy();
                }}
                activeOpacity={0.85}
              >
                <Text style={detailStyles.cashierPayBtnText}>确认支付 ¥{machine.drawPrice}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCashier(false)} activeOpacity={0.6}>
                <Text style={detailStyles.cashierCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 抽中结果弹窗 */}
        <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={handleCloseResult}>
          <View style={detailStyles.modalOverlay}>
            <View style={detailStyles.resultCard}>
              <TouchableOpacity style={detailStyles.closeBtn} onPress={handleCloseResult}>
                <Text style={detailStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={detailStyles.resultCongrats}>恭喜抽中</Text>
              <Text style={detailStyles.resultTitle} numberOfLines={2}>
                {pickResult?.variantName || '未知款式'}
              </Text>
              {pickResult?.isHidden ? (
                <View style={detailStyles.resultHiddenBadge}>
                  <Text style={detailStyles.resultHiddenBadgeText}>★ 隐藏款 HIDDEN ★</Text>
                </View>
              ) : null}
              <View style={detailStyles.resultImage}>
                {pickResult && parseImageUrl(pickResult.variantImage) ? (
                  <Image
                    source={{ uri: parseImageUrl(pickResult.variantImage) }}
                    style={detailStyles.resultImageUri}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 80 }}>🎁</Text>
                )}
              </View>
              <Text style={{ fontSize: 11, color: '#999', letterSpacing: 1 }}>
                {serialNo}
              </Text>

              <View style={detailStyles.resultRowBtns}>
                <TouchableOpacity style={detailStyles.resultBtnReturn} onPress={() => {
                  handleCloseResult();
                  router.push('/blind-box/storage');
                }} activeOpacity={0.8}>
                  <Text style={detailStyles.resultBtnReturnText}>📦 暂存柜</Text>
                </TouchableOpacity>
                <TouchableOpacity style={detailStyles.resultBtnPoster} onPress={handleGeneratePoster} activeOpacity={0.8}>
                  <Text style={detailStyles.resultBtnPosterText}>📤 分享</Text>
                </TouchableOpacity>
                <TouchableOpacity style={detailStyles.resultBtnAgain} onPress={handleReturnToDraw} activeOpacity={0.8}>
                  <Text style={detailStyles.resultBtnAgainText}>🔄 再抽一盒</Text>
                </TouchableOpacity>
              </View>

              <View style={detailStyles.drawnScrollWrap}>
                <Text style={{ fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 8 }}>
                  你已抽到 {drawnList.length} 款
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={detailStyles.drawnScroll}>
                    {drawnList.map((d, i) => {
                      const img = parseImageUrl(d.variantImage);
                      return (
                        <View key={i} style={detailStyles.drawnItem}>
                          <View style={[detailStyles.drawnBox, d.isHidden && { backgroundColor: '#FFE0EC' }]}>
                            {img ? (
                              <Image source={{ uri: img }} style={detailStyles.drawnImage} contentFit="cover" />
                            ) : (
                              <Text style={{ fontSize: 22 }}>🎁</Text>
                            )}
                          </View>
                          <Text style={[detailStyles.drawnName, d.isHidden && { color: '#FF6B9A', fontWeight: '700' }]} numberOfLines={1}>
                            {(d.variantName || '').slice(0, 4)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={{ marginTop: 16, width: screenWidth - 28 }}>
              <TouchableOpacity style={detailStyles.buyBtn} onPress={handleReturnToDraw} activeOpacity={0.85}>
                <Text style={detailStyles.buyBtnText}>再抽一盒</Text>
              </TouchableOpacity>
              <Text style={detailStyles.buySubText}>已存入暂存柜，可随时发货</Text>
            </View>
          </View>
        </Modal>

        {/* 开盒动画 */}
        <BoxOpenAnimation
          visible={showOpenAnim}
          isHidden={!!pickResult?.isHidden}
          variantImage={pickResult ? parseImageUrl(pickResult.variantImage) : ''}
          variantName={pickResult?.variantName || ''}
          onDone={handleOpenAnimDone}
        />
      </View>
    );
  }

  return null;
}

// ========== 辅助函数 ==========
function isHiddenVariant(v: SaleVariantItem): boolean {
  const name = (v.variantName || v.customDescription || v.skuCode || '').toLowerCase();
  return name.includes('隐藏') || name.includes('hidden') || name.includes('稀有');
}

function getVariantShortName(v: SaleVariantItem): string {
  return v.variantName || v.customDescription || v.skuCode || '未知款式';
}
