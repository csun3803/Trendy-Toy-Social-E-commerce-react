import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Svg, Path } from 'react-native-svg';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemDetail();
  }, [itemId]);

  const loadItemDetail = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('获取展品详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const attributes = [
    { icon: '🎀', label: '类型', value: '娃娃' },
    { icon: '🔤', label: '数量', value: '1' },
    { icon: '📏', label: '尺寸', value: '20cm' },
    { icon: '🏪', label: '店铺', value: '一口酪酪乳' },
    { icon: '⭐', label: '特征', value: '头发·直炸毛,眼睛·蓝色,体型·正常体,表情·开心,发色·其他' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20doll%20with%20blue%20ribbon&image_size=portrait_4_3' }}
        style={styles.mainImage}
      />
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024">
              <Path 
                d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
                fill="#000" 
              />
            </Svg>
          </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <svg
            t="1776321028294"
            className="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="5791"
            width={200}
            height={200}
          >
            <path
              d="M744.5 544.4c-10.6 0-21.1-4-29.2-12.1-16.1-16.1-16.1-42.3 0-58.4l122.5-122.5L670.4 184 547.7 306.4c-16.1 16.1-42.3 16.1-58.4 0s-16.1-42.3 0-58.4l124.9-124.9c30.9-30.9 79-33.1 107.2-4.8l182 182c28.2 28.2 26 76.3-4.9 107.2L773.6 532.3c-8 8.1-18.6 12.1-29.1 12.1z"
              fill="#333333"
              p-id="5792"
            />
            <path
              d="M746.5 542.3c-10.6 0-21.1-4-29.2-12.1L491.4 304.3c-16.1-16.1-16.1-42.3 0-58.4s42.3-16.1 58.4 0l225.9 225.9c16.1 16.1 16.1 42.3 0 58.4-8 8.1-18.6 12.1-29.2 12.1z"
              fill="#333333"
              p-id="5793"
            />
            <path
              d="M153.9 924.1c-15 0-29.4-5.8-39.9-16.4-13.1-13.1-18.8-32.1-15.3-50.8l43.6-231.4c4.6-24.3 17-47.5 35-65.5l312.1-312c16.1-16.1 42.3-16.1 58.4 0s16.1 42.3 0 58.4L235.7 618.5c-6.4 6.4-10.7 14.3-12.2 22.4l-36.6 194 194-36.6c8.1-1.5 16-5.9 22.4-12.2L715.4 474c16.1-16.1 42.3-16.1 58.4 0s16.1 42.3 0 58.4l-312.2 312c-18 18-41.2 30.4-65.4 35L164.7 923c-3.6 0.7-7.2 1.1-10.8 1.1z"
              fill="#333333"
              p-id="5794"
            />
          </svg>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.itemName}>椰奶糕</Text>
            <View style={styles.tagContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagEmoji}>🎀</Text>
                <Text style={styles.tagText}>椰奶糕</Text>
              </View>
            </View>
          </View>

          <View style={styles.attributesSection}>
            {attributes.map((attr, index) => (
              <View 
                key={index} 
                style={[
                  styles.attributeRow,
                  index === attributes.length - 1 && styles.lastAttributeRow
                ]}
              >
                <View style={styles.attributeLeft}>
                  <Text style={styles.attributeIcon}>{attr.icon}</Text>
                  <Text style={styles.attributeLabel}>{attr.label}</Text>
                </View>
                <Text 
                  style={[
                    styles.attributeValue,
                    attr.label === '店铺' && styles.shopValue
                  ]}
                >
                  {attr.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  itemName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#FF6B9D',
  },
  attributesSection: {
    backgroundColor: '#FFFFFF',
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastAttributeRow: {
    borderBottomWidth: 0,
  },
  attributeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attributeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  attributeLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  attributeValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  shopValue: {
    color: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
});
